// AI CORE

import * as fs from 'fs';
import { bindThis } from '@/decorators.js';
import loki from 'lokijs';
import { FormData, File } from 'formdata-node';
import chalk from 'chalk';
import { randomUUID } from 'node:crypto';
import WebSocket from 'ws';
import { api as misskeyApi, Stream } from 'misskey-js';
import type { Endpoints as MisskeyApiEndpoints } from 'misskey-js';
import type { MeDetailed, User, UserDetailed, Note, Notification, DriveFilesCreateResponse } from 'misskey-js/entities.js';

import type { Config } from '@/config.js';
import Module from '@/module.js';
import type { ModuleDoc } from '@/module.js';
import Message from '@/message.js';
import Friend, { FriendDoc } from '@/friend.js';
import log from '@/utils/log.js';
import { sleep } from './utils/sleep.js';
import pkg from '../package.json' assert { type: 'json' };

type MentionHook = (msg: Message) => Promise<boolean | HandlerResult>;
type ContextHook<ContextData = unknown> = (key: string | null, msg: Message, data: ContextData) => Promise<void | boolean | HandlerResult>;
type TimeoutCallback<TimerData = unknown> = (data: TimerData) => void;

export type HandlerResult = {
	reaction?: string | null;
	immediate?: boolean;
};

export type InstallerResult<ContextData, TimerData> = {
	mentionHook?: MentionHook;
	contextHook?: ContextHook<ContextData>;
	timeoutCallback?: TimeoutCallback<TimerData>;
};

export type Meta = {
	lastWakingAt: number;
};

/**
 * 藍
 */
export default class 藍 {
	public readonly version = pkg._v;
	public account: MeDetailed;
	public connection: Stream;
	public modules: Module[] = [];
	private config: Config;
	private mentionHooks: MentionHook[] = [];
	private contextHooks: { [moduleName: string]: ContextHook } = {};
	private timeoutCallbacks: { [moduleName: string]: TimeoutCallback } = {};
	public db: loki;
	public lastSleepedAt: number;
	private apiClient: misskeyApi.APIClient;

	private meta: loki.Collection<Meta>;

	private contexts: loki.Collection<{
		noteId?: string;
		userId?: string;
		module: string;
		key: string | null;
		data?: unknown;
	}>;

	private timers: loki.Collection<{
		id: string;
		module: string;
		insertedAt: number;
		delay: number;
		data?: unknown;
	}>;

	public friends: loki.Collection<FriendDoc>;
	public moduleData: loki.Collection<ModuleDoc>;

