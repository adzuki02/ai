import { bindThis } from '@/decorators.js';
import Module from '@/module.js';
import Message from '@/message.js';
import serifs from '@/serifs.js';

const majorArcana = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21] as const;

// shuffle array in-place
function shuffleArray<T>(array: T[]): T[] {
	const randValues = crypto.getRandomValues(new Uint8Array(array.length));
	return array.sort((a, b) => randValues[array.indexOf(a)] - randValues[array.indexOf(b)]);
}

function getShuffledMajorArcana(): ({ name: (typeof majorArcana)[number]; upright: boolean })[] {
	// シャッフル
	// TODO: 本当はシャッフルしながら上下の向きも変わるようなのが理想
	const array = shuffleArray([...majorArcana]).map(name => ({ name, upright: Math.random() >= 0.5 }));

	// カット
	const cut = shuffleArray([array.slice(0, 7), array.slice(7, 14), array.slice(14, 22)]);

	return cut.flat();
}

export default class extends Module {
	public readonly name = 'tarot';

	private properlyConfigured: boolean;

	@bindThis
	public install() {
		this.properlyConfigured = (this.ai.getConfig('tarot')?.major.length ?? 0) >= 22;

		return {
			mentionHook: this.mentionHook
		};
	}

	@bindThis
	private async mentionHook(msg: Message) {
		if (!msg.includes(['占', 'うらな', 'タロット'])) {
			return false;
		}

		// 浄化
		// eslint-disable-next-line no-console
		console.log('🧂🧂🧂🧂🧂');

		return (
			this.twoOracle(msg) ||
			this.twoSpread(msg) ||
			this.celticCross(msg) ||
			this.hexagram(msg) ||
			this.oneOracle(msg)
		);
	}

	@bindThis
	private oneOracle(msg: Message): boolean {
		const cards = getShuffledMajorArcana();

		const index = Math.floor(Math.random() * majorArcana.length);

		const selectedCard = cards[index];

		const selectedCardString = serifs.tarot.cardNameWithDirection(serifs.tarot.majorArcanaName(selectedCard.name), selectedCard.upright);

		const replyText = '<center>'
			+ '$[x4 '
			+ (selectedCard.upright ? '' : '$[flip.v,h ')
			+ this.ai.getConfig('tarot')!.major[selectedCard.name]
			+ (selectedCard.upright ? '' : ']')
			+ ']\n'
			+ '\n'
			+ selectedCardString
			+ '</center>';

		msg.reply(replyText, { cw: serifs.tarot.cw(1) });

		return true;
	}

	@bindThis
	private twoOracle(msg: Message): boolean {
		if (!msg.includes(['ツーオラクル', 'ツー・オラクル'])) {
			return false;
		}

		const cards = getShuffledMajorArcana();

		const right = cards[6];
		const left = cards[13];

		const rightString = serifs.tarot.cardNameWithDirection(serifs.tarot.majorArcanaName(right.name), right.upright);
		const leftString = serifs.tarot.cardNameWithDirection(serifs.tarot.majorArcanaName(left.name), left.upright);

		const replyText = '<center>'
			+ '$[x4 '
			+ (left.upright ? '' : '$[flip.v,h ')
			+ this.ai.getConfig('tarot')!.major[left.name]
			+ (left.upright ? '' : ']')
			+ '　'
			+ (right.upright ? '' : '$[flip.v,h ')
			+ this.ai.getConfig('tarot')!.major[right.name]
			+ (right.upright ? '' : ']')
			+ ']\n'
			+ '\n'
			+ '\n'
			+ '右のカード【結果】：' + rightString + '\n'
			+ '左のカード【対策】：' + leftString + '\n'
			+ '</center>';

		msg.reply(replyText, { cw: serifs.tarot.cw(2) });

		return true;
	}

	@bindThis
	private twoSpread(msg: Message): boolean {
		if (!msg.includes(['ツースプレッド', 'ツー・スプレッド'])) {
			return false;
		}

		const cards = getShuffledMajorArcana();

		const top = cards[6];
		const bottom = cards[13];

		const topString = serifs.tarot.cardNameWithDirection(serifs.tarot.majorArcanaName(top.name), top.upright);
		const bottomString = serifs.tarot.cardNameWithDirection(serifs.tarot.majorArcanaName(bottom.name), bottom.upright);

		const replyText = '<center>'
			+ '$[x4 '
			+ (top.upright ? '' : '$[flip.v,h ')
			+ this.ai.getConfig('tarot')!.major[top.name]
			+ (top.upright ? '' : ']')
			+ ']\n'
			+ '　\n'
			+ '$[x4 '
			+ (bottom.upright ? '' : '$[flip.v,h ')
			+ this.ai.getConfig('tarot')!.major[bottom.name]
			+ (bottom.upright ? '' : ']')
			+ ']\n'
			+ '\n'
			+ '\n'
			+ '上のカード【表面意識】：' + topString + '\n'
			+ '下のカード【潜在意識】：' + bottomString + '\n'
			+ '</center>';

		msg.reply(replyText, { cw: serifs.tarot.cw(2) });

		return true;
	}

