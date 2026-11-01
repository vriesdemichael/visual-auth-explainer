import { expect, test, type Page } from '@playwright/test';
import { expectMatchesModel, open, watchForErrors } from './helpers.ts';

const row = (page: Page, id: string) => page.locator(`[data-step="${id}"]`);
const answer = (page: Page) => row(page, 'attacker-token-response');
const held = (page: Page, artifact: string) => page.locator(`[data-held="attacker:${artifact}"]`);
const pkce = (page: Page) => page.locator('[data-setting="pkce"] input');

test.describe('an attacker on the diagram', () => {
	test('takes the code and gets the tokens, from an app with no secret', async ({ page }) => {
		const check = watchForErrors(page);
		await open(page, 'client=public&attacker=1&step=attacker-api-response');
		await expect(page.locator('[data-lifeline="attacker"]')).toBeVisible();
		await expect(answer(page)).toContainText('200 with tokens');
		await expect(held(page, 'code')).toBeVisible();
		await expect(held(page, 'access-token')).toBeVisible();
		await expect(row(page, 'attacker-api-response')).toContainText('200 with the resource');
		check();
	});

	test('flipping PKCE changes the answer on the same arrow', async ({ page }) => {
		await open(page, 'client=public&attacker=1&step=attacker-token-response');
		await expect(answer(page)).toContainText('200 with tokens');
		await answer(page).evaluate((element) => element.setAttribute('data-kept', 'yes'));

		await pkce(page).check();
		await expect(answer(page)).toContainText('400 invalid_grant');
		await expect(answer(page)).toHaveAttribute('data-kept', 'yes');
		await expect(row(page, 'attacker-api-request')).toHaveCount(0);
		await expect(held(page, 'access-token')).toHaveCount(0);
		await expect(held(page, 'code')).toBeVisible();
		await expect(page.getByTestId('change-summary')).toBeVisible();
	});

	test('a secret stops it too, and then the app carries on', async ({ page }) => {
		await open(page, 'attacker=1&step=attacker-token-response');
		await expect(answer(page)).toContainText('401 unauthorized_client');
		await expect(row(page, 'real-app-refused')).toHaveCount(0);
		await expect(row(page, 'api-response')).toBeAttached();
	});

	test('the real app pays for it, even when PKCE kept the tokens safe', async ({ page }) => {
		await open(page, 'client=public&pkce=1&attacker=1&step=real-app-refused');
		await expect(row(page, 'real-app-refused')).toContainText('400 invalid_grant');
		await expect(page.getByTestId('step-detail')).toContainText('spoil the login');
		await expect(row(page, 'token-response')).toHaveCount(0);
	});

	test('in plain words in simple mode, with no parameters', async ({ page }) => {
		await open(page, 'mode=simple&client=public&attacker=1&step=attacker-token-response');
		await expect(page.locator('[data-setting="attacker"]')).toContainText(
			'Show someone stealing the code'
		);
		await expect(page.locator('[data-lifeline="attacker"]')).toContainText('Someone else');
		await expect(answer(page)).toContainText('They get the tokens');
		await expect(page.getByTestId('payload')).toHaveCount(0);
	});

	test('shows the real answer in advanced mode, from a recording', async ({ page }) => {
		await open(page, 'client=public&pkce=1&attacker=1&step=attacker-token-response');
		await expect(page.getByTestId('payload')).toContainText('PKCE code verifier not specified');
	});

	test('is not offered with DPoP or another provider, and says why', async ({ page }) => {
		await open(page, 'attacker=1');
		await page.locator('[data-setting="broker"] input').check();
		await expect(page.getByTestId('change-summary')).toContainText('plain case');
		await expect(row(page, 'attacker-steals-code')).toHaveCount(0);
		await expectMatchesModel(page, 'broker=1');
	});

	test('a link to it with what it does not offer falls back', async ({ page }) => {
		await open(page, 'attacker=1&binding=dpop');
		await expectMatchesModel(page, 'binding=dpop');
	});
});

test.describe('the transition', () => {
	test.use({ contextOptions: { reducedMotion: 'no-preference' } });

	test('animates when PKCE is flipped with the attacker on', async ({ page }) => {
		await open(page, 'client=public&attacker=1&step=attacker-token-response');
		await pkce(page).check();
		await expect(page.getByTestId('diagram')).toHaveAttribute('data-animating', 'true');
		await expect(page.getByTestId('diagram')).toHaveAttribute('data-animating', 'false');
		await expect(answer(page)).toContainText('400 invalid_grant');
	});
});
