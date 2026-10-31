import { expect, test } from '@playwright/test';
import { allValidSettings } from '../../src/lib/flow/settings.ts';
import { authorizationCode as flow } from '../../src/lib/flow/authorization-code.ts';
import { presets } from '../../src/lib/flow/index.ts';
import { presetSearch } from '../../src/lib/flow/state.ts';
import {
	currentSearch,
	expectedFor,
	expectMatchesModel,
	FLOW_PATH,
	open,
	visibleStepIds,
	watchForErrors
} from './helpers.ts';

// Literal on purpose. These links are public once shipped, and must keep opening the same state
// (ADR-003), so a change that breaks one has to show up here and not pass through a helper.
const STABLE_URLS = [
	{ search: '', step: 'open-app', stepCount: 12, lifelines: 4 },
	{ search: 'oidc=1', step: 'open-app', stepCount: 15, lifelines: 4 },
	{ search: 'binding=dpop', step: 'open-app', stepCount: 13, lifelines: 4 },
	{ search: 'binding=dpop&nonce=1', step: 'open-app', stepCount: 15, lifelines: 4 },
	{ search: 'broker=1', step: 'open-app', stepCount: 18, lifelines: 5 },
	{ search: 'broker=1&upstream=v1', step: 'open-app', stepCount: 22, lifelines: 5 },
	{ search: 'broker=1&upstream=v2', step: 'open-app', stepCount: 22, lifelines: 5 },
	{ search: 'oidc=1&step=token-response', step: 'token-response', stepCount: 15, lifelines: 4 },
	{ search: 'setup=1', step: 'register-client', stepCount: 16, lifelines: 4 },
	{ search: 'step=discover', step: 'discover', stepCount: 16, lifelines: 4 },
	{
		search: 'oidc=1&binding=dpop&nonce=1&broker=1&upstream=v2&step=call-upstream',
		step: 'call-upstream',
		stepCount: 28,
		lifelines: 5
	}
];

test.describe('links', () => {
	for (const { search, step, stepCount, lifelines } of STABLE_URLS) {
		test(`?${search} keeps opening the same state`, async ({ page }) => {
			const check = watchForErrors(page);
			await open(page, search);
			await expect(page.locator('[data-step]')).toHaveCount(stepCount);
			await expect(page.locator('[data-lifeline]')).toHaveCount(lifelines);
			await expect(page.locator('[data-state="current"]')).toHaveAttribute('data-step', step);
			await expectMatchesModel(page, search);
			check();
		});
	}

	test('opening a link reports no change, because nothing changed', async ({ page }) => {
		await open(page, 'oidc=1&broker=1');
		await expectMatchesModel(page, 'oidc=1&broker=1');
		await expect(page.getByTestId('change-summary')).toHaveCount(0);
	});

	test('a link to a page that does not exist gets the 404 page', async ({ page }) => {
		const response = await page.goto('no-such-flow/');
		expect(response?.status()).toBe(404);
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('404');
	});

	test('the start page links to every preset', async ({ page }) => {
		for (const preset of presets) {
			await page.goto('./');
			await page.getByTestId(`preset-${preset.id}`).click();
			await expectMatchesModel(page, presetSearch(flow, preset.settings));
		}
	});
});

test.describe('every valid combination', () => {
	const combinations = allValidSettings().map((settings) => presetSearch(flow, settings));

	test('shows what the model says', async ({ page }) => {
		const check = watchForErrors(page);
		for (const search of combinations) {
			await open(page, search);
			await expectMatchesModel(page, search);
		}
		check();
	});
});

