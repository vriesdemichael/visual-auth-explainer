import { expect, test, type Page } from '@playwright/test';
import { open, watchForErrors } from './helpers.ts';

const copy = (page: Page) => page.getByTestId('copy-request');

/** So that what was copied can be read back in every browser, none of which lets a test do it alike. */
async function watchClipboard(page: Page, works = true) {
	await page.addInitScript((allowed) => {
		const holder = window as unknown as { copied?: string };
		Object.defineProperty(navigator, 'clipboard', {
			configurable: true,
			value: {
				writeText: async (text: string) => {
					if (!allowed) throw new Error('Not allowed');
					holder.copied = text;
				}
			}
		});
	}, works);
	return () => page.evaluate(() => (window as unknown as { copied?: string }).copied);
}

test.describe('copying a request', () => {
	test('gives the command for what was recorded, and says what it is', async ({ page }) => {
		const check = watchForErrors(page);
		const copied = await watchClipboard(page);
		await open(page, 'mode=advanced&step=token-request');
		await copy(page).click();
		await expect(page.getByRole('status').filter({ hasText: 'Copied' })).toContainText('throwaway');
		const command = await copied();
		expect(command).toContain('curl -i -X POST');
		expect(command).toContain('/protocol/openid-connect/token');
		expect(command).toContain('grant_type=authorization_code');
		expect(command).toContain('Never paste real secrets');
		expect(command).toContain('The code in this was good once. A new one comes from step 6.');
		check();
	});

	test('is not there for an answer', async ({ page }) => {
		await open(page, 'mode=advanced&step=token-response');
		await expect(page.getByTestId('payload')).toBeVisible();
		await expect(copy(page)).toHaveCount(0);
	});

	test('is not there in simple mode, which shows no values', async ({ page }) => {
		await open(page, 'mode=simple&step=token-request');
		await expect(copy(page)).toHaveCount(0);
	});

	test('is not there for what this party never saw', async ({ page }) => {
		await open(page, 'mode=advanced&eyes=browser&step=token-request');
		await expect(page.getByTestId('payload')).toBeVisible();
		await expect(copy(page)).toHaveCount(0);
	});

	test('does not say copied on the next step', async ({ page }) => {
		await watchClipboard(page);
		await open(page, 'mode=advanced&step=token-request');
		await copy(page).click();
		await expect(page.getByText('Copied, with throwaway values.')).toBeVisible();
		await page.locator('[data-step="callback"]').click();
		await expect(copy(page)).toBeVisible();
		await expect(page.getByText('Copied, with throwaway values.')).toHaveCount(0);
	});

	test('shows the command to select by hand if the browser will not copy it', async ({ page }) => {
		await watchClipboard(page, false);
		await open(page, 'mode=advanced&step=token-request');
		await copy(page).click();
		await expect(page.getByTestId('copy-by-hand')).toContainText('curl -i -X POST');
	});
});
