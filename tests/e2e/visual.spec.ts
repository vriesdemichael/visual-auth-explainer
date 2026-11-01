import { expect, test } from '@playwright/test';
import { open } from './helpers.ts';

// Fonts render differently on each system, so the baselines come from one Linux image, the one CI
// runs in. `pnpm test:visual:update` regenerates them after a deliberate change to the look.
test.skip(
	process.platform !== 'linux' || Boolean(process.env.LIVE_URL),
	'Baselines are only for the Linux image CI runs in'
);

const states: readonly [string, string, 'flow' | 'setup'][] = [
	['simple-first-step', 'mode=simple', 'flow'],
	['simple-token-response', 'mode=simple&oidc=1&step=token-response', 'flow'],
	['simple-explanation', 'mode=simple&step=callback&explain=artifact.code', 'flow'],
	['simple-setup', 'mode=simple&step=hand-over-credentials', 'setup'],
	['simple-pkce', 'mode=simple&client=public&pkce=1&step=check-verifier', 'flow'],
	['first-step', '', 'flow'],
	['token-response', 'step=token-response', 'flow'],
	['openid-connect', 'oidc=1&step=token-response', 'flow'],
	['pkce', 'pkce=1&step=token-request', 'flow'],
	['on-the-wire', 'step=callback', 'flow'],
	['no-recording', 'oidc=1&binding=dpop&step=callback', 'flow'],
	['dpop-with-nonce', 'binding=dpop&nonce=1&step=nonce-challenge', 'flow'],
	['external-idp', 'broker=1&step=upstream-authorize', 'flow'],
	['everything', 'oidc=1&binding=dpop&nonce=1&broker=1&upstream=v1&step=token-request', 'flow'],
	['setup', '', 'setup'],
	['setup-with-external-idp', 'broker=1&upstream=v2&step=register-with-upstream', 'setup']
];

for (const scheme of ['light', 'dark'] as const) {
	test.describe(scheme, () => {
		test.use({ colorScheme: scheme, viewport: { width: 1440, height: 900 } });

		for (const [name, search, diagram] of states) {
			test(name, async ({ page }) => {
				await open(page, search, diagram);
				await expect(page.getByTestId('recording-loading')).toHaveCount(0);
				await page.mouse.move(0, 0);
				await expect(page).toHaveScreenshot(`${name}-${scheme}.png`, { maxDiffPixelRatio: 0.002 });
			});
		}
	});
}
