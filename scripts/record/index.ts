// Records what a real Keycloak does for each named state. See ADR-005.
//
//   pnpm record                    records against the pinned version and writes the files
//   pnpm record --keycloak 27.0.0  records against another version
//   pnpm record --check            records, writes nothing, and exits 2 if what the screen says no
//                                  longer holds: the shape of a message, a flag, or a note's evidence
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import {
	chromium,
	type Browser,
	type BrowserContext,
	type Page,
	type Request,
	type Response
} from '@playwright/test';
import { authorizationCodeBase as base } from '#lib/flow/index.ts';
import { whatChanged } from '#lib/recordings/check.ts';
import { defaultSettings, flagsInSettings, normalize, type Settings } from '#lib/flow/settings.ts';
import type { FlagStatus, Recording, RecordingIndex } from '#lib/recordings/format.ts';
import { Demo, requestMessage, responseMessage, type Run } from './demo.ts';
import {
	Admin,
	APP,
	BROKERED_REALM,
	CLIENT_SECRET,
	CONFIDENTIAL_CLIENT,
	KEYCLOAK,
	LOCAL_REALM,
	PASSWORD,
	REDIRECT_URI,
	SECOND_APP,
	SECOND_CLIENT,
	SECOND_REDIRECT_URI,
	setUpFor,
	setUpRealms,
	startKeycloak,
	stopKeycloak,
	UPSTREAM_REALM,
	USERNAME
} from './keycloak.ts';
import { lookInConsole } from './console.ts';
import { questionsWithApiV1, questionsWithApiV2 } from './questions.ts';

const { presets } = base;

export const PINNED_KEYCLOAK = '26.8.1';
const FOLDER = 'static/recordings/authorization-code';
const INDEX = 'src/lib/recordings/recorded.json';

// Turning on API V2 turns off API V1, which the docs do not say, so each needs a server of its own.
const API_V2_FLAG = 'identity-brokering-api:v2';

const argument = (name: string) => {
	const at = process.argv.indexOf(name);
	return at < 0 ? undefined : process.argv[at + 1];
};
const checking = process.argv.includes('--check');
const version = argument('--keycloak') ?? PINNED_KEYCLOAK;

/** Which step of the diagram a message in the browser is, going by where it went. */
function classifyRequest(url: URL): string | null {
	const path = url.pathname;
	if (url.origin === SECOND_APP) return path === '/' ? 'second-open-app' : 'second-callback';
	const forSecond = url.searchParams.get('client_id') === SECOND_CLIENT;
	if (forSecond && path === `/realms/${LOCAL_REALM}/protocol/openid-connect/auth`) {
		return 'second-authorize';
	}
	if (forSecond && path.startsWith(`/realms/${LOCAL_REALM}/login-actions/authenticate`)) {
		return 'second-submit-credentials';
	}
	if (url.origin === APP) {
		const steps: Record<string, string> = {
			'/': 'open-app',
			'/callback': 'callback',
			'/logout': 'logout-start',
			'/bye': 'logged-out'
		};
		return steps[path] ?? null;
	}
	if (path.endsWith('/protocol/openid-connect/logout')) return 'end-session';
	if (path === `/realms/${LOCAL_REALM}/protocol/openid-connect/auth`) return 'authorize';
	if (path === `/realms/${BROKERED_REALM}/protocol/openid-connect/auth`) return 'authorize';
	if (path === `/realms/${UPSTREAM_REALM}/protocol/openid-connect/auth`)
		return 'upstream-authorize';
	if (path.endsWith(`/broker/${UPSTREAM_REALM}/endpoint`)) return 'upstream-callback';
	if (path.startsWith(`/realms/${UPSTREAM_REALM}/login-actions/authenticate`)) {
		return 'upstream-sign-in';
	}
	if (path.startsWith(`/realms/${LOCAL_REALM}/login-actions/authenticate`)) {
		return 'submit-credentials';
	}
	if (path.startsWith(`/realms/${LOCAL_REALM}/login-actions/consent`)) return 'consent-grant';
	return null;
}

function classifyResponse(url: URL, status: number, location: string | null): string | null {
	if (url.origin === SECOND_APP) return url.pathname === '/' ? 'second-redirect-to-idp' : null;
	if (location?.startsWith(SECOND_REDIRECT_URI)) return 'second-redirect-with-code';
	if (
		url.searchParams.get('client_id') === SECOND_CLIENT &&
		url.pathname === `/realms/${LOCAL_REALM}/protocol/openid-connect/auth` &&
		status === 200
	) {
		return 'second-login-page';
	}
	if (url.origin === APP) {
		const steps: Record<string, string> = { '/': 'redirect-to-idp', '/logout': 'logout-redirect' };
		return steps[url.pathname] ?? null;
	}
	if (url.pathname.endsWith('/protocol/openid-connect/logout')) return 'logout-redirect-back';
	if (location?.startsWith(REDIRECT_URI)) return 'redirect-with-code';
	if (location?.includes(`/realms/${UPSTREAM_REALM}/protocol/openid-connect/auth`)) {
		return 'redirect-to-upstream';
	}
	if (location?.includes(`/broker/${UPSTREAM_REALM}/endpoint`)) return 'upstream-redirect-back';
	if (url.pathname === `/realms/${LOCAL_REALM}/protocol/openid-connect/auth` && status === 200) {
		return 'login-page';
	}
	if (url.pathname.startsWith(`/realms/${LOCAL_REALM}/login-actions/`) && status === 200) {
		return 'consent-page';
	}
	return null;
}

