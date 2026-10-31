import { expect, type Page } from '@playwright/test';
import { authorizationCode as flow } from '../../src/lib/flow/authorization-code.ts';
import { evaluate } from '../../src/lib/flow/model.ts';
import { parseState, visibleSteps } from '../../src/lib/flow/state.ts';

export const FLOW_PATH = 'authorization-code/';

/** Opens a state and waits until the page has hydrated, so input is not lost. */
export async function open(page: Page, search = '') {
	await page.goto(FLOW_PATH + (search ? `?${search}` : ''));
	await page.locator('.workspace[data-ready="true"]').waitFor();
}

export const visibleStepIds = (page: Page) =>
	page.locator('[data-step]').evaluateAll((rows) => rows.map((r) => r.getAttribute('data-step')));

export const lifelineIds = (page: Page) =>
	page
		.locator('[data-lifeline]')
		.evaluateAll((lanes) => lanes.map((l) => l.getAttribute('data-lifeline')));

/** What the flow model says should be on screen for this query string. */
export function expectedFor(search: string) {
	const state = parseState(flow, search);
	const view = evaluate(flow, state.settings);
	return {
		state,
		view,
		steps: visibleSteps(view, state.setupOpen).map((step) => step.id),
		lifelines: view.lifelines.map((line) => line.id)
	};
}

/** The diagram on screen has to match the model, whichever way the page got there. */
export async function expectMatchesModel(page: Page, search: string) {
	const expected = expectedFor(search);
	await expect.poll(() => visibleStepIds(page)).toEqual(expected.steps);
	await expect.poll(() => lifelineIds(page)).toEqual(expected.lifelines);
	await expect(page.locator('[data-step][data-state="current"]')).toHaveAttribute(
		'data-step',
		expected.state.step
	);
}

export const currentSearch = (page: Page) => new URL(page.url()).search.replace(/^\?/, '');

/** Fails the test on anything the page logs as an error. */
export function watchForErrors(page: Page) {
	const errors: string[] = [];
	page.on('pageerror', (error) => errors.push(String(error)));
	page.on('console', (message) => {
		if (message.type() === 'error') errors.push(message.text());
	});
	return () => expect(errors).toEqual([]);
}
