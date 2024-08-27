import * as childProcess from 'child_process';
import { bindThis } from '@/decorators.js';
import Module from '@/module.js';
import serifs from '@/serifs.js';
import config from '@/config.js';
import Message from '@/message.js';
import Friend from '@/friend.js';
import getDate from '@/utils/get-date.js';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import type { Channels } from 'misskey-js';
import type { ReversiGameDetailed, ReversiMatchResponse, UserLite, MeDetailed } from 'misskey-js/entities.js';
import type { Connection } from 'misskey-js/streaming.js';

const _filename = fileURLToPath(import.meta.url);
const _dirname = dirname(_filename);

// フォーム
export type Form = [{
	id: 'publish';
	type: 'switch';
	label: string;
	value: boolean;
}, {
	id: 'strength';
	type: 'radio';
	label: string;
	value: number;
	items: {
		label: string;
		value: number;
	}[];
}];

type BuiltinReversiMessage<T extends keyof Channels['reversiGame']['events']> = {
	type: T;
	body: Parameters<Channels['reversiGame']['events'][T]>[0];
};

export type ReversiMessage = {
	type: '_init_';
	body: {
		game: ReversiGameDetailed;
		form: Form;
		account: MeDetailed;
	};
} | {
	type: 'putStone';
	pos: number;
	id: string;
} | BuiltinReversiMessage<'started'>
| BuiltinReversiMessage<'log'>
| BuiltinReversiMessage<'ended'>;

export default class extends Module {
	public readonly name = 'reversi';

	/**
	 * リバーシストリーム
	 */
	private reversiConnection?: Connection;

	@bindThis
	public install() {
		if (!config.reversiEnabled) return {};

		this.reversiConnection = this.ai.connection.useChannel('reversi' as keyof Channels);

		// 招待されたとき
		this.reversiConnection.on('invited', msg => this.onReversiInviteMe(msg.user));

		// マッチしたとき
		this.reversiConnection.on('matched', msg => this.onReversiGameStart(msg.game));

		if (config.reversiEnabled) {
			const mainStream = this.ai.connection.useChannel('main');
			mainStream.on('pageEvent', msg => {
				if (msg.event === 'inviteReversi') {
					this.ai.api('reversi/match', {
						userId: msg.user.id
					});
				}
			});
		}

		return {
			mentionHook: this.mentionHook
		};
	}

	@bindThis
	private async mentionHook(msg: Message) {
		if (msg.includes(['リバーシ', 'オセロ', 'reversi', 'othello'])) {
			if (config.reversiEnabled) {
				msg.reply(serifs.reversi.ok);

				if (msg.includes(['接待'])) {
					msg.friend.updateReversiStrength(0);
				}

				this.ai.api('reversi/match', {
					userId: msg.userId
				});
			} else {
				msg.reply(serifs.reversi.decline);
			}

			return true;
		} else {
			return false;
		}
	}

	@bindThis
	private async onReversiInviteMe(inviter: UserLite) {
		this.log(`Someone invited me: @${inviter.username}`);

		if (config.reversiEnabled) {
			// 承認
			const game = await this.ai.api('reversi/match', {
				userId: inviter.id
			});

			this.onReversiGameStart(game);
		} else {
			// todo (リバーシできない旨をメッセージで伝えるなど)
		}
	}

	@bindThis
	private onReversiGameStart(game: ReversiMatchResponse) {
		let strength = 4;
		const friend = this.ai.lookupFriend(game.user1Id !== this.ai.account.id ? game.user1Id : game.user2Id)!;
		if (friend != null) {
			strength = friend.doc.reversiStrength ?? 4;
			friend.updateReversiStrength(null);
		}

		this.log(`enter reversi game room: ${game.id}`);

		// ゲームストリームに接続
		const gw = this.ai.connection.useChannel('reversiGame', {
			gameId: game.id
		});

		// フォーム
		const form: Form = [{
			id: 'publish',
			type: 'switch',
			label: '藍が対局情報を投稿するのを許可',
			value: true
		}, {
			id: 'strength',
			type: 'radio',
			label: '強さ',
			value: strength,
			items: [{
				label: '接待',
				value: 0
			}, {
				label: '弱',
				value: 2
			}, {
				label: '中',
				value: 3
			}, {
				label: '強',
				value: 4
			}, {
				label: '最強',
				value: 5
			}]
		}];

		//#region バックエンドプロセス開始
		const ai = childProcess.fork(_dirname + '/back.js');

		// バックエンドプロセスに情報を渡す
		ai.send({
			type: '_init_',
			body: {
				game: game,
				form: form,
				account: this.ai.account
			}
		});

		ai.on('message', (msg: ReversiMessage) => {
			if (msg.type == 'putStone') {
				gw.send('putStone', {
					pos: msg.pos,
					id: msg.id
				});
			} else if (msg.type == 'ended') {
				gw.dispose();
				this.onGameEnded(game);
			}
		});

		// ゲームストリームから情報が流れてきたらそのままバックエンドプロセスに伝える
		gw.addListener('updateSettings', data => {
			if (data.key === 'canPutEverywhere') {
				if (data.value === true) {
					gw.send('ready', false);
				} else {
					gw.send('ready', true);
				}
			}
		});

		gw.addListener('started', message => {
			ai.send({ type: 'started', body: message });
		});
		gw.addListener('log', message => {
			ai.send({ type: 'log', body: message });
		});
		gw.addListener('ended', message => {
			ai.send({ type: 'ended', body: message });
		});
		//#endregion

		// どんな設定内容の対局でも受け入れる
		setTimeout(() => {
			gw.send('ready', true);
		}, 1000);
	}

	@bindThis
	private onGameEnded(game: ReversiGameDetailed) {
		const user = game.user1Id == this.ai.account.id ? game.user2 : game.user1;

		//#region 1日に1回だけ親愛度を上げる
		const today = getDate();

		const friend = new Friend(this.ai, { user: user });

		const data = friend.getPerModulesData(this);

		if (data.lastPlayedAt != today) {
			data.lastPlayedAt = today;
			friend.setPerModulesData(this, data);

			friend.incLove();
		}
		//#endregion
	}
}
