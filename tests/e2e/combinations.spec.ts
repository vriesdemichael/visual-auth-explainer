import { test } from '@playwright/test';
import { authorizationCodeBase as base } from '../../src/lib/flow/index.ts';
import { evaluate } from '../../src/lib/flow/model.ts';
import { allValidSettings } from '../../src/lib/flow/settings.ts';
import { presetSearch } from '../../src/lib/flow/state.ts';
import { expectMatchesModel, open, watchForErrors } from './helpers.ts';

// In Chromium alone (playwright.config.ts), because the view draws whatever the model returns, and the
// unit tests take every combination through the model, the layout and the address (ADR-006).
test.describe('every valid combination', () => {
	test('shows what the model says', async ({ page }) => {
		test.setTimeout(300_000);
		const check = watchForErrors(page);
		for (const settings of allValidSettings()) {
			const search = presetSearch(base, settings);
			await open(page, search);
			await expectMatchesModel(page, search);
		}
		check();
	});

	test('shows what the model says in setup, once for each different diagram', async ({ page }) => {
		test.setTimeout(300_000);
		const check = watchForErrors(page);
		const different = new Map(
			allValidSettings().map((settings) => [
				JSON.stringify(evaluate(base.diagrams.setup, settings)),
				presetSearch(base, settings)
			])
		);
		for (const search of different.values()) {
			await open(page, search, 'setup');
			await expectMatchesModel(page, search, 'setup');
		}
		check();
	});
});
