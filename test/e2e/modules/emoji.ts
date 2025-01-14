process.env.NODE_ENV = 'test';

import { describe, test, expect, beforeAll } from 'vitest';
import { signup, post, api, sleep, generateConfig } from '../../utils';

import 藍 from '../../../src/ai';
import EmojiModule from '../../../src/modules/emoji/index';

describe('emoji モジュール', () => {
	let ai: Awaited<ReturnType<typeof signup>>;
	let user: Awaited<ReturnType<typeof signup>>;

	beforeAll(async () => {
		ai = await signup({});
		user = await signup({});

		new 藍(ai, [new EmojiModule()], generateConfig({ i: ai.token }));
		await sleep(1000);
	});

	test('メンションに反応する', async () => {
		const res = await post(user, { text: `@${ai.username} 絵文字` });
		await sleep(500);
		const children = await api('notes/children', { noteId: res.id });
		expect(children.body[0].text).toMatch(/^こんなのはどう？→([\u2600-\u27BF]|[\uD83C-\uD83F][\uDC00-\uDFFF]){3}$/);
	});
});
