process.env.NODE_ENV = 'test';

import { describe, test, expect, beforeAll } from 'vitest';
import { signup, post, api, sleep, generateConfig } from '../../utils';

import 藍 from '../../../src/ai';
import FortuneModule from '../../../src/modules/tarot/index';

describe('tarot モジュール', () => {
	let ai: Awaited<ReturnType<typeof signup>>;
	let user: Awaited<ReturnType<typeof signup>>;

	beforeAll(async () => {
		ai = await signup({});
		user = await signup({});

		new 藍(ai, [new FortuneModule()], generateConfig({ i: ai.token }));
		await sleep(1000);
	});

	test('メンションに反応する', async () => {
		const res = await post(user, { text: `@${ai.username} タロット` });
		await sleep(500);
		const children = await api('notes/children', { noteId: res.id });
		expect(children.body[0].cw).toBe('私が今日のあなたの運勢を占いました...');
		expect(children.body[0].text?.includes('正位置') || children.body[0].text?.includes('逆位置')).toBe(true);
	});
});
