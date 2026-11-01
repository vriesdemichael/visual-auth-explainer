import { expect, test, type Page } from '@playwright/test';
import { open, watchForErrors } from './helpers.ts';

// The other tests run with reduced motion, which hides everything in this file.
test.use({ contextOptions: { reducedMotion: 'no-preference' } });

const diagram = (page: Page) => page.getByTestId('diagram');

/** Counts the diagram starting to animate, from inside the page, so a fast one cannot be missed. */
async function watchAnimating(page: Page) {
	const seen = await diagram(page).evaluateHandle((element) => {
		const counted = { times: 0 };
		new MutationObserver(() => {
			if (element.getAttribute('data-animating') === 'true') counted.times++;
		}).observe(element, { attributes: true, attributeFilter: ['data-animating'] });
		return counted;
	});
	return () => seen.evaluate((counted) => counted.times);
}

test.describe('stepping', () => {
	test('does not play the transition, in either direction', async ({ page }) => {
		await open(page, 'step=authorize');
		const times = await watchAnimating(page);
		await page.getByTestId('next').click();
		await page.getByTestId('next').click();
		await page.getByTestId('back').click();
		await page.keyboard.press('ArrowRight');
		await expect(page.getByTestId('position')).toContainText('Step 5');
		expect(await times()).toBe(0);
	});

	test('leaves a hand scroll alone while the step stays in view', async ({ page }) => {
		await page.setViewportSize({ width: 1440, height: 620 });
		await open(page, 'step=authorize');
		const scroller = page.locator('.scroller');
		const scrollTo = (top: number) =>
			scroller.evaluate((element, value) => {
				element.scrollTop = value;
			}, top);
		const scrolled = () => scroller.evaluate((element) => element.scrollTop);
		await scrollTo(40);
		await page.getByTestId('next').click();
		await expect(page.getByTestId('position')).toContainText('Step 4');
		expect(await scrolled()).toBe(40);
	});

	test('still brings a step into view when it would leave', async ({ page }) => {
		await page.setViewportSize({ width: 1440, height: 620 });
		await open(page, 'oidc=1');
		await page.keyboard.press('End');
		await expect(page.locator('[data-state="current"] .hit')).toBeInViewport();
	});
});

test.describe('flipping a setting', () => {
	test('plays the transition', async ({ page }) => {
		await open(page, '');
		const times = await watchAnimating(page);
		await page.getByRole('checkbox', { name: /OpenID Connect/ }).click();
		await expect.poll(times).toBeGreaterThan(0);
		await expect(diagram(page)).toHaveAttribute('data-animating', 'false');
	});

	test('a row on its way out cannot be stepped to', async ({ page }) => {
		const check = watchForErrors(page);
		await open(page, 'oidc=1');
		const leaving = page.locator('.row:not([data-step])');
		await page.getByRole('checkbox', { name: /OpenID Connect/ }).click();
		// Clicked from inside the page, because a click from here can arrive after it has gone.
		await leaving
			.first()
			.evaluate((row) => row.dispatchEvent(new MouseEvent('click', { bubbles: true })));
		await expect(diagram(page)).toHaveAttribute('data-animating', 'false');
		await expect(page).not.toHaveURL(/step=userinfo/);
		check();
	});

	test('a new step ahead still looks like what is ahead', async ({ page }) => {
		await open(page, 'step=authorize');
		await page.getByRole('checkbox', { name: /OpenID Connect/ }).click();
		await expect(diagram(page)).toHaveAttribute('data-animating', 'false');
		const added = page.locator('.row.fresh.future').first();
		await expect(added).toBeVisible();
		const opacity = await added
			.locator('line, path')
			.first()
			.evaluate((line) => Number(getComputedStyle(line).opacity));
		expect(opacity).toBeLessThan(1);
	});
});

test.describe('what changed', () => {
	const why = (page: Page) => page.getByTestId('change-why');
	const oidc = (page: Page) => page.getByRole('checkbox', { name: /OpenID Connect/ });

	test('explains a flip', async ({ page }) => {
		await open(page, '');
		await oidc(page).click();
		await expect(why(page)).toContainText('OAuth');
	});

	test('does not explain Back with the words of another setting', async ({ page }) => {
		await open(page, '');
		await oidc(page).click();
		await expect(page).toHaveURL(/oidc=1/);
		await page.getByRole('radio', { name: 'DPoP' }).click();
		await expect(why(page)).toContainText('bearer token');
		// The state moves at once and the address catches up, and Back goes by the address.
		await expect(page).toHaveURL(/binding=dpop/);
		await page.goBack();
		await expect(page.getByRole('radio', { name: 'DPoP' })).not.toBeChecked();
		await page.goBack();
		await expect(oidc(page)).not.toBeChecked();
		await expect(page.getByTestId('change-summary')).toBeVisible();
		await expect(why(page)).toHaveCount(0);
	});

	test('does not say something was reset once Back has restored it', async ({ page }) => {
		await open(page, 'broker=1&upstream=v2');
		await page.getByRole('radio', { name: /Public/ }).click();
		await expect(page.getByTestId('change-summary')).toContainText('was reset');
		await page.goBack();
		await expect(page.getByRole('radio', { name: /Public/ })).not.toBeChecked();
		await expect(page.getByTestId('change-summary')).not.toContainText('was reset');
	});
});

test.describe('Execute', () => {
	test('does not point at a step that a setting has since removed', async ({ page }) => {
		await open(page, 'step=submit-credentials');
		await page.getByTestId('execute').click();
		await expect(page.getByTestId('answer-to')).toBeVisible();
		await page.getByRole('checkbox', { name: /External IdP/ }).click();
		await expect(page.locator('body')).not.toContainText('The answer to step .');
	});
});

test.describe('keys', () => {
	for (const modifier of ['Shift', 'Alt', 'Control', 'Meta']) {
		test(`${modifier} with an arrow is not a step`, async ({ page }) => {
			await open(page, 'step=authorize');
			await page.keyboard.press(`${modifier}+ArrowRight`);
			await expect(page.getByTestId('position')).toContainText('Step 3');
		});
	}

	test('a plain arrow is', async ({ page }) => {
		await open(page, 'step=authorize');
		await page.keyboard.press('ArrowRight');
		await expect(page.getByTestId('position')).toContainText('Step 4');
	});
});