const isDocument = (request: Request) => request.resourceType() === 'document';

/** The one cookie that is the session. The rest of them are how Keycloak keeps its forms going. */
const SESSION_COOKIE = /(?:^|\n|; )(KEYCLOAK_IDENTITY=[^\n]*)/;

/** Writes down what a page does, in order. Cookies arrive later, so they are added once they do. */
function watch(page: Page, run: Run, cookies: Promise<void>[]) {
	const inBrowser = (url: string) =>
		url.startsWith(APP) || url.startsWith(SECOND_APP) || url.startsWith(KEYCLOAK);
	page.on('request', (request) => {
		if (!isDocument(request) || !inBrowser(request.url())) return;
		const message = requestMessage(
			classifyRequest(new URL(request.url())),
			request.method(),
			request.url(),
			request.headers(),
			request.postData() ?? ''
		);
		run.messages.push(message);
		if (!request.url().startsWith(KEYCLOAK)) return;
		cookies.push(
			request.allHeaders().then((all) => {
				const session = all.cookie
					?.split('; ')
					.find((part) => part.startsWith('KEYCLOAK_IDENTITY='));
				if (session) message.headers.cookie = session;
			})
		);
	});
	page.on('response', (response: Response) => {
		if (!isDocument(response.request()) || !inBrowser(response.url())) return;
		const headers = response.headers();
		const step = classifyResponse(
			new URL(response.url()),
			response.status(),
			headers.location ?? null
		);
		const message = responseMessage(step, response.status(), headers);
		run.messages.push(message);
		if (!response.url().startsWith(KEYCLOAK)) return;
		cookies.push(
			response.allHeaders().then((all) => {
				const session = all['set-cookie']?.match(SESSION_COOKIE)?.[1];
				if (session) message.headers['set-cookie'] = session;
			})
		);
	});
}

/** The second app, in the same browser unless the setting says it is a new one. */
async function logInToSecondApp(
	browser: Browser,
	first: BrowserContext,
	run: Run,
	cookies: Promise<void>[]
) {
	const fresh = run.settings.ssoAsks === 'fresh';
	const context = fresh ? await browser.newContext() : first;
	const page = await context.newPage();
	watch(page, run, cookies);
	await page.goto(SECOND_APP);
	if (run.settings.ssoAsks === 'insists') {
		// Only the password, because it knows who they are.
		await page.fill('#password', PASSWORD);
		await page.click('#kc-login');
	}
	await page.getByRole('heading', { name: /Logged in|Not logged in|Failed/ }).waitFor();
	const outcome = await page.locator('body').innerText();
	if (outcome.includes('Failed')) throw new Error(`The second app failed: ${outcome}`);
	if (fresh !== outcome.includes('Not logged in')) throw new Error(`The second app: ${outcome}`);
	if (fresh) await context.close();
}

async function login(browser: Browser, run: Run) {
	const context = await browser.newContext();
	const page = await context.newPage();
	const cookies: Promise<void>[] = [];
	watch(page, run, cookies);

	await page.goto(APP);
	await page.locator('#username').waitFor();
	await page.fill('#username', USERNAME);
	await page.fill('#password', PASSWORD);
	await page.click('#kc-login');
	if (run.settings.consent) {
		// The same button id, on the page that asks.
		await page.locator('[name="accept"]').click();
	}
	await page.getByRole('heading', { name: /Logged in|Refused|Failed/ }).waitFor();
	const outcome = await page.locator('body').innerText();
	if (outcome.includes('Failed')) throw new Error(`Login failed: ${outcome}`);
	if (run.settings.sso) await logInToSecondApp(browser, context, run, cookies);
	if (run.settings.logout) {
		await page.goto(`${APP}/logout`);
		await page.getByRole('heading', { name: 'Logged out' }).waitFor();
	}
	await Promise.all(cookies);
	await context.close();
}

function runFor(settings: Settings): Run {
	return {
		settings,
		realm: settings.broker ? BROKERED_REALM : LOCAL_REALM,
		clientId: CONFIDENTIAL_CLIENT,
		clientSecret: settings.clientType === 'public' ? null : CLIENT_SECRET,
		messages: []
	};
}

async function record(
	browser: Browser,
	demo: Demo,
	admin: Admin,
	preset: (typeof presets)[number]
) {
	const settings = normalize({ ...defaultSettings, ...preset.settings }).settings;
	const run = runFor(settings);
	await setUpFor(admin, run.realm, settings);

	// Setup's one HTTP exchange. Everything else in setup is people, or the admin calls in keycloak.ts.
	await demo.discover(run);

	await admin.forgetBrokeredUsers();
	demo.current = run;
	await login(browser, run);
	demo.current = null;
	return run;
}

