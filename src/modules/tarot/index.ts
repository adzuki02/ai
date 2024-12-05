import { bindThis } from '@/decorators.js';
import Module from '@/module.js';
import Message from '@/message.js';
import serifs from '@/serifs.js';

const majorArcana = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21] as const;

function shuffleArray<T>(array: T[]): T[] {
	const randValues = crypto.getRandomValues(new Uint8Array(array.length));
	return array.toSorted((a, b) => randValues[array.indexOf(a)] - randValues[array.indexOf(b)]);
}

function getShuffledMajorArcana(): ({ name: (typeof majorArcana)[number]; upright: boolean })[] {
	return shuffleArray([...majorArcana]).map(name => ({ name, upright: Math.random() > 0.5 }));
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
		if (msg.includes(['占', 'うらな', 'タロット'])) {
			if (!this.properlyConfigured) {
				msg.reply(serifs.tarot.notProperlyConfigured);
				return true;
			}

			const cards = getShuffledMajorArcana();

			const index = Math.floor(Math.random() * majorArcana.length);

			const selectedCard = cards[index];

			const selectedCardString = serifs.tarot.cardNameWithDirection(serifs.tarot.majorArcanaName(selectedCard.name), selectedCard.upright);

			/* eslint-disable no-irregular-whitespace */
			msg.reply(
				`<center>
$[x4 ${selectedCard.upright ? '' : '$[rotate.deg=180 '}${this.ai.getConfig('tarot')!.major[selectedCard.name]}${selectedCard.upright ? '' : ']'}]
　
${selectedCardString}
</center>`,
				{
					cw: serifs.tarot.cw(1)
				}
			);
			/* eslint-enable no-irregular-whitespace */

			return true;
		} else {
			return false;
		}
	}
}
