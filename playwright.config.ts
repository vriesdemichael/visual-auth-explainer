import { defineConfig, devices } from '@playwright/test';

const BASE_PATH = '/visual-auth-explainer';
const PORT = 4173;

// The click-through runs against the real static build, served the way GitHub Pages serves it.
export default defineConfig({
	testDir: 'tests/e2e',
	fullyParallel: true,
	forbidOnly: Boolean(process.env.CI),
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
	use: {
		baseURL: `http://127.0.0.1:${PORT}${BASE_PATH}/`,
		trace: 'on-first-retry',
		contextOptions: { reducedMotion: 'reduce' }
	},
	projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
	webServer: {
		command: `pnpm build && node tests/support/pages-server.mjs build ${BASE_PATH} ${PORT}`,
		url: `http://127.0.0.1:${PORT}${BASE_PATH}/`,
		env: { BASE_PATH },
		reuseExistingServer: !process.env.CI,
		timeout: 120_000
	}
});
