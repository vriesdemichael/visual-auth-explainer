import { expect, test } from '@playwright/test';
import { expectMatchesModel, open } from './helpers.ts';

test.describe('asking the user', () => {
	test('adds the question and the answer, after the login and before the code', async ({
		page
	}) => {
		await open(page);
		await page.locator('[data-setting="consent"] input').check();
		await expectMatchesModel(page, 'consent=1');
		await expect(page.getByTestId('change-summary')).toContainText('2 steps added');
		await expect(page.locator('[data-step="consent-page"]')).toBeAttached();
	});

	test('explains scopes in plain words, in simple mode', async ({ page }) => {
		await open(page, 'mode=simple&consent=1&step=consent-page');
		await expect(page.getByTestId('step-detail')).toContainText('What the app is asking for');
		await expect(page.getByTestId('step-detail')).toContainText('scopes');
		await expect(page.locator('[data-setting="consent"]')).toContainText('Ask the user to agree');
	});

	test('says what happens if the answer is no', async ({ page }) => {
		await open(page, 'consent=1&step=consent-page');
		const pitfall = page.getByTestId('step-pitfall');
		await pitfall.locator('summary').click();
		await expect(pitfall).toContainText('error=access_denied');
	});

	test('says why most people never see it, on Keycloak', async ({ page }) => {
		await open(page, 'step=submit-credentials');
		const note = page.locator('[data-note="consent-required"]');
		await note.locator('summary').click();
		await expect(note).toContainText('never ask the user anything');
		await expect(note).toContainText('Login settings › Consent required');
	});

	test('moves Execute to the answer that sends the code', async ({ page }) => {
		await open(page, 'consent=1&step=submit-credentials');
		await expect(page.getByTestId('payload')).toBeVisible();
		await expect(page.getByTestId('execute')).toHaveCount(0);

		await open(page, 'consent=1&step=consent-grant');
		await page.getByTestId('execute').click();
		await expect(page.locator('[data-state="current"]')).toHaveAttribute(
			'data-step',
			'redirect-with-code'
		);
	});

	test('has a question on the map, in simple mode', async ({ page }) => {
		await page.goto('authorization-code/when-do-i-get-asked/');
		await page.locator('.workspace[data-ready="true"]').waitFor();
		await expect(page.locator('[data-state="current"]')).toHaveAttribute(
			'data-step',
			'consent-page'
		);
		await expect(page.locator('[data-mode="simple"]')).toHaveAttribute('aria-pressed', 'true');
	});
});