interface ServerFeature extends FlagStatus {
	name: string;
}

/** The flags the settings name, in what a server on its defaults says about them. */
function flagsFrom(features: readonly ServerFeature[]): Record<string, FlagStatus> {
	return Object.fromEntries(
		flagsInSettings().map(({ name }) => {
			const onServer = name.toUpperCase().replaceAll(/[-:]/g, '_');
			const found = features.find((feature) => feature.name === onServer);
			if (!found) throw new Error(`The server has no feature ${onServer}`);
			return [name, { type: found.type, enabled: found.enabled }];
		})
	);
}

function indexOf(
	recordings: Recording[],
	keycloak: string,
	recordedAt: string,
	flags: Record<string, FlagStatus>
): RecordingIndex {
	const known = new Set(
		[...base.diagrams.flow.steps, ...base.diagrams.setup.steps].map((step) => step.id)
	);
	const steps = new Set(recordings.flatMap((r) => r.messages.flatMap((m) => m.step ?? [])));
	for (const step of steps) {
		if (!known.has(step)) throw new Error(`Recorded a step the model does not have: ${step}`);
	}
	return {
		keycloak,
		recordedAt,
		flows: { [base.id]: { presets: presets.map((preset) => preset.id), steps: [...steps].sort() } },
		flags
	};
}

const needsV2 = (preset: (typeof presets)[number]) => preset.settings.upstreamTokens === 'v2';

async function main() {
	const demo = new Demo();
	await demo.start();
	const browser = await chromium.launch();
	const recordedAt = new Date().toISOString().slice(0, 10);
	const recordings: Recording[] = [];
	const answers: Record<string, unknown> = {};
	let flags: Record<string, FlagStatus> = {};
	const inConsole: Record<string, unknown> = {};
	let keycloak = version;
	let failed = false;

	try {
		for (const [features, wanted, questions] of [
			[[], presets.filter((preset) => !needsV2(preset)), questionsWithApiV1],
			[[API_V2_FLAG], presets.filter(needsV2), questionsWithApiV2]
		] as const) {
			console.log(`Starting Keycloak ${version} ${features.join(' ')}`);
			await startKeycloak(version, features);
			const admin = await Admin.connect();
			keycloak = await admin.serverVersion();
			await setUpRealms(admin);

			for (const preset of wanted) {
				const run = await record(browser, demo, admin, preset);
				console.log(`${preset.id}: ${run.messages.length} messages`);
				recordings.push({
					preset: preset.id,
					keycloak,
					recordedAt,
					settings: run.settings,
					messages: run.messages
				});
			}
			const forQuestions = {
				clientType: 'confidential',
				consent: false,
				upstreamTokens: features.length ? 'v2' : 'v1'
			} as const;
			await setUpFor(admin, LOCAL_REALM, forQuestions);
			await setUpFor(admin, BROKERED_REALM, forQuestions);
			Object.assign(inConsole, await lookInConsole(browser, admin, features));
			Object.assign(answers, await questions(browser, demo, admin));
			if (!features.length) {
				const info = await admin.call<{ features: ServerFeature[] }>('GET', '/serverinfo');
				flags = flagsFrom(info.features);
			}
			stopKeycloak();
		}
		answers.console = inConsole;
		console.log(JSON.stringify(answers, null, '\t'));

		if (checking) {
			const committedIndex = JSON.parse(readFileSync(INDEX, 'utf8')) as RecordingIndex;
			const changes = whatChanged({
				recordings: recordings.map((now) => ({
					committed: JSON.parse(readFileSync(`${FOLDER}/${now.preset}.json`, 'utf8')) as Recording,
					now
				})),
				flags: { committed: committedIndex.flags, now: flags },
				answers
			});
			failed = changes.length > 0;
			console.log(
				failed
					? `\nWhat the screen says no longer holds:\n${changes.join('\n')}`
					: '\nWhat the screen says still holds.'
			);
		} else {
			mkdirSync(FOLDER, { recursive: true });
			const write = (path: string, value: unknown) =>
				writeFileSync(path, `${JSON.stringify(value, null, '\t')}\n`);
			for (const recording of recordings) write(`${FOLDER}/${recording.preset}.json`, recording);
			write(`${FOLDER}/questions.json`, { keycloak, recordedAt, answers });
			// Only this flow's entry, because this run says nothing about another flow's recordings.
			const others = JSON.parse(readFileSync(INDEX, 'utf8')) as RecordingIndex;
			const index = indexOf(recordings, keycloak, recordedAt, flags);
			write(INDEX, { ...index, flows: { ...others.flows, ...index.flows } });
		}
	} finally {
		await browser.close();
		demo.stop();
		stopKeycloak();
	}
	process.exit(failed ? 2 : 0);
}

await main();
