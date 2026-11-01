// Records what a real Keycloak does for each named state. See ADR-005.
//
//   pnpm record                    records against the pinned version and writes the files
//   pnpm record --keycloak 27.0.0  records against another version
//   pnpm record --check            records, writes nothing, and fails if the shape has changed
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { chromium, type Browser, type Request, type Response } from '@playwright/test';
import { authorizationCodeBase as base, presets } from '#lib/flow/index.ts';
import { defaultSettings, flagsInSettings, normalize, type Settings } from '#lib/flow/settings.ts';
import type { FlagStatus, Recording, RecordingIndex } from '#lib/recordings/format.ts';
import { shapeDifferences, shapeOf } from '#lib/recordings/shape.ts';
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
	PUBLIC_CLIENT,
	REDIRECT_URI,
	setUpRealms,
	startKeycloak,
	stopKeycloak,
	UPSTREAM_REALM,
	USERNAME
} from './keycloak.ts';
import { questionsWithApiV1, questionsWithApiV2 } from './questions.ts';

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
	if (url.origin === APP)
		return path === '/' ? 'open-app' : path === '/callback' ? 'callback' : null;
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
	return null;
}

function classifyResponse(url: URL, status: number, location: string | null): string | null {
	if (url.origin === APP) return url.pathname === '/' ? 'redirect-to-idp' : null;
	if (location?.startsWith(REDIRECT_URI)) return 'redirect-with-code';
	if (location?.includes(`/realms/${UPSTREAM_REALM}/protocol/openid-connect/auth`)) {
		return 'redirect-to-upstream';
	}
	if (location?.includes(`/broker/${UPSTREAM_REALM}/endpoint`)) return 'upstream-redirect-back';
	if (url.pathname === `/realms/${LOCAL_REALM}/protocol/openid-connect/auth` && status === 200) {
		return 'login-page';
	}
	return null;
}

const isDocument = (request: Request) => request.resourceType() === 'document';

async function login(browser: Browser, run: Run) {
	const context = await browser.newContext();
	const page = await context.newPage();
	const inBrowser = (url: string) => url.startsWith(APP) || url.startsWith(KEYCLOAK);

	page.on('request', (request) => {
		if (!isDocument(request) || !inBrowser(request.url())) return;
		run.messages.push(
			requestMessage(
				classifyRequest(new URL(request.url())),
				request.method(),
				request.url(),
				request.headers(),
				request.postData() ?? ''
			)
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
		run.messages.push(responseMessage(step, response.status(), headers));
	});

	await page.goto(APP);
	await page.locator('#username').waitFor();
	await page.fill('#username', USERNAME);
	await page.fill('#password', PASSWORD);
	await page.click('#kc-login');
	await page.getByRole('heading', { name: /Logged in|Failed/ }).waitFor();
	const outcome = await page.locator('body').innerText();
	await context.close();
	if (!outcome.includes('Logged in')) throw new Error(`Login failed: ${outcome}`);
}

function runFor(settings: Settings): Run {
	return {
		settings,
		realm: settings.broker ? BROKERED_REALM : LOCAL_REALM,
		clientId: settings.clientType === 'public' ? PUBLIC_CLIENT : CONFIDENTIAL_CLIENT,
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

	// Setup's one HTTP exchange. Everything else in setup is people, or the admin calls in keycloak.ts.
	const name = settings.oidc ? 'openid-configuration' : 'oauth-authorization-server';
	const url = `${KEYCLOAK}/realms/${run.realm}/.well-known/${name}`;
	run.messages.push(requestMessage('discover', 'GET', url, {}));
	const answer = await fetch(url);
	run.messages.push(
		responseMessage('discovery-document', answer.status, answer.headers, await answer.text())
	);

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
		presets: presets.map((preset) => preset.id),
		steps: [...steps].sort(),
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
			Object.assign(answers, await questions(browser, demo, admin));
			if (!features.length) {
				const info = await admin.call<{ features: ServerFeature[] }>('GET', '/serverinfo');
				flags = flagsFrom(info.features);
			}
			stopKeycloak();
		}
		console.log(JSON.stringify(answers, null, '\t'));

		if (checking) {
			for (const recording of recordings) {
				const file = `${FOLDER}/${recording.preset}.json`;
				const committed = JSON.parse(readFileSync(file, 'utf8')) as Recording;
				const differences = shapeDifferences(shapeOf(committed), shapeOf(recording));
				if (differences.length) {
					failed = true;
					console.log(`\n${recording.preset} changed:\n${differences.join('\n')}`);
				}
			}
			const committed = JSON.parse(readFileSync(INDEX, 'utf8')) as RecordingIndex;
			if (JSON.stringify(committed.flags) !== JSON.stringify(flags)) {
				failed = true;
				console.log(`\nFeature flags changed:\n${JSON.stringify(flags, null, '\t')}`);
			}
			console.log(failed ? '\nThe shape has changed.' : '\nThe shape has not changed.');
		} else {
			mkdirSync(FOLDER, { recursive: true });
			const write = (path: string, value: unknown) =>
				writeFileSync(path, `${JSON.stringify(value, null, '\t')}\n`);
			for (const recording of recordings) write(`${FOLDER}/${recording.preset}.json`, recording);
			write(`${FOLDER}/questions.json`, { keycloak, recordedAt, answers });
			write(INDEX, indexOf(recordings, keycloak, recordedAt, flags));
		}
	} finally {
		await browser.close();
		demo.stop();
		stopKeycloak();
	}
	process.exit(failed ? 1 : 0);
}

await main();
