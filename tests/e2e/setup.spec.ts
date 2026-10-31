import { expect, test } from '@playwright/test';
import { allValidSettings } from '../../src/lib/flow/settings.ts';
import { authorizationCodeBase as base } from '../../src/lib/flow/index.ts';
import { presetSearch } from '../../src/lib/flow/state.ts';
import {
	currentSearch,
	expectedFor,
	expectMatchesModel,
	lifelineIds,
	open,
	SETUP_PATH,
	visibleStepIds,
	watchForErrors
} from './helpers.ts';

const current = (page: import('@playwright/test').Page) => page.locator('[data-state="current"]');
const toSetup = (page: import('@playwright/test').Page) =>
	page.getByTestId('diagram-switch').locator('[data-diagram="setup"]');
const toFlow = (page: import('@playwright/test').Page) =>
	page.getByTestId('diagram-switch').locator('[data-diagram="flow"]');

test.describe('the two diagrams', () => {
	test('the user flow is the default and has no setup in it', async ({ page }) => {
		await open(page);
		await expect(toFlow(page)).toHaveAttribute('aria-current', 'page');
		await expect(page.locator('[data-testid="setup-band"]')).toHaveCount(0);
		await expect(page.locator('[data-step="register-client"]')).toHaveCount(0);
		await expect(page.locator('[data-step="discover"]')).toHaveCount(0);
		await expect(page.locator('[data-lifeline="app-team"]')).toHaveCount(0);
	});

	test('setup has the people who do it, and no user or browser', async ({ page }) => {
		const check = watchForErrors(page);
		await open(page);
		await toSetup(page).click();
		await expect(page).toHaveURL(SETUP_PATH);
		await expect(toSetup(page)).toHaveAttribute('aria-current', 'page');
		await expectMatchesModel(page, '', 'setup');
		expect(await lifelineIds(page)).toEqual(['app-team', 'app', 'idp', 'idp-admin']);
		await expect(page.locator('[data-lifeline="browser"]')).toHaveCount(0);
		await expect(page.locator('[data-lifeline="api"]')).toHaveCount(0);
		check();
	});

	test('switching keeps the settings and shows no change', async ({ page }) => {
		await open(page, 'oidc=1&broker=1');
		await toSetup(page).click();
		await expectMatchesModel(page, 'oidc=1&broker=1', 'setup');
		await expect(page.locator('[data-setting="oidc"] input')).toBeChecked();
		await expect.poll(() => currentSearch(page)).toBe('oidc=1&broker=1');
		await expect(page.getByTestId('change-summary')).toHaveCount(0);
		await toFlow(page).click();
		await expectMatchesModel(page, 'oidc=1&broker=1');
		await expect(page.getByTestId('change-summary')).toHaveCount(0);
	});

	test('the browser back button returns to the other diagram', async ({ page }) => {
		await open(page);
		await toSetup(page).click();
		await expectMatchesModel(page, '', 'setup');
		await page.goBack();
		await expectMatchesModel(page, '');
	});

	test('a hand-off between people is drawn differently from HTTP', async ({ page }) => {
		await open(page, '', 'setup');
		await expect(page.locator('[data-step="register-client"]')).toHaveClass(/human/);
		await expect(page.locator('[data-step="configure-app"]')).toHaveClass(/human/);
		await expect(page.locator('[data-step="discover"]')).toHaveClass(/request/);
		await expect(page.locator('[data-step="discover"]')).not.toHaveClass(/human/);
		await expect(page.getByTestId('step-detail')).toContainText('People, not HTTP');
	});

	test('every valid combination shows what the model says in setup', async ({ page }) => {
		const check = watchForErrors(page);
		const searches = new Set(allValidSettings().map((settings) => presetSearch(base, settings)));
		for (const search of searches) {
			await open(page, search, 'setup');
			await expectMatchesModel(page, search, 'setup');
		}
		check();
	});
});

test.describe('settings in setup', () => {
	test('External IdP brings in the upstream lifeline and its registration', async ({ page }) => {
		await open(page, '', 'setup');
		await page.locator('[data-setting="broker"] input').check();
		await expectMatchesModel(page, 'broker=1', 'setup');
		await expect(page.locator('[data-lifeline="upstream"]')).toBeVisible();
		await expect(page.locator('[data-step="register-with-upstream"]')).toBeVisible();
		await expect(page.getByTestId('change-summary')).toContainText('1 lifeline added');
	});

	test('a setting that changes nothing here says where it does', async ({ page }) => {
		await open(page, '', 'setup');
		await page.locator('[data-setting="binding"] input[value="dpop"]').check();
		await expect(page.getByTestId('change-summary')).toContainText('Nothing in this diagram.');
		await page.getByTestId('changed-elsewhere').click();
		await expectMatchesModel(page, 'binding=dpop');
	});

	test('a setting that removes the current setup step moves to the nearest earlier one', async ({
		page
	}) => {
		await open(page, 'broker=1&step=register-with-upstream', 'setup');
		await page.locator('[data-setting="broker"] input').uncheck();
		await expect(current(page)).toHaveAttribute('data-step', 'hand-over-credentials');
	});
});

