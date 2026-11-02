import { describe, expect, it } from 'vitest';
import { layoutDiagram, WHOLE_SELF_LOOP } from '#lib/diagram/layout.ts';
import { authorizationCodeBase as base, clientCredentialsBase } from '#lib/flow/index.ts';
import { evaluate } from '#lib/flow/model.ts';
import { allValidSettings, defaultSettings, normalize } from '#lib/flow/settings.ts';
import { parseState, serializeState, withRaw, withWhole } from '#lib/flow/state.ts';

// What is left of 1280x720 once the header, the switch, the legend and the controls have theirs.
const SMALL_PROJECTOR = { width: 1280, height: 551 };
const flow = base.diagrams.flow;
const longest = normalize({
	...defaultSettings,
	oidc: true,
	binding: 'dpop',
	dpopNonce: true,
	broker: true,
	upstreamTokens: 'v1'
}).settings;

describe('the whole flow at once', () => {
	it('fits on a small projector, for every named state', () => {
		for (const preset of base.presets) {
			const settings = normalize({ ...defaultSettings, ...preset.settings }).settings;
			const layout = layoutDiagram(
				evaluate(flow, settings),
				'advanced',
				SMALL_PROJECTOR,
				'specs',
				true
			);
			expect(layout.height + layout.headHeight, preset.id).toBeLessThanOrEqual(
				SMALL_PROJECTOR.height
			);
		}
	});

	it('stays readable with more rows than fit, and scrolls instead', () => {
		const settings = allValidSettings().reduce((most, candidate) =>
			evaluate(flow, candidate).steps.length > evaluate(flow, most).steps.length ? candidate : most
		);
		const { rows } = layoutDiagram(
			evaluate(flow, settings),
			'advanced',
			SMALL_PROJECTOR,
			'specs',
			true
		);
		const gaps = rows.slice(1).map((row, i) => row.y - rows[i].y);
		expect(Math.min(...gaps)).toBeGreaterThanOrEqual(11.5);
	});

	it('leaves rows far enough apart to read', () => {
		const { rows } = layoutDiagram(
			evaluate(flow, longest),
			'advanced',
			SMALL_PROJECTOR,
			'specs',
			true
		);
		const gaps = rows.slice(1).map((row, i) => row.y - rows[i].y);
		expect(Math.min(...gaps)).toBeGreaterThanOrEqual(11.5);
	});

	it('keeps a loop in its own row', () => {
		const { rows, numberRadius } = layoutDiagram(
			evaluate(flow, longest),
			'advanced',
			SMALL_PROJECTOR,
			'specs',
			true
		);
		const gap = rows[1].y - rows[0].y;
		expect(WHOLE_SELF_LOOP.height).toBeLessThanOrEqual(11.5);
		expect(numberRadius * 2).toBeLessThanOrEqual(gap);
	});

	it('has no highlight cutting through the number of the row above', () => {
		const { rows, numberRadius } = layoutDiagram(
			evaluate(flow, longest),
			'advanced',
			SMALL_PROJECTOR,
			'specs',
			true
		);
		for (const [i, row] of rows.slice(1).entries()) {
			if (rows[i].self || row.self) continue;
			expect(row.top, row.id).toBeGreaterThanOrEqual(rows[i].y + numberRadius - 0.01);
		}
	});

	it('has one line to a row, kept to its arrow, and no chips', () => {
		const { rows, chips } = layoutDiagram(
			evaluate(flow, longest),
			'advanced',
			SMALL_PROJECTOR,
			'specs',
			true
		);
		expect(chips).toEqual([]);
		for (const row of rows.filter((candidate) => !candidate.self && candidate.kind !== 'time')) {
			expect(row.lines.length, row.id).toBe(1);
			const room = Math.abs(row.x2 - row.x1);
			expect(row.lines[0].text.length * 6.5, row.id).toBeLessThanOrEqual(room);
		}
	});

	it('cuts words short at their arrow where there is not the room, and says so', () => {
		const { rows } = layoutDiagram(
			evaluate(flow, longest),
			'simple',
			{ width: 760, height: 551 },
			'specs',
			true
		);
		const arrows = rows.filter((row) => !row.self && row.kind !== 'time');
		for (const row of arrows) {
			expect(row.lines[0].text.length * 6.5, row.id).toBeLessThanOrEqual(Math.abs(row.x2 - row.x1));
		}
		expect(arrows.some((row) => row.lines[0].text.endsWith('…'))).toBe(true);
	});

	it('takes more room when there is more, and only so much', () => {
		const few = evaluate(flow, defaultSettings);
		const small = layoutDiagram(few, 'simple', { width: 1280, height: 400 }, 'plain', true);
		const large = layoutDiagram(few, 'simple', { width: 1280, height: 1400 }, 'plain', true);
		const gap = ({ rows }: typeof small) => rows[1].y - rows[0].y;
		expect(gap(large)).toBeGreaterThan(gap(small));
		expect(gap(large)).toBeLessThanOrEqual(34);
	});

	it('moves when it goes on, and is a change of room and not of settings', () => {
		const view = evaluate(flow, defaultSettings);
		const room = { width: 1280, height: 700 };
		const off = layoutDiagram(view, 'simple', room, 'plain');
		const on = layoutDiagram(view, 'simple', room, 'plain', true);
		expect(on.roomKey).not.toBe(off.roomKey);
		expect(on.whole).toBe(true);
		expect(off.whole).toBe(false);
	});

	it('works for a flow with no user as well', () => {
		const view = evaluate(clientCredentialsBase.diagrams.flow, defaultSettings);
		const layout = layoutDiagram(view, 'simple', SMALL_PROJECTOR, 'plain', true);
		expect(layout.rows).toHaveLength(view.steps.length);
	});
});

describe('in the address', () => {
	it('keeps the whole flow and raw traffic', () => {
		const start = parseState(base, 'flow', 'mode=advanced');
		expect(serializeState(base, withWhole(start, true))).toContain('whole=1');
		expect(parseState(base, 'flow', 'whole=1').whole).toBe(true);
		expect(serializeState(base, withRaw(start, true))).toContain('raw=1');
		expect(parseState(base, 'flow', 'raw=1').raw).toBe(true);
	});

	it('has one or the other, because one takes the room the other needs', () => {
		const start = parseState(base, 'flow', 'mode=advanced');
		expect(withRaw(withWhole(start, true), true).whole).toBe(false);
		expect(withWhole(withRaw(start, true), true).raw).toBe(false);
	});
});
