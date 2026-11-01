import { defineConfig, devices } from '@playwright/test';

const BASE_PATH = '/visual-auth-explainer';
// Not the port of `pnpm preview`, and never reused, so nothing else can get tested by mistake.
const PORT = 4174;
const LOCAL_URL = `http://127.0.0.1:${PORT}${BASE_PATH}/`;
// Set this to a deployed site, ending in a slash, to run the same tests against it.
const LIVE_URL = process.env.LIVE_URL;

// Every browser in CI. One while working, because all three take several minutes, and
// `pnpm test:browsers` runs them in CI's image.
const ALL_BROWSERS = Boolean(process.env.CI) && !process.env.LIVE_URL;

// The click-through runs against the real static build, served the way GitHub Pages serves it.
export default defineConfig({
	testDir: 'tests/e2e',
	fullyParallel: true,
	forbidOnly: Boolean(process.env.CI),
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI
		? [['github'], ['html', { open: 'never' }], ['./tests/support/flaky-reporter.mjs']]
		: [['list'], ['./tests/support/flaky-reporter.mjs']],
	use: {
		baseURL: LIVE_URL ?? LOCAL_URL,
		trace: 'on-first-retry',
		contextOptions: { reducedMotion: 'reduce' }
	},
	projects: [
		{ name: 'chromium', use: { ...devices['Desktop Chrome'] } },
		...(ALL_BROWSERS
			? [
					// A screenshot is only valid in one browser, and a story only needs rendering once.
					{
						name: 'firefox',
						use: { ...devices['Desktop Firefox'] },
						testIgnore: /(visual|published)\.spec/
					},
					{
						name: 'webkit',
						use: { ...devices['Desktop Safari'] },
						testIgnore: /(visual|published)\.spec/
					}
				]
			: [])
	],
	webServer: LIVE_URL
		? undefined
		: {
				command: `pnpm build && node tests/support/pages-server.mjs build ${BASE_PATH} ${PORT}`,
				url: LOCAL_URL,
				env: { BASE_PATH },
				reuseExistingServer: false,
				timeout: 300_000
			}
});