	/**
	 * 藍インスタンスを生成します
	 * @param account 藍として使うアカウント
	 * @param modules モジュール。先頭のモジュールほど高優先度
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	constructor(account: MeDetailed, modules: Module<any, any>[], config: Config) {
		this.account = account;
		this.modules = modules;
		this.config = config;

		this.apiClient = new misskeyApi.APIClient({
			origin: config.host,
			credential: config.i
		});

		let memoryDir = '.';
		if (config.memoryDir) {
			memoryDir = config.memoryDir;
		}
		const file = process.env.NODE_ENV === 'test' ? `${memoryDir}/test.memory.json` : `${memoryDir}/memory.json`;

		this.log(`Lodaing the memory from ${file}...`);

		this.db = new loki(file, {
			persistenceMethod: process.env.NODE_ENV !== 'test' ? 'fs' : 'memory',
			autoload: true,
			autosave: true,
			autosaveInterval: 1000,
			autoloadCallback: err => {
				if (err) {
					this.log(chalk.red(`Failed to load the memory: ${err}`));
				} else {
					this.log(chalk.green('The memory loaded successfully'));
					this.run();
				}
			}
		});
	}

	@bindThis
	public log(msg: string) {
		log(`[${chalk.magenta('AiOS')}]: ${msg}`);
	}

	@bindThis
	private run() {
		//#region Init DB
		this.meta = this.getCollection('meta', {});

		this.contexts = this.getCollection('contexts', {
			indices: ['key']
		});

		this.timers = this.getCollection('timers', {
			indices: ['module']
		});

		this.friends = this.getCollection('friends', {
			indices: ['userId']
		});

		this.moduleData = this.getCollection('moduleData', {
			indices: ['module']
		});
		//#endregion

		const meta = this.getMeta();
		this.lastSleepedAt = meta.lastWakingAt;

		// Init stream
		this.connection = new Stream(this.getConfig('host'), { token: this.getConfig('i') }, { WebSocket: WebSocket as unknown as Exclude<ConstructorParameters<typeof Stream>[2], undefined>['WebSocket'] });

		// start heartbeat
		setInterval(() => this.connection.heartbeat(), 1000 * 60);

		//#region Main stream
		const mainStream = this.connection.useChannel('main');

		// メンションされたとき
		mainStream.on('mention', async data => {
			if (data.userId == this.account.id) return; // 自分は弾く
			if (data.text && data.text.startsWith('@' + this.account.username)) {
				// Misskeyのバグで投稿が非公開扱いになる
				if (data.text == null) data = await this.api('notes/show', { noteId: data.id });
				this.onReceiveMessage(new Message(this, data));
			}
		});

		// 返信されたとき
		mainStream.on('reply', async data => {
			if (data.userId == this.account.id) return; // 自分は弾く
			if (data.text && data.text.startsWith('@' + this.account.username)) return;
			// Misskeyのバグで投稿が非公開扱いになる
			if (data.text == null) data = await this.api('notes/show', { noteId: data.id });
			this.onReceiveMessage(new Message(this, data));
		});

		// Renoteされたとき
		mainStream.on('renote', async data => {
			if (data.userId == this.account.id) return; // 自分は弾く
			if (data.text == null && (data.files || []).length == 0) return;

			if (data.user.isBot) {
				return;
			}

			if (this.getConfig('restrictCommunication') && data.user.host != null) {
				return;
			}

			// リアクションする
			this.api('notes/reactions/create', {
				noteId: data.id,
				reaction: 'love'
			});
		});

		// 通知
		mainStream.on('notification', data => {
			this.onNotification(data);
		});
		//#endregion

		// Install modules
		this.modules.forEach(m => {
			this.log(`Installing ${chalk.cyan.italic(m.name)}\tmodule...`);
			m.init(this);
			const res = m.install();
			if (res != null) {
				if (res.mentionHook) this.mentionHooks.push(res.mentionHook);
				if (res.contextHook) this.contextHooks[m.name] = res.contextHook;
				if (res.timeoutCallback) this.timeoutCallbacks[m.name] = res.timeoutCallback;
			}
		});

		// タイマー監視
		this.crawleTimer();
		setInterval(this.crawleTimer, 1000);

		setInterval(this.logWaking, 10000);

		this.log(chalk.green.bold('Ai am now running!'));
	}

	/**
	 * ユーザーから話しかけられたとき
	 * (メンション、リプライ、トークのメッセージ)
	 */
	@bindThis
	private async onReceiveMessage(msg: Message): Promise<void> {
		this.log(chalk.gray(`<<< An message received: ${chalk.underline(msg.id)}`));

		// Ignore message if the user is a bot
		// To avoid infinity reply loop.
		if (msg.user.isBot) {
			return;
		}

		// コミュニケーション対象の制限が有効
		if (this.getConfig('restrictCommunication')) {
			// フォロワー0のリモートユーザー
			if (msg.user.host != null && msg.friend.doc.user.followersCount === 0) {
				return;
			}
		}

		const isNoContext = msg.replyId == null;

		// Look up the context
		const context = isNoContext ? null : this.contexts.findOne({ noteId: msg.replyId });

		let reaction: string | null = 'love';
		let immediate: boolean = false;

		//#region
		const invokeMentionHooks = async () => {
			let res: boolean | HandlerResult | null = null;

			for (const handler of this.mentionHooks) {
				res = await handler(msg);
				if (res === true || typeof res === 'object') break;
			}

			if (res != null && typeof res === 'object') {
				if (res.reaction != null) reaction = res.reaction;
				if (res.immediate != null) immediate = res.immediate;
			}
		};

		// コンテキストがあればコンテキストフック呼び出し
		// なければそれぞれのモジュールについてフックが引っかかるまで呼び出し
		if (context != null) {
			const handler = this.contextHooks[context.module];
			const res = await handler(context.key, msg, context.data);

			if (res != null && typeof res === 'object') {
				if (res.reaction != null) reaction = res.reaction;
				if (res.immediate != null) immediate = res.immediate;
			}

			if (res === false) {
				await invokeMentionHooks();
			}
		} else {
			await invokeMentionHooks();
		}
		//#endregion

		if (!immediate && process.env.NODE_ENV !== 'test') {
			await sleep(1000);
		}

		// リアクションする
		if (reaction) {
			this.api('notes/reactions/create', {
				noteId: msg.id,
				reaction: reaction
			});
		}
	}

