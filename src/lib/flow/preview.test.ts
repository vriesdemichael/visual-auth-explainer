import { describe, expect, it } from 'vitest';
import { layoutDiagram } from '#lib/diagram/layout.ts';
import { authorizationCodeBase as base } from '#lib/flow/index.ts';
import { diffViews, evaluate, type DiagramId, type ViewDiff } from '#lib/flow/model.ts';
import { bothOf, whatItWouldDo } from '#lib/flow/preview.ts';
import {
	allValidSettings,
	change,
	defaultSettings,
	settingDefs,
	settingIds,
	unavailable,
	type SettingId,
	type Settings
} from '#lib/flow/settings.ts';

const diagrams: DiagramId[] = ['flow', 'setup'];
const flips = (settings: Readonly<Settings>) =>
	settingIds.flatMap((id: SettingId) => {
		const def = settingDefs[id];
		const values: (boolean | string)[] =
			def.kind === 'toggle' ? [true, false] : def.options.map(({ value }) => value);
		return values
			.filter((value) => value !== settings[id] && !unavailable(id, value as never, settings))
			.map((value) => change(settings, id, value as never).settings);
	});
const isInOrder = (some: readonly string[], all: readonly string[]) => {
	const places = some.map((id) => all.indexOf(id));
	return places.every((place, i) => place >= 0 && (i === 0 || place > places[i - 1]));
};

describe('both states on one diagram', () => {
	it.each(diagrams)('holds all of both, in order, for every flip in %s', (id) => {
		const flow = base.diagrams[id];
		for (const settings of allValidSettings()) {
			const before = evaluate(flow, settings);
			for (const next of flips(settings)) {
				const after = evaluate(flow, next);
				const both = bothOf(flow, before, after);
				const ids = both.steps.map((step) => step.id);
				expect(new Set(ids).size).toBe(ids.length);
				expect(
					isInOrder(
						before.steps.map((step) => step.id),
						ids
					)
				).toBe(true);
				expect(
					isInOrder(
						after.steps.map((step) => step.id),
						ids
					)
				).toBe(true);
				expect(ids.length).toBeLessThanOrEqual(before.steps.length + after.steps.length);
				const lines = both.lifelines.map((line) => line.id);
				for (const line of [...before.lifelines, ...after.lifelines]) {
					expect(lines).toContain(line.id);
				}
			}
		}
	});

	it('can be laid out', () => {
		const flow = base.diagrams.flow;
		const before = evaluate(flow, defaultSettings);
		const after = evaluate(flow, { ...defaultSettings, attacker: true });
		const layout = layoutDiagram(bothOf(flow, before, after));
		expect(layout.rows.map((row) => row.id)).toContain('attacker-steals-code');
		expect(layout.lanes.map((lane) => lane.id)).toContain('attacker');
	});

	it('words what stays as it would be', () => {
		const flow = base.diagrams.flow;
		const before = evaluate(flow, { ...defaultSettings, attacker: true, clientType: 'public' });
		const after = evaluate(flow, {
			...defaultSettings,
			attacker: true,
			clientType: 'public',
			pkce: true
		});
		const both = bothOf(flow, before, after);
		const answer = (view: typeof both) =>
			view.steps.find((step) => step.id === 'attacker-token-response')?.plain;
		expect(answer(both)).toBe(answer(after));
		expect(answer(both)).not.toBe(answer(before));
	});

	it('has what would go, and what would come', () => {
		const flow = base.diagrams.flow;
		const on = evaluate(flow, { ...defaultSettings, oidc: true });
		const off = evaluate(flow, defaultSettings);
		const ids = bothOf(flow, on, off).steps.map((step) => step.id);
		expect(ids).toContain('userinfo-request');
		expect(off.steps.map((step) => step.id)).not.toContain('userinfo-request');
	});
});

describe('what a setting would do, in words', () => {
	const nothing: ViewDiff = {
		addedSteps: [],
		removedSteps: [],
		addedLifelines: [],
		removedLifelines: [],
		renamedLifelines: [],
		addedFields: [],
		removedFields: [],
		rewordedSteps: []
	};

	it('says when it does nothing here', () => {
		expect(whatItWouldDo(nothing)).toBe('Changes nothing on this diagram.');
	});

	it('counts what it adds, removes and changes', () => {
		expect(
			whatItWouldDo({
				...nothing,
				addedLifelines: ['attacker'],
				addedSteps: ['a', 'b'],
				removedSteps: ['c'],
				rewordedSteps: ['d']
			})
		).toBe('Adds 1 lifeline, adds 2 steps, removes 1 step, changes 1 message.');
	});

	it('counts a message once, however much in it changes', () => {
		expect(
			whatItWouldDo({
				...nothing,
				addedFields: [
					{ step: 'a', field: 'x' },
					{ step: 'a', field: 'y' }
				],
				removedFields: [{ step: 'a', field: 'z' }],
				rewordedSteps: ['a']
			})
		).toBe('Changes 1 message.');
	});

	it('agrees with the diff for a real flip', () => {
		const flow = base.diagrams.flow;
		const diff = diffViews(
			evaluate(flow, defaultSettings),
			evaluate(flow, { ...defaultSettings, attacker: true })
		);
		expect(whatItWouldDo(diff)).toContain('adds 1 lifeline'.replace('adds', 'Adds'));
		expect(whatItWouldDo(diff)).toContain(`adds ${diff.addedSteps.length} steps`);
	});
});
