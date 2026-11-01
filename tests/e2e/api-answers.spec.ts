import { expect, test, type Page } from '@playwright/test';
import { expectMatchesModel, open, watchForErrors } from './helpers.ts';

const response = (page: Page) => page.locator('[data-step="api-response"]');
const payload = (page: Page) => page.getByTestId('payload');

// What the demo API really said, each from a recording of its own.
const ANSWERS = [
	{ send: 'none', label: '401 with no error', status: '401', header: 'Bearer' },
	{ send: 'expired', label: '401 invalid_token', status: '401', header: 'error="invalid_token"' },
	{ send: 'changed', label: '401 invalid_token', status: '401', header: 'bad signature' },
	{ send: 'elsewhere', label: '401 invalid_token', status: '401', header: 'not for this API' },
	{ send: 'noscope', label: '403 insufficient_scope', status: '403', header: 'scope="contacts"' }
];

test.describe('when the API says no', () => {
	for (const { send, label, status, header } of ANSWERS) {
		test(`send=${send} shows what it answered, from a recording`, async ({ page }) => {
			const check = watchForErrors(page);
			await open(page, `send=${send}&step=api-response`);
			await expectMatchesModel(page, `send=${send}&step=api-response`);
			await expect(response(page)).toContainText(label);
			await expect(payload(page)).toContainText(status);
			await expect(payload(page)).toContainText(/www-authenticate/i);
			await expect(payload(page)).toContainText(header);
			check();
		});
	}

	test('a 403 says a new token of the same kind will not help', async ({ page }) => {
		await open(page, 'send=noscope&step=api-response');
		await expect(page.getByTestId('step-detail')).toContainText('will not help');
	});

	test('with nothing wrong, the API answers as before', async ({ page }) => {
		await open(page, 'step=api-response');
		await expect(response(page)).toContainText('200 with the resource');
		await expect(payload(page)).not.toContainText(/www-authenticate/i);
	});

	test('changing what is sent changes the answer on the same arrow', async ({ page }) => {
		await open(page, 'send=expired&step=api-response');
		await response(page).evaluate((element) => element.setAttribute('data-kept', 'yes'));
		await page.locator('[data-setting="apiToken"] input[value="noscope"]').check();
		await expect(response(page)).toContainText('403 insufficient_scope');
		await expect(response(page)).toHaveAttribute('data-kept', 'yes');
	});

	test('sending nothing leaves the token out of the request', async ({ page }) => {
		await open(page, 'send=none&step=api-request');
		await expect(payload(page)).not.toContainText(/authorization/i);
	});

	test('is left out when something else is what the answer would be about', async ({ page }) => {
		await open(page, 'broker=1');
		await expect(page.locator('[data-setting="apiToken"] input[value="expired"]')).toBeDisabled();
		await open(page, 'send=expired');
		await page.locator('[data-setting="broker"] input').check();
		await expect(page.getByTestId('change-summary')).toContainText('was reset');
		await expect(response(page)).not.toContainText('401');
	});
});

test.describe('in simple mode', () => {
	test('says what the API checks, and what happens when one of them fails', async ({ page }) => {
		await open(page, 'mode=simple&step=api-check-token');
		await expect(page.getByTestId('step-detail')).toContainText('who it is for');
		const pitfall = page.getByTestId('step-pitfall');
		await expect(pitfall).toContainText('What if one of these checks fails?');
		await pitfall.locator('summary').click();
		await expect(pitfall).toContainText('403');
		await expect(page.getByTestId('payload')).toHaveCount(0);
	});

	test('does not offer the setting', async ({ page }) => {
		await open(page, 'mode=simple');
		await expect(page.locator('[data-setting="apiToken"]')).toHaveCount(0);
	});
});

test.describe('the setup of the API', () => {
	test('links to where its values get checked, and back', async ({ page }) => {
		await open(page, 'step=configure-api', 'setup');
		await page.getByTestId('step-link').click();
		await expect(page.locator('[data-state="current"]')).toHaveAttribute(
			'data-step',
			'api-check-token'
		);
		await page.getByTestId('step-link').click();
		await expect(page.locator('[data-state="current"]')).toHaveAttribute(
			'data-step',
			'configure-api'
		);
	});

	test('has no link to a step that someone with the code has taken away', async ({ page }) => {
		await open(page, 'client=public&attacker=1&step=configure-api', 'setup');
		await expect(page.getByTestId('step-link')).toHaveCount(0);
	});

	test('fetching the keys is a real request, in a recording', async ({ page }) => {
		await open(page, 'step=keys', 'setup');
		await expect(payload(page)).toContainText('keys');
	});
});

test.describe('from the map', () => {
	for (const [id, title] of [
		['why-401', 'Why did my API say 401?'],
		['401-or-403', 'What is the difference between 401 and 403?']
	]) {
		test(`${id} opens at the answer`, async ({ page }) => {
			await page.goto(`authorization-code/${id}/`);
			await page.locator('.workspace[data-ready="true"]').waitFor();
			await expect(page.getByTestId('title')).toHaveText(title);
			await expect(page.locator('[data-state="current"]')).toHaveAttribute(
				'data-step',
				'api-response'
			);
		});
	}
});
