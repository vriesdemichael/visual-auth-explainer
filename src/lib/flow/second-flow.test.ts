import { describe, expect, it } from 'vitest';
import { layoutDiagram } from '#lib/diagram/layout.ts';
import { flows } from '#lib/flow/index.ts';
import { evaluate } from '#lib/flow/model.ts';
import { secondFlow as second } from '#lib/flow/second-flow.fixture.ts';
import { allValidSettings, defaultSettings, settingIds } from '#lib/flow/settings.ts';
import { nextStep, parseState, serializeState, withSetting } from '#lib/flow/state.ts';
import { notesFor } from '#lib/keycloak/notes.ts';
import { knownFrom, nearestRecordings, provenance, recordingFor } from '#lib/recordings/known.ts';

// Nothing here ships. It is here so that what was built for one flow cannot quietly assume it is the
// only one, which is what the application will find out when the next base flow goes in.
describe('a second base flow', () => {
	const flow = second.diagrams.flow;
	const view = evaluate(flow, defaultSettings);
	const tokenRequest = view.steps[0];

	it('is drawn by the same engine, with no browser on it', () => {
		const layout = layoutDiagram(view);
		expect(layout.lanes.map((lane) => lane.id)).toEqual(['app', 'idp', 'api']);
		expect(layout.rows).toHaveLength(2);
		expect(view.steps.every((step) => step.channel === 'back')).toBe(true);
	});

	it('moves through its own steps', () => {
		const state = parseState(second, 'flow', '');
		expect(state.step).toBe('token-request');
		expect(nextStep(second, state)?.step).toBe('token-response');
	});

	it('only offers its own settings, so the others do not multiply its combinations', () => {
		expect(allValidSettings(second.settings)).toHaveLength(2);
		expect(allValidSettings(second.settings).map((settings) => settings.oidc)).toEqual([
			false,
			true
		]);
	});

	it('ignores a setting in a link that it does not have', () => {
		const state = parseState(second, 'flow', 'oidc=1&pkce=1&broker=1');
		expect(state.settings).toEqual({ ...defaultSettings, oidc: true });
		expect(serializeState(second, state)).toBe('oidc=1');
	});

	it('changes with the settings it does have', () => {
		const state = parseState(second, 'flow', 'step=token-response');
		const { state: after } = withSetting(second, state, 'oidc', true);
		const response = evaluate(flow, after.settings).steps[1];
		expect(response.fields.map((field) => field.name)).toEqual(['id_token']);
	});

	it('finds no recording of another flow', () => {
		expect(recordingFor(second, defaultSettings)).toBeNull();
		expect(nearestRecordings(second, defaultSettings)).toEqual([]);
		expect(provenance(second, flow, defaultSettings).recorded).toBe(false);
	});

	it('does not claim to be recorded because a step has the same id as one that was', () => {
		expect(knownFrom(flows['authorization-code'], tokenRequest, defaultSettings)).toMatchObject({
			kind: 'recorded'
		});
		expect(knownFrom(second, tokenRequest, defaultSettings)).toEqual({ kind: 'unchecked' });
	});

	it('gets no notes written for another flow, though the step has the same id', () => {
		expect(notesFor('authorization-code', 'token-request', defaultSettings).length).toBeGreaterThan(
			0
		);
		expect(notesFor(second.id, 'token-request', defaultSettings)).toEqual([]);
	});
});

describe('the flows that ship', () => {
	it('do not share a step id, within or between them', () => {
		const ids = Object.values(flows).flatMap((base) =>
			Object.values(base.diagrams).flatMap((diagram) => diagram.steps.map((step) => step.id))
		);
		expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([]);
	});

	it('name only settings that exist', () => {
		for (const base of Object.values(flows)) {
			expect(base.settings.filter((id) => !settingIds.includes(id))).toEqual([]);
		}
	});
});