test.describe('walking the steps', () => {
	for (const preset of presets) {
		test(`${preset.title}: Next and Back cover every step`, async ({ page }) => {
			const check = watchForErrors(page);
			const search = presetSearch(flow, preset.settings);
			const { steps, view } = expectedFor(search);
			await open(page, search);

			for (const [i, id] of steps.entries()) {
				await expect(page.locator('[data-state="current"]')).toHaveAttribute('data-step', id);
				await expect(page.getByTestId('position')).toHaveText(`Step ${i + 1} of ${steps.length}`);
				const step = view.steps.find((s) => s.id === id);
				await expect(page.getByTestId('step-detail').getByRole('heading').first()).toHaveText(
					step!.label
				);
				if (i < steps.length - 1) await page.getByTestId('next').click();
			}
			await expect(page.getByTestId('next')).toBeDisabled();

			for (const id of [...steps].reverse()) {
				await expect(page.locator('[data-state="current"]')).toHaveAttribute('data-step', id);
				if (id !== steps[0]) await page.getByTestId('back').click();
			}
			check();
		});
	}

	test('the arrow keys step as well', async ({ page }) => {
		await open(page);
		await page.keyboard.press('ArrowRight');
		await page.keyboard.press('ArrowRight');
		await expect(page.locator('[data-state="current"]')).toHaveAttribute('data-step', 'authorize');
		await page.keyboard.press('ArrowLeft');
		await expect(page.locator('[data-state="current"]')).toHaveAttribute(
			'data-step',
			'redirect-to-idp'
		);
		await expect.poll(() => currentSearch(page)).toBe('step=redirect-to-idp');
	});

	test('clicking a message selects it', async ({ page }) => {
		await open(page);
		await page.locator('[data-step="token-request"]').click();
		await expect(page.locator('[data-state="current"]')).toHaveAttribute(
			'data-step',
			'token-request'
		);
		await expect(page.getByTestId('step-detail')).toContainText('grant_type=authorization_code');
	});

	test('moving between steps does not fill the browser history', async ({ page }) => {
		await page.goto('./');
		await page.getByTestId('preset-oauth').click();
		await page.getByTestId('next').click();
		await page.getByTestId('next').click();
		await page.goBack();
		await expect(page).toHaveURL(/visual-auth-explainer\/$/);
	});

	test('Back from the first login step opens setup', async ({ page }) => {
		await open(page);
		await page.getByTestId('back').click();
		await expect(page.locator('[data-state="current"]')).toHaveAttribute(
			'data-step',
			'discovery-document'
		);
		await expectMatchesModel(page, 'setup=1&step=discovery-document');
		await expect(page.getByTestId('setup-band')).toHaveAttribute('aria-expanded', 'true');
	});
});

test.describe('settings', () => {
	const toggle = (page: import('@playwright/test').Page, id: string) =>
		page.locator(`[data-setting="${id}"] input[type="checkbox"]`);
	const option = (page: import('@playwright/test').Page, id: string, value: string) =>
		page.locator(`[data-setting="${id}"] input[value="${value}"]`);

	test('OIDC changes messages and adds steps, in the URL too', async ({ page }) => {
		const check = watchForErrors(page);
		await open(page);
		await toggle(page, 'oidc').check();
		await expectMatchesModel(page, 'oidc=1');
		await expect.poll(() => currentSearch(page)).toBe('oidc=1');
		await expect(page.locator('[data-chip="authorize:scope=openid"]')).toBeVisible();
		await expect(page.locator('[data-chip="token-response:id_token"]')).toBeVisible();
		await expect(page.locator('[data-lifeline="app"]')).toContainText('Relying party');
		await expect(page.getByTestId('change-summary')).toContainText('3 steps added');
		check();
	});

	test('the back button undoes a setting', async ({ page }) => {
		await open(page);
		await toggle(page, 'oidc').check();
		await expectMatchesModel(page, 'oidc=1');
		await page.goBack();
		await expectMatchesModel(page, '');
		await expect(toggle(page, 'oidc')).not.toBeChecked();
	});

	test('a setting that removes the current step moves to the nearest earlier one', async ({
		page
	}) => {
		await open(page, 'oidc=1&step=userinfo-response');
		await toggle(page, 'oidc').uncheck();
		await expect(page.locator('[data-state="current"]')).toHaveAttribute(
			'data-step',
			'token-response'
		);
		await expect.poll(() => currentSearch(page)).toBe('step=token-response');
	});

	test('brokering adds a lifeline and a nested flow', async ({ page }) => {
		await open(page);
		await toggle(page, 'broker').check();
		await expectMatchesModel(page, 'broker=1');
		await expect(page.locator('[data-lifeline="upstream"]')).toBeVisible();
		await expect(page.locator('[data-group="brokered-login"]')).toBeVisible();
		await expect(page.locator('[data-step="login-page"]')).toHaveCount(0);
	});

	test('a setting is only offered when what it needs holds', async ({ page }) => {
		await open(page);
		await expect(page.locator('[data-setting="dpopNonce"]')).toHaveCount(0);
		await expect(page.locator('[data-setting="upstreamTokens"]')).toHaveCount(0);
		await option(page, 'binding', 'dpop').check();
		await expect(page.locator('[data-setting="dpopNonce"]')).toBeVisible();
		await toggle(page, 'broker').check();
		await expect(page.locator('[data-setting="upstreamTokens"]')).toBeVisible();
	});

	test('an option that cannot apply says why', async ({ page }) => {
		await open(page, 'client=public&broker=1');
		await expect(option(page, 'upstreamTokens', 'v2')).toBeDisabled();
		await expect(page.locator('[data-setting="upstreamTokens"]')).toContainText(
			'API V2 only accepts confidential clients.'
		);
	});

	test('a change that breaks another setting resets it and says so', async ({ page }) => {
		await open(page, 'broker=1&upstream=v2');
		await option(page, 'clientType', 'public').check();
		await expectMatchesModel(page, 'client=public&broker=1');
		await expect(page.getByTestId('change-summary')).toContainText(
			'API V2 only accepts confidential clients.'
		);
	});

	test('an invalid link falls back to a valid state', async ({ page }) => {
		await open(page, 'client=public&broker=1&upstream=v2&nonce=1&binding=magic');
		await expectMatchesModel(page, 'client=public&broker=1');
	});

	test('setup opens and closes as a change to the same diagram', async ({ page }) => {
		await open(page);
		await expect(page.locator('[data-step="discover"]')).toHaveCount(0);
		await page.getByTestId('setup-band').click();
		await expect(page.locator('[data-step="discover"]')).toHaveCount(1);
		await expect.poll(() => currentSearch(page)).toBe('setup=1&step=open-app');
		await page.getByTestId('setup-band').click();
		await expect(page.locator('[data-step="discover"]')).toHaveCount(0);
	});
});

