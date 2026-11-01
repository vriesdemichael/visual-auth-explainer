import { expect, test, type Page } from '@playwright/test';
import { currentSearch, open } from './helpers.ts';

const stepAt = (page: Page) => page.locator('[data-state="current"]');

test.describe('in front of a room', () => {
	test('a clicker moves through the steps', async ({ page }) => {
		await open(page, 'mode=simple');
		await page.keyboard.press('PageDown');
		await expect(stepAt(page)).toHaveAttribute('data-step', 'redirect-to-idp');
		await page.keyboard.press('PageUp');
		await expect(stepAt(page)).toHaveAttribute('data-step', 'open-app');
	});

	test('still scrolls what someone is reading', async ({ page }) => {
		await open(page, 'step=token-request');
		await page.getByTestId('step-detail').locator('summary').first().focus();
		await page.keyboard.press('PageDown');
		await expect(stepAt(page)).toHaveAttribute('data-step', 'token-request');
	});

	test('the settings can be put out of the way, and the diagram gets the room', async ({
		page
	}) => {
		await page.setViewportSize({ width: 1280, height: 720 });
		await open(page, 'mode=simple');
		const width = () =>
			page.getByTestId('diagram').evaluate((diagram) => diagram.getBoundingClientRect().width);
		const before = await width();
		await page.getByTestId('settings-toggle').click();
		await expect(page.locator('aside.settings')).toBeHidden();
		await expect.poll(width).toBeGreaterThan(before + 200);
		await expect.poll(() => currentSearch(page)).toContain('settings=off');
		await page.reload();
		await page.locator('.workspace[data-ready="true"]').waitFor();
		await expect(page.locator('aside.settings')).toBeHidden();
		await page.getByTestId('settings-toggle').click();
		await expect(page.locator('aside.settings')).toBeVisible();
	});

	test('clicking a choice does not trap the arrow keys', async ({ page }) => {
		await open(page, 'step=authorize');
		await page.locator('[data-setting="clientType"] input[value="public"]').click();
		await page.keyboard.press('ArrowRight');
		await expect(stepAt(page)).toHaveAttribute('data-step', 'login-page');
		await expect(page.locator('[data-setting="clientType"] input[value="public"]')).toBeChecked();
	});

	test('looking at the other diagram does not lose your place', async ({ page }) => {
		await open(page, 'step=token-request');
		await page.getByRole('link', { name: 'Setup', exact: true }).click();
		await expect(page.locator('.workspace')).toHaveAttribute('data-diagram', 'setup');
		await page.getByTestId('next').click();
		await page.getByRole('link', { name: 'User flow', exact: true }).click();
		await expect(stepAt(page)).toHaveAttribute('data-step', 'token-request');
		await page.getByRole('link', { name: 'Setup', exact: true }).click();
		await expect(stepAt(page)).toHaveAttribute('data-step', 'create-client');
	});
});

test.describe('someone on another provider', () => {
	test('can leave the product out from where it is named, in either mode', async ({ page }) => {
		await open(page, 'mode=simple');
		await expect(page.getByTestId('provenance')).toContainText('Keycloak');
		await page.getByTestId('server-notes-quick').click();
		await expect(page.getByTestId('explanation')).toContainText('A free identity provider');
		await page.getByTestId('leave-out-server').click();
		await expect(page.getByTestId('provenance')).not.toContainText('Keycloak');
		await expect(page.getByTestId('provenance')).toContainText('a real server');
		await page.getByTestId('server-notes-quick').click();
		await expect(page.getByTestId('provenance')).toContainText('Keycloak');
	});

	test('is told on the home screen that this is not only about one product', async ({ page }) => {
		await page.goto('./');
		await expect(page.locator('.lead').first()).toContainText('The specs are the same elsewhere');
	});

	test('is told what in a message is the server’s own', async ({ page }) => {
		await open(page, 'keycloak=off&step=token-response');
		await expect(page.getByTestId('payload-origin')).toContainText('realm_access');
		await expect(page.getByTestId('payload-origin')).toContainText('HTTPS');
	});
});

test.describe('on the setup in simple mode', () => {
	test('turning on another provider does not bring on a switch that cannot do anything', async ({
		page
	}) => {
		await open(page, 'mode=simple', 'setup');
		await page.locator('[data-setting="broker"] input').check();
		await expect(page.locator('[data-setting="attacker"]')).toHaveCount(0);
		await open(page, 'mode=simple&broker=1');
		await expect(page.locator('[data-setting="attacker"] input')).toBeDisabled();
	});
});