	@bindThis
	private onNotification(notification: Notification) {
		switch (notification.type) {
			// リアクションされたら親愛度を少し上げる
			// TODO: リアクション取り消しをよしなにハンドリングする
			case 'reaction': {
				if (notification.user.isBot) break;

				const friend = new Friend(this, { user: notification.user });
				friend.incLove(0.1);
				break;
			}

			case 'receiveFollowRequest': {
				if (notification.user.isBot) break;

				if (this.getConfig('restrictCommunication')) {
					this.api('users/show', { userId: notification.user.id }).then(_user => {
						const user = _user as UserDetailed;

						// フォロワー0のリモートユーザー
						if (user.host != null && user.followersCount === 0) {
							this.api('following/requests/reject', { userId: user.id });
						} else {
							this.api('following/requests/accept', { userId: user.id });
						}
					});
				}
				break;
			}

			default:
				break;
		}
	}

	@bindThis
	private crawleTimer() {
		const timers = this.timers.find();
		for (const timer of timers) {
			// タイマーが時間切れかどうか
			if (Date.now() - (timer.insertedAt + timer.delay) >= 0) {
				this.log(`Timer expired: ${timer.module} ${timer.id}`);
				this.timers.remove(timer);
				this.timeoutCallbacks[timer.module](timer.data);
			}
		}
	}

	@bindThis
	private logWaking() {
		this.setMeta({
			lastWakingAt: Date.now()
		});
	}

	/**
	 * データベースのコレクションを取得します
	 */
	@bindThis
	public getCollection<T extends object>(name: string, opts?: Partial<CollectionOptions<T>>): loki.Collection<T> {
		let collection: loki.Collection<T>;

		collection = this.db.getCollection(name);

		if (collection == null) {
			collection = this.db.addCollection(name, opts);
		}

		return collection;
	}

	@bindThis
	public lookupFriend(userId: User['id']): Friend | null {
		const doc = this.friends.findOne({
			userId: userId
		});

		if (doc == null) return null;

		const friend = new Friend(this, { doc: doc });

		return friend;
	}

	/**
	 * ファイルをドライブにアップロードします
	 */
	@bindThis
	public async upload(file: Buffer | fs.ReadStream, meta: { filename: string; contentType: string }): Promise<DriveFilesCreateResponse> {
		const form = new FormData();
		form.set('i', this.getConfig('i'));
		form.set('file', new File([file], meta.filename, { type: meta.contentType }));

		return fetch(`${this.getConfig('apiUrl')}/drive/files/create`, {
			method: 'POST',
			body: form
		}).then(res => {
			if (res.ok) {
				return res.json();
			} else {
				throw res;
			}
		});
	}

