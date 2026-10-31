import { expect, type Page } from '@playwright/test';
import { authorizationCodeBase as base } from '../../src/lib/flow/index.ts';
import { evaluate, type DiagramId } from '../../src/lib/flow/model.ts';
import { parseState } from '../../src/lib/flow/state.ts';

export const FLOW_PATH = 'authorization-code/';
export const SETUP_PATH = 'authorization-code/setup/';

const pathOf = (diagram: DiagramId) => (diagram === 'setup' ? SETUP_PATH : FLOW_PATH);

/** Opens a state and waits until the page has hydrated, so input is not lost. */
export async function open(page: Page, search = '', diagram: DiagramId = 'flow') {
	await page.goto(pathOf(diagram) + (search ? `?${search}` : ''));
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