test.describe('moving through a diagram', () => {
	test('Back and Next stay inside it', async ({ page }) => {
		await open(page);
		await expect(page.getByTestId('back')).toBeDisabled();
		await page.keyboard.press('ArrowLeft');
		await expectMatchesModel(page, '');

		await open(page, 'step=discovery-document');
		await expect(page.getByTestId('next')).toBeDisabled();
		await page.keyboard.press('ArrowRight');
		await expect(current(page)).toHaveAttribute('data-step', 'discovery-document');
	});

	test('Next and Back cover every setup step', async ({ page }) => {
		const search = 'broker=1&upstream=v2';
		const { steps } = expectedFor(search, 'setup');
		await open(page, search, 'setup');
		for (const [i, id] of steps.entries()) {
			await expect(current(page)).toHaveAttribute('data-step', id);
			await expect(page.getByTestId('position')).toHaveText(`Step ${i + 1} of ${steps.length}`);
			if (i < steps.length - 1) await page.getByTestId('next').click();
		}
		for (const id of [...steps].reverse()) {
			await expect(current(page)).toHaveAttribute('data-step', id);
			if (id !== steps[0]) await page.getByTestId('back').click();
		}
	});

	test('the start of the user flow links to setup', async ({ page }) => {
		await open(page, 'oidc=1');
		await page.getByTestId('step-link').click();
		await expectMatchesModel(page, 'oidc=1', 'setup');
	});

	test('the end of setup links to the user flow', async ({ page }) => {
		await open(page, 'oidc=1&step=discovery-document', 'setup');
		await page.getByTestId('step-link').click();
		await expectMatchesModel(page, 'oidc=1');
	});

	test('the redirect URI check and its registration link to each other', async ({ page }) => {
		await open(page, 'step=authorize');
		await page.getByTestId('step-link').click();
		await expectMatchesModel(page, '', 'setup');
		await expect(current(page)).toHaveAttribute('data-step', 'register-client');

		await page.getByTestId('step-link').click();
		await expectMatchesModel(page, 'step=authorize');
		await expect(current(page)).toHaveAttribute('data-step', 'authorize');
	});
});

test.describe('links', () => {
	test('setup has a path of its own, with its own title', async ({ page }) => {
		await open(page, '', 'setup');
		await expect(page).toHaveTitle('Setting up the authorization code flow');
		await expect(page.locator('meta[name="description"]')).toHaveAttribute(
			'content',
			/before any user arrives/
		);
	});

	test('an unknown diagram gets the 404 page', async ({ page }) => {
		const response = await page.goto('authorization-code/nope/');
		expect(response?.status()).toBe(404);
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('404');
	});

	// Literal on purpose, as in click-through.spec.ts: these are public (ADR-003).
	test('?setup=1 moves to the setup path', async ({ page }) => {
		await open(page, 'setup=1');
		await expect(current(page)).toHaveAttribute('data-step', 'register-client');
		await expect(page).toHaveURL(SETUP_PATH);
	});

	test('?step=discover moves to the setup path and keeps the step', async ({ page }) => {
		await open(page, 'step=discover');
		await expect(current(page)).toHaveAttribute('data-step', 'discover');
		await expect(page).toHaveURL(`${SETUP_PATH}?step=discover`);
	});

	test('?setup=1&oidc=1 keeps the settings', async ({ page }) => {
		await open(page, 'setup=1&oidc=1');
		await expect(page).toHaveURL(`${SETUP_PATH}?oidc=1`);
		await expect(page.locator('[data-setting="oidc"] input')).toBeChecked();
	});

	test('a user flow step on the setup path moves back', async ({ page }) => {
		await open(page, 'step=authorize', 'setup');
		await expect(current(page)).toHaveAttribute('data-step', 'authorize');
		await expect(page).toHaveURL(/authorization-code\/\?step=authorize$/);
	});
});

test.describe('without JavaScript', () => {
	test.use({ javaScriptEnabled: false });

	test('the setup diagram is prerendered, and the switch works', async ({ page }) => {
		await page.goto(SETUP_PATH);
		expect(await visibleStepIds(page)).toEqual(expectedFor('', 'setup').steps);
		await expect(page).toHaveTitle('Setting up the authorization code flow');
		await toFlow(page).click();
		expect(await visibleStepIds(page)).toEqual(expectedFor('').steps);
	});
});