test.describe('the transition', () => {
	test.use({ contextOptions: { reducedMotion: 'no-preference' } });

	test('animates a toggle as a change, not a redraw', async ({ page }) => {
		await open(page);
		const before = await page
			.locator('[data-step="token-request"] line')
			.first()
			.getAttribute('y1');
		await page.locator('[data-setting="broker"] input').check();

		const diagram = page.getByTestId('diagram');
		await expect(diagram).toHaveAttribute('data-animating', 'true');
		// Something that stays is mid-move: neither where it was nor where it ends up.
		await expect
			.poll(async () => {
				const y = await page.locator('[data-step="token-request"] line').first().getAttribute('y1');
				return y !== before && !Number.isInteger(Number(y));
			})
			.toBe(true);
		await expect(diagram).toHaveAttribute('data-animating', 'false');
		await expectMatchesModel(page, 'broker=1');
	});

	test('keeps the same elements, so nothing is redrawn', async ({ page }) => {
		await open(page);
		await page.getByTestId('diagram').waitFor();
		await page.locator('[data-step="token-request"]').evaluate((row) => {
			row.setAttribute('data-kept', 'yes');
		});
		await page.locator('[data-setting="oidc"] input').check();
		await expect(page.getByTestId('diagram')).toHaveAttribute('data-animating', 'false');
		await expect(page.locator('[data-step="token-request"]')).toHaveAttribute('data-kept', 'yes');
	});

	test('survives a toggle flipped mid-transition', async ({ page }) => {
		const check = watchForErrors(page);
		await open(page);
		const broker = page.locator('[data-setting="broker"] input');
		await broker.check();
		await broker.uncheck();
		await broker.check();
		await expect(page.getByTestId('diagram')).toHaveAttribute('data-animating', 'false');
		await expectMatchesModel(page, 'broker=1');
		check();
	});

	test('opening a link does not animate', async ({ page }) => {
		await open(page, 'broker=1');
		await expect(page.getByTestId('diagram')).toHaveAttribute('data-animating', 'false');
		await expectMatchesModel(page, 'broker=1');
	});
});

test.describe('without JavaScript', () => {
	test.use({ javaScriptEnabled: false });

	test('the prerendered page still shows the diagram', async ({ page }) => {
		await page.goto(FLOW_PATH);
		const { steps } = expectedFor('');
		expect(await visibleStepIds(page)).toEqual(steps);
		await expect(page.getByTestId('step-detail')).toContainText('Open the app');
		await expect(page).toHaveTitle('Authorization code flow');
	});
});