	private celticCross(msg: Message): boolean {
		if (!msg.includes(['ケルト十字'])) {
			return false;
		}

		const shuffled = getShuffledMajorArcana();

		const selected = [];

		for (let i = 0; i < 10; i++) {
			const card = shuffled.splice(Math.random() * shuffled.length, 1)[0];
			selected.push(card);
		}

		const selectedCardMfm = selected.map(card => `${card.upright ? '' : '$[flip.v,h '}${this.ai.getConfig('tarot')!.major[card.name]}${card.upright ? '' : ']'}`);

		const selectedCardText = selected.map(card => serifs.tarot.cardNameWithDirection(serifs.tarot.majorArcanaName(card.name), card.upright));

		const blank = this.ai.getConfig('tarot')!.blank;

		const replyText = '<center>\n'
			+ '$[x2 ' + blank + blank + selectedCardMfm[2] + blank + blank + blank + selectedCardMfm[9] + ']\n'
			+ '\n'
			+ '$[x2 ' + selectedCardMfm[4] + blank + selectedCardMfm[0] + '$[position.x=-1 $[rotate ' + selectedCardMfm[1] + ']]' + selectedCardMfm[5] + blank + selectedCardMfm[8] + ']\n'
			+ '\n'
			+ '$[x2 ' + blank + blank + selectedCardMfm[3] + blank + blank + blank + selectedCardMfm[7] + ']\n'
			+ '\n'
			+ '$[x2 ' + blank + blank + blank + blank + blank + blank + selectedCardMfm[6] + ']\n'
			+ '</center>\n'
			+ '\n'
			+ '\n'
			+ ' 1. 十字の中央・縦【現在の状況】：' + selectedCardText[0] + '\n'
			+ '*2. 十字の中央・横【原因】　　　：' + serifs.tarot.majorArcanaName(selected[1].name) + '\n'
			+ ' 3. 十字の上　　　【表面意識】　：' + selectedCardText[2] + '\n'
			+ ' 4. 十字の下　　　【潜在意識】　：' + selectedCardText[3] + '\n'
			+ ' 5. 十字の左　　　【過去】　　　：' + selectedCardText[4] + '\n'
			+ ' 6. 十字の右　　　【未来】　　　：' + selectedCardText[5] + '\n'
			+ ' 7. 棒の一番下【客観視したあなた】：' + selectedCardText[6] + '\n'
			+ ' 8. 棒の下から二番目【周囲の状況】：' + selectedCardText[7] + '\n'
			+ ' 9. 棒の下から三番目【願望】　　　：' + selectedCardText[8] + '\n'
			+ '10. 棒の下から四番目【結論】　　　：' + selectedCardText[9];

		msg.reply(replyText, { cw: serifs.tarot.cw(10) });

		return true;
	}

	private hexagram(msg: Message): boolean {
		if (!msg.includes(['ヘキサグラム'])) {
			return false;
		}

		const shuffled = getShuffledMajorArcana();

		const selected = [];

		for (let i = 0; i < 7; i++) {
			const card = shuffled.splice(Math.random() * shuffled.length, 1)[0];
			selected.push(card);
		}

		const selectedCardMfm = selected.map(card => `${card.upright ? '' : '$[flip.v,h '}${this.ai.getConfig('tarot')!.major[card.name]}${card.upright ? '' : ']'}`);

		const selectedCardText = selected.map(card => serifs.tarot.cardNameWithDirection(serifs.tarot.majorArcanaName(card.name), card.upright));

		const blank = this.ai.getConfig('tarot')!.blank;

		const replyText = '<center>\n'
			+ '$[x2 ' + selectedCardMfm[0] + ']\n'
			+ '$[x2 ' + selectedCardMfm[4] + blank + blank + blank + blank + selectedCardMfm[5] + ']\n'
			+ '$[x2 ' + selectedCardMfm[6] + ']\n'
			+ '$[x2 ' + selectedCardMfm[2] + blank + blank + blank + blank + selectedCardMfm[1] + ']\n'
			+ '$[x2 ' + selectedCardMfm[3] + ']\n'
			+ '</center>\n'
			+ '\n'
			+ '\n'
			+ ' 1. 上　【過去】　：' + selectedCardText[0] + '\n'
			+ ' 2. 右下【現在】　：' + selectedCardText[1] + '\n'
			+ ' 3. 左下【未来】　：' + selectedCardText[2] + '\n'
			+ '*4. 下　【対応策】：' + selectedCardText[3] + '\n'
			+ ' 5. 左上【周囲】　：' + selectedCardText[4] + '\n'
			+ ' 6. 右上【あなたの立場】：' + selectedCardText[5] + '\n'
			+ ' 7. 中央【結論】　：' + selectedCardText[6];

		msg.reply(replyText, { cw: serifs.tarot.cw(7) });

		return true;
	}
}
