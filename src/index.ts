// AiOS bootstrapper

import process from 'node:process';
import chalk from 'chalk';
import promiseRetry from 'promise-retry';

import { api as misskeyApi } from 'misskey-js';

import 藍 from './ai.js';
import config from './config.js';
import _log from './utils/log.js';
import pkg from '../package.json' assert { type: 'json' };

import CoreModule from './modules/core/index.js';
import TalkModule from './modules/talk/index.js';
import BirthdayModule from './modules/birthday/index.js';
import PingModule from './modules/ping/index.js';
import EmojiModule from './modules/emoji/index.js';
import EmojiReactModule from './modules/emoji-react/index.js';
import TarotModule from './modules/tarot/index.js';
import GuessingGameModule from './modules/guessing-game/index.js';
import KazutoriModule from './modules/kazutori/index.js';
import KeywordModule from './modules/keyword/index.js';
import TimerModule from './modules/timer/index.js';
import DiceModule from './modules/dice/index.js';
import ServerModule from './modules/server/index.js';
import FollowModule from './modules/follow/index.js';
import ValentineModule from './modules/valentine/index.js';
import MazeModule from './modules/maze/index.js';
import SleepReportModule from './modules/sleep-report/index.js';
import NotingModule from './modules/noting/index.js';
import PollModule from './modules/poll/index.js';
import ReminderModule from './modules/reminder/index.js';
import CheckCustomEmojisModule from './modules/check-custom-emojis/index.js';

/* eslint-disable no-console */
console.log('   __    ____  _____  ___ ');
console.log('  /__\\  (_  _)(  _  )/ __)');
console.log(' /(__)\\  _)(_  )(_)( \\__ \\');
console.log('(__)(__)(____)(_____)(___/\n');
/* eslint-enable no-console */

function log(msg: string): void {
	_log(`[Boot]: ${msg}`);
}

log(chalk.bold(`Ai v${pkg._v}`));

process.on('uncaughtException', err => {
	try {
		/* eslint-disable no-console */
		console.error(`Uncaught exception: ${err.message}`);
		console.dir(err, { colors: true, depth: 2 });
		/* eslint-enable no-console */
	} catch { /* nop */ }
});

const apiClient = new misskeyApi.APIClient({
	origin: config.host,
	credential: config.i
});

promiseRetry(retry => {
	log(`Account fetching... ${chalk.gray(config.host)}`);

	// アカウントをフェッチ
	return apiClient.request('i', {}).catch(retry);
}, {
	retries: 20,
	minTimeout: 5 * 1000,
	maxTimeout: 180 * 1000
}).then(account => {
	const acct = `@${account.username}`;
	log(chalk.green(`Account fetched successfully: ${chalk.underline(acct)}`));

	log('Starting AiOS...');

	// 藍起動
	new 藍(account, [
		new CoreModule(),
		new EmojiModule(),
		new EmojiReactModule(),
		new TarotModule(),
		new GuessingGameModule(),
		new KazutoriModule(),
		new TimerModule(),
		new DiceModule(),
		new TalkModule(),
		new PingModule(),
		...(config.serverMonitoring ? [new ServerModule()] : []),
		new FollowModule(),
		new BirthdayModule(),
		new ValentineModule(),
		...(config.keywordEnabled ? [new KeywordModule()] : []),
		...(config.mazeDisabled === true ? [] : [new MazeModule()]),
		new SleepReportModule(),
		...(config.notingEnabled ? [new NotingModule()] : []),
		...(config.pollDisabled === true ? [] : [new PollModule()]),
		new ReminderModule(),
		...(config.checkEmojisEnabled ? [new CheckCustomEmojisModule()] : [])
	], config);
}).catch(_e => {
	log(chalk.red('Failed to fetch the account'));
});
