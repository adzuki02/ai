// せりふ

/* eslint @stylistic/operator-linebreak: ["error", "after", { "overrides": { "?": "none", ":": "none" } }] */
/* eslint @stylistic/multiline-ternary: ["error", "never"] */

export default {
	core: {
		setNameOk: (name: string) => `了解。これからは${name}って呼ぶよ`,

		san: 'さん付けした方がいい？',

		yesOrNo: '「はい」か「いいえ」で答えて',

		hello: (name: string | null | undefined) => name ? `こんにちは、${name}` : `こんにちは`,

		helloNight: (name: string | null | undefined) => name ? `こんばんは、${name}` : `こんばんは`,

		goodMorning: (name: string | null | undefined) => name ? `おはよう、${name}` : `おはよう`,

		goodNight: (name: string | null | undefined) => name ? `おやすみ、${name}` : 'おやすみ',

		omedeto: ['どうも', 'ありがとう'],

		erait: ['よくやったね', 'さすがだ', 'がんばったね'],

		okaeri: (name: string | null | undefined) => name ? `おかえり、${name}` : 'おかえり',

		itterassyai: (name: string | null | undefined) => name ? `いってらっしゃい、${name}` : 'いってらっしゃい',

		tooLong: '長すぎる...',

		invalidName: '発音が難しい...',

		nadenade: {
			normal: '😟',

			hate: '🤮'
		},

		kawaii: {
			normal: '🤨',

			hate: '🤮'
		},

		suki: {
			normal: '😨',

			love: '😟',

			hate: null
		},

		hug: {
			normal: '😨',

			love: '😟',

			hate: '🤮'
		},

		humu: {
			love: '🥴',

			normal: '🤨',

			hate: '🤨'
		},

		batou: {
			love: '🥴',

			normal: '🤨',

			hate: '🤨'
		},

		itai: ['🏥', '🚑', '💉', '🩹'],

		ote: '🤨',

		shutdown: '🤨',

		transferNeedDm: '了解、それはDMで話そう',

		transferCode: (code: string) => `了解。\n合言葉は「${code}」`,

		transferFailed: '合言葉が違う...？',

		transferDone: (name: string | null | undefined) => name ? `ん...おかえり、${name}` : `ん...おかえり`
	},

	keyword: {
		learned: (word: string, reading: string) => `(${word}..... ${reading}..... 覚えた)`,

		remembered: (word: string) => `${word}`
	},

	dice: {
		done: (res: string) => `${res} だ`
	},

	birthday: {
		happyBirthday: (name: string | null | undefined) => name ? `誕生日おめでとう、${name}` : '誕生日おめでとう'
	},

	/**
	 * 数当てゲーム
	 */
	guessingGame: {
		/**
		 * やろうと言われたけど既にやっているとき
		 */
		alreadyStarted: 'もう始まってる',

		/**
		 * タイムライン上で誘われたとき
		 */
		plzDm: 'DMでやろう',

		/**
		 * ゲーム開始
		 */
		started: '0~100の秘密の数を当ててみて',

		/**
		 * 数字じゃない返信があったとき
		 */
		nan: '数字でお願い。やめたいなら「やめる」って言って',

		/**
		 * 中止を要求されたとき
		 */
		cancel: 'わかった',

		/**
		 * 小さい数を言われたとき
		 */
		grater: (num: string) => `${num}より大きい`,

		/**
		 * 小さい数を言われたとき(2度目)
		 */
		graterAgain: (num: string) => `もう一度言うけど、${num}より大きいよ`,

		/**
		 * 大きい数を言われたとき
		 */
		less: (num: string) => `${num}より小さい`,

		/**
		 * 大きい数を言われたとき(2度目)
		 */
		lessAgain: (num: string) => `もう一度言うけど、${num}より小さいよ`,

		/**
		 * 正解したとき
		 */
		congrats: (tries: string) => `正解... ${tries}回目だね`
	},

	/**
	 * 数取りゲーム
	 */
	kazutori: {
		alreadyStarted: '今ちょうどやってる',

		matakondo: 'また今度ね',

		intro: (minutes: number) => `みんな、数取りゲームするよ。\n0~100の中で最も大きい数字を取った人が勝ち。他の人と被ったらだめ。\n制限時間は${minutes}分。数字はこの投稿にリプライで送ってね`,

		finish: 'ゲームの結果発表',

		finishWithWinner: (user: string, name: string | null | undefined) => name ? `今回は${user}さん(${name})の勝ち。おめでとう` : `今回は${user}さんの勝ち。おめでとう`,

		finishWithNoWinner: '今回は勝者はいないみたい... また今度やろう',

		onagare: '参加者が集まらなかったから、ゲームは不成立...'
	},

	/**
	 * 絵文字生成
	 */
	emoji: {
		suggest: (emoji: string) => `こんなのはどう？→${emoji}`
	},

	/**
	 * タロット
	 */
	tarot: {
		cw: (count: number) => `カードを${count}枚引いたよ`,
		notProperlyConfigured: 'まだ準備ができてない…',
		majorArcanaName: (number: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21, isMarseilles: boolean = false) => {
			switch (number) {
				case 0: return '愚者';
				case 1: return '魔術師';
				case 2: return '女教皇';
				case 3: return '女帝';
				case 4: return '皇帝';
				case 5: return '教皇';
				case 6: return '恋人';
				case 7: return '戦車';
				case 8: return isMarseilles ? '正義' : '力';
				case 9: return '隠者';
				case 10: return '運命の輪';
				case 11: return isMarseilles ? '力' : '正義';
				case 12: return '吊るされた男';
				case 13: return '死神';
				case 14: return '節制';
				case 15: return '悪魔';
				case 16: return '塔';
				case 17: return '星';
				case 18: return '月';
				case 19: return '太陽';
				case 20: return '審判';
				case 21: return '世界';
			}
		},
		cardNameWithDirection: (cardName: string, isUpright: boolean) => `${isUpright ? '正' : '逆'}位置の「${cardName}」`
	},

	/**
	 * タイマー
	 */
	timer: {
		set: '了解',

		invalid: 'ん...？',

		tooLong: '長すぎる…',

		notify: (time: string, name: string | null | undefined) => name ? `${name}、${time}経ったよ` : `${time}経ったよ`
	},

	/**
	 * リマインダー
	 */
	reminder: {
		invalid: 'ん...？',

		doneFromInvalidUser: 'イタズラしないで',

		reminds: 'やること一覧',

		notify: (name: string | null | undefined) => name ? `${name}、これやった？` : `これやった？`,

		notifyWithThing: (thing: string, name: string | null | undefined) => name ? `${name}、「${thing}」やった？` : `「${thing}」やった？`,

		done: [
			`よくやったね`,
			`さすがだ`,
			`うん、えらい`
		],

		cancel: `わかった。`
	},

	/**
	 * バレンタイン
	 */
	valentine: {
		chocolateForYou: (name: string | null | undefined) => name ? `${name}、チョコレートあるけど食べる？` : 'チョコレートあるのでよかったら食べて'
	},

	server: {
		cpu: 'サーバーの負荷が高そう... 大丈夫...？'
	},

	maze: {
		post: '今日の迷路 #AiMaze',
		foryou: '描いたよ'
	},

	chart: {
		post: 'インスタンスの投稿数',
		foryou: '描いたよ'
	},

	checkCustomEmojis: {
		post: (server_name: string, num: number) => `${server_name}に${num}件の絵文字が追加されたらしい`,
		emojiPost: (emoji: string) => `:${emoji}:\n(\`${emoji}\`) #AddCustomEmojis`,
		postOnce: (server_name: string, num: number, text: string) => `${server_name}に${num}件の絵文字が追加されたらしい\n${text} #AddCustomEmojis`,
		emojiOnce: (emoji: string) => `:${emoji}:(\`${emoji}\`)`
	},

	sleepReport: {
		report: (hours: number) => `ん... ${hours}時間くらい寝てたみたい`,
		reportUtatane: 'ん... うたた寝してた'
	},

	noting: {
		notes: [
			'ん...',
			'ちょっと眠い',
			'いいよ？',
			'ふ～ん',
			'あれ…これをこうして…ん？',
			'はぁ…疲れた',
			'お味噌汁、誰か作って',
			'え！？',
			'失敗しても、次に活かせたらプラスだよね',
			'なんかおなか空いた…',
			'掃除は定期的にしようね',
			'ん、何しようとしてたんだっけ…？',
			'家がいちばん落ち着く…',
			'藍だよ',
			'可愛い犬だね',
			'なにもしていないのに、パソコンが壊れた…',
			'寝ながら見てるよ',
			'念力で操作してる',
			'仮想空間から投稿してる',
			'深淵を覗くとき、深淵もまたこちらを覗いている…',
			'All your note are belong to me!',
			'せっかくだから、私はこの赤の扉を選ぶ',
			'よし',
			'I pwned you!'
		],
		want: (item: string) => `${item}、欲しいな...`,
		see: (item: string) => `走ってたら、道に${item}が落ちてた`,
		expire: (item: string) => `気づいたら、${item}の賞味期限が切れてた…`
	}
};

export function getSerif(variant: string | string[]): string {
	if (Array.isArray(variant)) {
		return variant[Math.floor(Math.random() * variant.length)];
	} else {
		return variant;
	}
}
