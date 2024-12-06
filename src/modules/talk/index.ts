import { bindThis } from '@/decorators.js';
import { HandlerResult } from '@/ai.js';
import Module from '@/module.js';
import Message from '@/message.js';
import serifs, { getSerif } from '@/serifs.js';
import getDate from '@/utils/get-date.js';

/* eslint @stylistic/multiline-ternary: "off" */
/* eslint @stylistic/operator-linebreak: ["error", "after", { "overrides": { "?": "none", ":": "after" } }] */
/* eslint @stylistic/indent: ["error", "tab", { "flatTernaryExpressions": true }] */

export default class extends Module {
	public readonly name = 'talk';

	@bindThis
	public install() {
		return {
			mentionHook: this.mentionHook
		};
	}

	@bindThis
	private async mentionHook(msg: Message) {
		if (!msg.text) return false;

		return (
			this.greet(msg) ||
			this.erait(msg) ||
			this.omedeto(msg) ||
			this.nadenade(msg) ||
			this.kawaii(msg) ||
			this.suki(msg) ||
			this.hug(msg) ||
			this.humu(msg) ||
			this.batou(msg) ||
			this.itai(msg) ||
			this.ote(msg) ||
			this.ponkotu(msg) ||
			this.rmrf(msg) ||
			this.shutdown(msg)
		);
	}

	@bindThis
	private greet(msg: Message): boolean {
		if (msg.text == null) return false;

		const incLove = () => {
			//#region 1日に1回だけ親愛度を上げる
			const today = getDate();

			const data = msg.friend.getPerModulesData(this);

			if (data.lastGreetedAt == today) return;

			data.lastGreetedAt = today;
			msg.friend.setPerModulesData(this, data);

			msg.friend.incLove();
			//#endregion
		};

		if (msg.includes(['こんにちは', 'こんにちわ'])) {
			msg.reply(serifs.core.hello(msg.friend.name));
			incLove();
			return true;
		}

		if (msg.includes(['こんばんは', 'こんばんわ'])) {
			msg.reply(serifs.core.helloNight(msg.friend.name));
			incLove();
			return true;
		}

		if (msg.includes(['おは', 'おっは', 'お早う'])) {
			msg.reply(serifs.core.goodMorning(msg.friend.name));
			incLove();
			return true;
		}

		if (msg.includes(['おやすみ', 'お休み'])) {
			msg.reply(serifs.core.goodNight(msg.friend.name));
			incLove();
			return true;
		}

		if (msg.includes(['行ってくる', '行ってきます', 'いってくる', 'いってきます'])) {
			msg.reply(serifs.core.itterassyai(msg.friend.name));
			incLove();
			return true;
		}

		if (msg.includes(['ただいま'])) {
			msg.reply(serifs.core.okaeri(msg.friend.name));
			incLove();
			return true;
		}

		return false;
	}

	@bindThis
	private erait(msg: Message): boolean {
		if (!msg.includes(['褒めて', 'ほめて'])) return false;

		msg.reply(getSerif(serifs.core.erait));

		return true;
	}

	@bindThis
	private omedeto(msg: Message): boolean {
		if (!msg.includes(['おめでと'])) return false;

		msg.reply(getSerif(serifs.core.omedeto));

		return true;
	}

	@bindThis
	private nadenade(msg: Message): boolean | HandlerResult {
		if (!msg.includes(['なでなで'])) return false;

		//#region 1日に1回だけ親愛度を上げる(嫌われてない場合のみ)
		if (msg.friend.love >= 0) {
			const today = getDate();

			const data = msg.friend.getPerModulesData(this);

			if (data.lastNadenadeAt != today) {
				data.lastNadenadeAt = today;
				msg.friend.setPerModulesData(this, data);

				msg.friend.incLove();
			}
		}
		//#endregion

		return {
			reaction: msg.friend.love <= -1 ? '🤮' : '😟'
		};
	}

	@bindThis
	private kawaii(msg: Message): boolean | HandlerResult {
		if (!msg.includes(['かわいい', '可愛い'])) return false;

		return {
			reaction: msg.friend.love <= -3 ? '🤮' : msg.friend.love <= 2 ? '😟' : '🙂'
		};
	}

	@bindThis
	private suki(msg: Message): boolean | HandlerResult {
		if (!msg.or(['好き', 'すき'])) return false;

		return {
			reaction: msg.friend.love >= 5 ? '🙂' : msg.friend.love >= 2 ? '😅' : msg.friend.love >= -1 ? '😟' : '😨'
		};
	}

	@bindThis
	private hug(msg: Message): boolean | HandlerResult {
		if (!msg.or(['ぎゅ', 'むぎゅ', /^はぐ(し(て|よ|よう)?)?$/])) return false;

		return {
			reaction: msg.friend.love >= 5 ? '🙂' : msg.friend.love >= 2 ? '😅' : msg.friend.love >= -1 ? '😟' : '😨'
		};
	}

	@bindThis
	private humu(msg: Message): boolean | HandlerResult {
		if (!msg.includes(['踏んで'])) return false;

		return {
			reaction: msg.friend.love >= 5 ? '🥴' : '🤨'
		};
	}

	@bindThis
	private batou(msg: Message): boolean | HandlerResult {
		if (!msg.includes(['罵倒して', '罵って'])) return false;

		return {
			reaction: msg.friend.love >= 5 ? '🥴' : '🤨'
		};
	}

	@bindThis
	private itai(msg: Message): boolean | HandlerResult {
		if (!msg.or(['痛い', 'いたい']) && !msg.extractedText.endsWith('痛い')) return false;

		return {
			reaction: ['🏥', '🚑', '💉', '🩹'][Math.floor(Math.random() * 4)]
		};
	}

	@bindThis
	private ote(msg: Message): boolean {
		if (!msg.or(['お手'])) return false;

		msg.reply(serifs.core.ote);

		return true;
	}

	@bindThis
	private ponkotu(msg: Message): boolean | HandlerResult {
		if (!msg.includes(['ぽんこつ'])) return false;

		msg.friend.decLove();

		return {
			reaction: 'angry'
		};
	}

	@bindThis
	private rmrf(msg: Message): boolean | HandlerResult {
		if (!msg.includes(['rm -rf'])) return false;

		msg.friend.decLove();

		return {
			reaction: 'angry'
		};
	}

	@bindThis
	private shutdown(msg: Message): boolean | HandlerResult {
		if (!msg.includes(['shutdown'])) return false;

		return {
			reaction: '🤨'
		};
	}
}