	/**
	 * 投稿します
	 */
	@bindThis
	public async post(param: MisskeyApiEndpoints['notes/create']['req']): Promise<Note> {
		const res = await this.api('notes/create', param);
		return res.createdNote;
	}

	/**
	 * 指定ユーザーにトークメッセージを送信します
	 */
	@bindThis
	public sendMessage(userId: User['id'], param: MisskeyApiEndpoints['notes/create']['req']) {
		const friend = this.lookupFriend(userId);

		if (!friend) return;
		if (friend.doc.user.host != null && friend.doc.user.followersCount == undefined) return;
		if (friend.doc.user.host != null && friend.doc.user.followersCount === 0) return;

		return this.post(Object.assign({
			visibility: 'specified',
			visibleUserIds: [userId]
		}, param));
	}

	/**
	 * APIを呼び出します
	 */
	@bindThis
	public api<E extends keyof Omit<MisskeyApiEndpoints, 'signup' | 'signup-pending' | 'signin'>>(endpoint: E, param: MisskeyApiEndpoints[E]['req']): Promise<E extends 'users/show' ? (UserDetailed | UserDetailed[]) : MisskeyApiEndpoints[E]['res']> {
		this.log(`API: ${endpoint}`);

		return this.apiClient.request(endpoint as Parameters<misskeyApi.APIClient['request']>[0], param as Parameters<misskeyApi.APIClient['request']>[1]) as Promise<E extends 'users/show' ? (UserDetailed | UserDetailed[]) : MisskeyApiEndpoints[E]['res']>;
	};

	/**
	 * コンテキストを生成し、ユーザーからの返信を待ち受けます
	 * @param module 待ち受けるモジュール名
	 * @param key コンテキストを識別するためのキー
	 * @param id トークメッセージ上のコンテキストならばトーク相手のID、そうでないなら待ち受ける投稿のID
	 * @param data コンテキストに保存するオプションのデータ
	 */
	@bindThis
	public subscribeReply<ContextData, T>(module: Module<ContextData, T>, key: string | null, id: string, data?: ContextData) {
		this.contexts.insertOne({
			noteId: id,
			module: module.name,
			key: key,
			data: data
		});
	}

	/**
	 * 返信の待ち受けを解除します
	 * @param module 解除するモジュール名
	 * @param key コンテキストを識別するためのキー
	 */
	@bindThis
	public unsubscribeReply<C, T>(module: Module<C, T>, key: string | null) {
		this.contexts.findAndRemove({
			key: key,
			module: module.name
		});
	}

	/**
	 * 指定したミリ秒経過後に、そのモジュールのタイムアウトコールバックを呼び出します。
	 * このタイマーは記憶に永続化されるので、途中でプロセスを再起動しても有効です。
	 * @param module モジュール名
	 * @param delay ミリ秒
	 * @param data オプションのデータ
	 */
	@bindThis
	public setTimeoutWithPersistence<C, TimerData>(module: Module<C, TimerData>, delay: number, data?: TimerData) {
		const id = randomUUID();
		this.timers.insertOne({
			id: id,
			module: module.name,
			insertedAt: Date.now(),
			delay: delay,
			data: data
		});

		this.log(`Timer persisted: ${module.name} ${id} ${delay}ms`);
	}

	@bindThis
	public getMeta() {
		const rec = this.meta.findOne();

		if (rec) {
			return rec;
		} else {
			const initial: Meta = {
				lastWakingAt: Date.now()
			};

			this.meta.insertOne(initial);
			return initial;
		}
	}

	@bindThis
	public setMeta(meta: Partial<Meta>) {
		const rec = this.getMeta();

		const newMeta: Meta = {
			...rec,
			...meta
		};

		this.meta.update(newMeta);
	}

	@bindThis
	public getConfig<E extends keyof Config>(key: E): Config[E] {
		return this.config[key];
	}
}
