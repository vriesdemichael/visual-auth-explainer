// Does what the page on running this at home says, with its own commands, against a real server, for
// every combination of settings that page can show. So the page cannot go on promising something that
// stopped working. Exits 1 when a step does not work.
import { execFileSync, spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { chromium, firefox, webkit, type Browser, type BrowserType } from '@playwright/test';
import { defaultSettings } from '#lib/flow/settings.ts';
import type { Recording } from '#lib/recordings/format.ts';
import { recordedIndex } from '#lib/recordings/known.ts';
import {
	CODE_LASTS_MINUTES,
	KEYCLOAK,
	LOCAL_REALM,
	PASSWORD,
	PASTE_CODE,
	PASTE_TOKEN,
	READY_WHEN,
	REDIRECT_URI,
	runYourself,
	USERNAME,
	type AtHome
} from '#lib/recordings/run-yourself.ts';

const version = process.argv[2] ?? recordedIndex.keycloak;
const yesNo = [false, true];
const combinations: AtHome[] = yesNo.flatMap((isPublic) =>
	yesNo.flatMap((pkce) =>
		yesNo.flatMap((oidc) =>
			yesNo.map((consent) => ({
				clientType: isPublic ? ('public' as const) : ('confidential' as const),
				pkce,
				oidc,
				consent
			}))
		)
	)
);
const nameOf = (settings: AtHome) =>
	[
		settings.clientType === 'public' ? 'no secret' : 'a secret',
		settings.pkce && 'PKCE',
		settings.oidc && 'OpenID Connect',
		settings.consent && 'consent'
	]
		.filter(Boolean)
		.join(', ');
const isPlain = (settings: AtHome) =>
	settings.clientType === 'confidential' && !settings.pkce && !settings.oidc && !settings.consent;

// So that Git Bash on Windows leaves the path in the docker command alone.
const env = { ...process.env, MSYS_NO_PATHCONV: '1' };
const bash = (script: string, cwd: string) =>
	execFileSync('bash', ['-c', script], {
		cwd,
		env,
		encoding: 'utf8',
		stdio: ['ignore', 'pipe', 'pipe']
	});
const docker = (...args: string[]) =>
	execFileSync('docker', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const claimsOf = (jwt: string) =>
	JSON.parse(Buffer.from(jwt.split('.')[1], 'base64url').toString()) as Record<string, unknown>;

function bodyOf(answer: string) {
	const [head, ...rest] = answer.replaceAll('\r\n', '\n').split('\n\n');
	const status = Number(head.match(/^HTTP\/\S+ (\d+)/)?.[1]);
	return { status, body: JSON.parse(rest.join('\n\n')) as Record<string, unknown> };
}

async function serverIsUp(hasExited: () => boolean) {
	for (let i = 0; i < 90; i++) {
		// Not waiting three minutes for a server that has already given up.
		if (hasExited()) throw new Error('The published command stopped before the server was up');
		try {
			if ((await fetch(`${KEYCLOAK}/realms/${LOCAL_REALM}`)).ok) return;
		} catch {
			// Not up yet.
		}
		await new Promise((resolve) => setTimeout(resolve, 2000));
	}
	throw new Error('The server did not start with the published command');
}

/** Logs in the way the page says, and gives the address the browser was sent back to. */
async function logIn(browser: Browser, login: string, asks: boolean) {
	const context = await browser.newContext();
	const page = await context.newPage();
	let redirected = '';
	page.on('request', (request) => {
		if (request.url().startsWith(REDIRECT_URI)) redirected = request.url();
	});
	const sentBack = async () => {
		for (let i = 0; i < 80 && !redirected; i++) await page.waitForTimeout(100);
		if (!redirected) throw new Error('The browser was never sent back');
		return redirected;
	};
	await page.goto(login);
	await page.fill('input[name="username"]', USERNAME);
	await page.fill('input[name="password"]', PASSWORD);
	// The last of these ends at an address where nothing is listening, which is not a failure.
	await page.click('#kc-login').catch(() => {});
	if (asks) {
		await page
			.locator('[name="accept"]')
			.click()
			.catch(() => {});
	}
	const address = await sentBack();
	return {
		address,
		/** What the page says happens when someone opens the address again for a new code. */
		again: async () => {
			redirected = '';
			await page.goto(login).catch(() => {});
			const next = await sentBack();
			const asked = (await page.locator('input[name="username"]').count()) > 0;
			return { address: next, asked };
		},
		close: () => context.close()
	};
}

function checkTheStart(settings: AtHome, container: string) {
	const logs = docker('logs', container);
	if (!logs.includes(READY_WHEN)) throw new Error(`The server never said "${READY_WHEN}"`);
	const port = docker('port', container);
	if (/0\.0\.0\.0|\[::\]/.test(port)) throw new Error(`Others can reach it: ${port.trim()}`);
	void settings;
}

/** That what someone gets at home has the same parts as what was recorded, as the page says. */
function checkAgainstTheRecording(answer: Record<string, unknown>) {
	const recording = JSON.parse(
		readFileSync('static/recordings/authorization-code/oauth.json', 'utf8')
	) as Recording;
	const recorded = recording.messages.find(({ step }) => step === 'token-response')?.body as Record<
		string,
		unknown
	>;
	const names = (of: object) => JSON.stringify(Object.keys(of).sort());
	if (names(answer) !== names(recorded)) {
		throw new Error(`The answer differs: ${names(answer)} against ${names(recorded)}`);
	}
	const home = claimsOf(answer.access_token as string);
	const there = claimsOf(recorded.access_token as string);
	if (names(home) !== names(there)) {
		throw new Error(`The token differs: ${names(home)} against ${names(there)}`);
	}
}

async function adminToken() {
	const answer = await fetch(`${KEYCLOAK}/realms/master/protocol/openid-connect/token`, {
		method: 'POST',
		headers: { 'content-type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			grant_type: 'password',
			client_id: 'admin-cli',
			username: 'admin',
			password: 'throwaway-admin'
		})
	});
	return ((await answer.json()) as { access_token: string }).access_token;
}

const browser = await chromium.launch();
let failed = false;
const fail = (name: string, error: unknown) => {
	failed = true;
	console.log(`FAILED ${name}: ${(error as Error).message}`);
};

for (const settings of combinations) {
	const name = nameOf(settings);
	const commands = runYourself({ ...defaultSettings, ...settings }, version);
	// A real path, because Git Bash shows the temporary folder as /tmp, which means nothing to Docker.
	const folder = mkdtempSync(join(process.cwd(), 'node_modules', '.run-yourself-'));
	const server = spawn('bash', ['-c', commands.start], { cwd: folder, env, stdio: 'ignore' });
	let exited = false;
	server.on('exit', () => (exited = true));
	try {
		await serverIsUp(() => exited);
		checkTheStart(settings, commands.container);
		const login = await logIn(browser, commands.login, settings.consent);
		const code = new URL(login.address).searchParams.get('code');
		if (!code) throw new Error(`No code in the address it was sent to: ${login.address}`);
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
		if (isPlain(settings)) {
			checkAgainstTheRecording(trade.body);
			const again = bodyOf(bash(commands.trade.replace(PASTE_CODE, code), folder));
			if (again.status !== 400 || again.body.error !== 'invalid_grant') {
				throw new Error(
					`A code used twice answered ${again.status}: ${JSON.stringify(again.body)}`
				);
			}
			const next = await login.again();
			if (next.asked) throw new Error('Opening the address again asked for the password');
			if (!new URL(next.address).searchParams.get('code')) throw new Error('No new code');
			const realm = (await (
				await fetch(`${KEYCLOAK}/admin/realms/${LOCAL_REALM}`, {
					headers: { authorization: `Bearer ${await adminToken()}` }
				})
			).json()) as { accessCodeLifespan: number };
			if (realm.accessCodeLifespan !== CODE_LASTS_MINUTES * 60) {
				throw new Error(`A code lasts ${realm.accessCodeLifespan} seconds`);
			}
			// Other browsers treat a cookie on a plain address differently, so the login gets tried there.
			for (const [label, kind] of [
				['Firefox', firefox],
				['WebKit', webkit]
			] as [string, BrowserType][]) {
				const other = await kind.launch().catch((error: Error) => {
					// Installed in the scheduled job, and not always on someone's own machine.
					if (process.env.CI) throw error;
					console.log(`not tried in ${label}, which is not installed here`);
				});
				if (!other) continue;
				const there = await logIn(other, commands.login, false);
				if (!new URL(there.address).searchParams.get('code'))
					throw new Error(`No code in ${label}`);
				await other.close();
				console.log(`ok logging in with ${label}`);
			}
		}
		await login.close();
		console.log(`ok ${name}`);
	} catch (error) {
		fail(name, error);
	} finally {
		try {
			// The way the page says to stop it, which also leaves nothing running for the next one.
			bash(commands.stop, folder);
		} catch {
			// It had gone already.
		}
		server.kill();
		try {
			rmSync(folder, { recursive: true, force: true, maxRetries: 20, retryDelay: 500 });
		} catch {
			// Windows can hold on to it for a while after the shell has gone, and nothing depends on it.
		}
	}
}
await browser.close();
process.exit(failed ? 1 : 0);
