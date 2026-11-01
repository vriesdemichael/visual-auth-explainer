import { expect, type Page } from '@playwright/test';
import { authorizationCodeBase as base } from '../../src/lib/flow/index.ts';
import { evaluate, type DiagramId } from '../../src/lib/flow/model.ts';
import { parseState } from '../../src/lib/flow/state.ts';

export const FLOW_PATH = 'authorization-code/';
export const SETUP_PATH = 'authorization-code/setup/';

const pathOf = (diagram: DiagramId) => (diagram === 'setup' ? SETUP_PATH : FLOW_PATH);

/**
 * Opens a state and waits until the page has hydrated, so input is not lost. Advanced mode, because
 * it shows what most tests look at. Simple mode, the default, has its own spec.
 */
export async function open(page: Page, search = '', diagram: DiagramId = 'flow') {
	const query = search.includes('mode=') ? search : `mode=advanced${search ? `&${search}` : ''}`;
	await page.goto(`${pathOf(diagram)}?${query}`);
	await page.locator('.workspace[data-ready="true"]').waitFor();
}

export const visibleStepIds = (page: Page) =>
	page.locator('[data-step]').evaluateAll((rows) => rows.map((r) => r.getAttribute('data-step')));

export const lifelineIds = (page: Page) =>
	page
		.locator('[data-lifeline]')
		.evaluateAll((lanes) => lanes.map((l) => l.getAttribute('data-lifeline')));

/** What the flow model says should be on screen for this query string. */
export function expectedFor(search: string, diagram: DiagramId = 'flow') {
	const state = parseState(base, diagram, search);
	const view = evaluate(base.diagrams[state.diagram], state.settings);
	return {
		state,
		view,
		steps: view.steps.map((step) => step.id),
		lifelines: view.lifelines.map((line) => line.id)
	};
}

/** The diagram on screen has to match the model, whichever way the page got there. */
export async function expectMatchesModel(page: Page, search: string, diagram: DiagramId = 'flow') {
	const expected = expectedFor(search, diagram);
	await expect(page.locator('.workspace')).toHaveAttribute('data-diagram', expected.state.diagram);
	await expect.poll(() => visibleStepIds(page)).toEqual(expected.steps);
	await expect.poll(() => lifelineIds(page)).toEqual(expected.lifelines);
	await expect(page.locator('[data-step][data-state="current"]')).toHaveAttribute(
		'data-step',
		expected.state.step
	);
}

/** The query, without the mode that `open` adds. */
export function currentSearch(page: Page) {
	const { searchParams } = new URL(page.url());
	searchParams.delete('mode');
	return searchParams.toString();
}

/** Where the page is, for tests about the address, without the mode that `open` adds. */
export function placeOf(page: Page) {
	const search = currentSearch(page);
	return new URL(page.url()).pathname + (search ? `?${search}` : '');
}

/** Fails the test on anything the page logs as an error. */
export function watchForErrors(page: Page) {
	const errors: string[] = [];
	page.on('pageerror', (error) => errors.push(String(error)));
	page.on('console', (message) => {
		// Firefox reports a font it stopped fetching because the test had already moved on.
		const leftBeforeItArrived = /downloadable font: download failed.*status=2152398850/;
		if (message.type() === 'error' && !leftBeforeItArrived.test(message.text())) {
			errors.push(message.text());
		}
	});
	return () => expect(errors).toEqual([]);
}
