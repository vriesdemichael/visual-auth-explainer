// Waits until a deployed site and its Storybook serve a commit, then checks that both answer.
// Usage: node tests/support/check-live.mjs <site url ending in a slash> <commit>
const [, , site, commit] = process.argv;

const WAIT_MS = 10 * 60 * 1000;
const POLL_MS = 10 * 1000;

const get = (path) => fetch(new URL(path, site), { cache: 'no-store', redirect: 'follow' });

async function servedCommit(path) {
	const response = await get(`${path}?commit=${commit}`);
	return response.ok ? (await response.text()).trim() : `HTTP ${response.status}`;
}

const deadline = Date.now() + WAIT_MS;
for (;;) {
	const served = await Promise.all(['version.txt', 'storybook/version.txt'].map(servedCommit));
	if (served.every((value) => value === commit)) break;
	if (Date.now() > deadline) {
		console.error(`Expected ${commit}, but the site and Storybook serve: ${served.join(', ')}`);
		process.exit(1);
	}
	await new Promise((resolve) => setTimeout(resolve, POLL_MS));
}

const expected = [
	['./', 200],
	['authorization-code/?oidc=1&step=token-response', 200],
	['storybook/', 200],
	['storybook/index.json', 200],
	['no-such-page/', 404]
];

let failed = false;
for (const [path, status] of expected) {
	const actual = (await get(path)).status;
	console.log(`${actual} ${path}`);
	if (actual !== status) {
		console.error(`Expected ${status} for ${path}`);
		failed = true;
	}
}
process.exit(failed ? 1 : 0);
