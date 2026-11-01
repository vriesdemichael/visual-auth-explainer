// Does what the page on running this at home says, with its own commands, against a real server. So
// the page cannot go on promising something that stopped working. Exits 1 when a step does not work.
import { execFileSync, spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from '@playwright/test';
import { defaultSettings } from '#lib/flow/settings.ts';
import { recordedIndex } from '#lib/recordings/known.ts';
import {
	KEYCLOAK,
	LOCAL_REALM,
	PASSWORD,
	PASTE_CODE,
	PASTE_TOKEN,
	REDIRECT_URI,
	runYourself,
	USERNAME,
	type AtHome
} from '#lib/recordings/run-yourself.ts';

const version = process.argv[2] ?? recordedIndex.keycloak;
const variants: { name: string; settings: Partial<AtHome>; asks?: boolean }[] = [
	{ name: 'an app with a secret', settings: {} },
	{ name: 'an app with no secret', settings: { clientType: 'public' } },
	{ name: 'PKCE', settings: { pkce: true } },
	{ name: 'PKCE with no secret', settings: { clientType: 'public', pkce: true } },
	{ name: 'OpenID Connect', settings: { oidc: true } },
	{ name: 'asking the user to agree', settings: { consent: true }, asks: true }
];
// So that Git Bash on Windows leaves the path in the docker command alone.
const env = { ...process.env, MSYS_NO_PATHCONV: '1' };
const bash = (script: string, cwd: string) =>
	execFileSync('bash', ['-c', script], {
		cwd,
		env,
		encoding: 'utf8',
		stdio: ['ignore', 'pipe', 'pipe']
	});

function bodyOf(answer: string) {
	const [head, ...rest] = answer.replaceAll('\r\n', '\n').split('\n\n');
	const status = Number(head.match(/^HTTP\/\S+ (\d+)/)?.[1]);
	return { status, body: JSON.parse(rest.join('\n\n')) as Record<string, unknown> };
}

async function serverIsUp() {
	for (let i = 0; i < 90; i++) {
		try {
			if ((await fetch(`${KEYCLOAK}/realms/${LOCAL_REALM}`)).ok) return;
		} catch {
			// Not up yet.
		}
		await new Promise((resolve) => setTimeout(resolve, 2000));
	}
	throw new Error('The server did not start with the published command');
}

const browser = await chromium.launch();
let failed = false;
for (const { name, settings, asks } of variants) {
	const commands = runYourself({ ...defaultSettings, ...settings }, version);
	const folder = mkdtempSync(join(tmpdir(), 'authlines-'));
	const server = spawn('bash', ['-c', commands.start], { cwd: folder, env, stdio: 'ignore' });
	try {
		await serverIsUp();
		const page = await browser.newPage();
		let redirected = '';
		page.on('request', (request) => {
			if (request.url().startsWith(REDIRECT_URI)) redirected = request.url();
		});
		await page.goto(commands.login);
		await page.fill('input[name="username"]', USERNAME);
		await page.fill('input[name="password"]', PASSWORD);
		await page.click('[type="submit"]').catch(() => {});
		if (asks) await page.click('input[name="accept"]').catch(() => {});
		for (let i = 0; i < 50 && !redirected; i++) await page.waitForTimeout(100);
		await page.close();
		const code = new URL(redirected).searchParams.get('code');
		if (!code) throw new Error(`No code in the address the browser was sent to: ${redirected}`);

		const trade = bodyOf(bash(commands.trade.replace(PASTE_CODE, code), folder));
		if (trade.status !== 200 || typeof trade.body.access_token !== 'string') {
			throw new Error(`The trade answered ${trade.status}: ${JSON.stringify(trade.body)}`);
		}
		if (commands.who) {
			if (typeof trade.body.id_token !== 'string') throw new Error('No ID token, with openid');
			const who = bash(commands.who.replace(PASTE_TOKEN, trade.body.access_token), folder);
			const answer = bodyOf(who);
			if (answer.status !== 200 || answer.body.preferred_username !== USERNAME) {
				throw new Error(`UserInfo answered ${answer.status}: ${JSON.stringify(answer.body)}`);
			}
		}
		console.log(`ok ${name}`);
	} catch (error) {
		failed = true;
		console.log(`FAILED ${name}: ${(error as Error).message}`);
	} finally {
		try {
			execFileSync('docker', ['rm', '--force', commands.container], { stdio: 'ignore' });
		} catch {
			// It had gone already.
		}
		server.kill();
		rmSync(folder, { recursive: true, force: true });
	}
}
await browser.close();
process.exit(failed ? 1 : 0);
