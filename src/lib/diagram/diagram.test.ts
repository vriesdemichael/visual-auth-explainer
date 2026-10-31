import { describe, expect, it } from 'vitest';
import { layoutDiagram, WIDTH } from '#lib/diagram/layout.ts';
import { interpolate, toFrame, type Frame } from '#lib/diagram/motion.ts';
import { authorizationCode as flow } from '#lib/flow/authorization-code.ts';
import { evaluate } from '#lib/flow/model.ts';
import { allValidSettings, defaultSettings, type Settings } from '#lib/flow/settings.ts';
import { visibleSteps } from '#lib/flow/state.ts';

const layout = (settings: Partial<Settings> = {}, setupOpen = false) =>
	layoutDiagram(evaluate(flow, { ...defaultSettings, ...settings }), setupOpen);

describe('layout', () => {
	it.each(allValidSettings().map((settings) => [JSON.stringify(settings), settings] as const))(
		'gives every visible step a row, top to bottom: %s',
		(_, settings) => {
			for (const setupOpen of [false, true]) {
				const result = layoutDiagram(evaluate(flow, settings), setupOpen);
				const expected = visibleSteps(evaluate(flow, settings), setupOpen).map((s) => s.id);
				expect(result.rows.map((row) => row.id)).toEqual(expected);
				const ys = result.rows.map((row) => row.y);
				expect(ys).toEqual([...ys].sort((a, b) => a - b));
				expect(new Set(ys).size).toBe(ys.length);
				expect(result.height).toBeGreaterThan(ys[ys.length - 1]);
			}
		}
	);

	it('keeps lanes inside the diagram, and slides them over for a new lifeline', () => {
		const before = layout();
		const after = layout({ broker: true });
		expect(after.lanes.map((lane) => lane.id)).toEqual([
			'browser',
			'app',
			'idp',
			'upstream',
			'api'
		]);
		for (const lane of after.lanes) {
			expect(lane.x).toBeGreaterThan(0);
			expect(lane.x).toBeLessThan(WIDTH);
		}
		const app = (l: typeof before) => l.lanes.find((lane) => lane.id === 'app')?.x;
		expect(app(after)).toBeLessThan(app(before) ?? 0);
	});

	it('puts only what differs from the base flow on the message', () => {
		expect(layout().chips).toEqual([]);
		const chips = layout({ oidc: true }).chips.map((chip) => chip.id);
		expect(chips).toContain('authorize:scope=openid');
		expect(chips).toContain('token-response:id_token');
		expect(chips).not.toContain('authorize:client_id');
	});

	it('frames a group around exactly its rows', () => {
		const result = layout({ broker: true });
		const frame = result.groups.find((group) => group.id === 'brokered-login');
		const members = ['redirect-to-upstream', 'match-user'].map((id) =>
			result.rows.find((row) => row.id === id)!
		);
		expect(frame!.y).toBeLessThan(members[0].y);
		expect(frame!.y + frame!.height).toBeGreaterThan(members[1].y);
		const after = result.rows.find((row) => row.id === 'redirect-with-code')!;
		expect(frame!.y + frame!.height).toBeLessThanOrEqual(after.y);
	});

	it('hides setup rows until setup opens', () => {
		expect(layout().rows.some((row) => row.id === 'discover')).toBe(false);
		expect(layout({}, true).rows.some((row) => row.id === 'discover')).toBe(true);
		expect(layout().band.count).toBe(4);
		expect(layout({ broker: true, upstreamTokens: 'v1' }).band.count).toBe(6);
	});
});

describe('transitions', () => {
	const before = toFrame(layout());
	const after = toFrame(layout({ broker: true, oidc: true }));
	const row = (frame: Frame, id: string) => frame.rows.find((r) => r.id === id);

	it('start where the diagram is and end at the new layout', () => {
		const start = interpolate(before, after, 0);
		expect(row(start, 'token-request')?.y).toBeCloseTo(row(before, 'token-request')!.y);
		expect(start.lanes.find((l) => l.id === 'app')?.x).toBeCloseTo(
			before.lanes.find((l) => l.id === 'app')!.x
		);
		expect(interpolate(before, after, 1)).toEqual(after);
	});

	it('move what stays', () => {
		const middle = interpolate(before, after, 0.45);
		const y = row(middle, 'token-request')!.y;
		expect(y).toBeGreaterThan(row(before, 'token-request')!.y);
		expect(y).toBeLessThan(row(after, 'token-request')!.y);
	});

	it('fade out what leaves first, and draw in what arrives last', () => {
		const early = interpolate(before, after, 0.3);
		expect(row(early, 'login-page')?.leaving).toBe(true);
		expect(row(early, 'login-page')?.opacity).toBeCloseTo(0);
		expect(row(early, 'upstream-authorize')?.opacity).toBe(0);
		expect(row(early, 'upstream-authorize')?.draw).toBe(0);

		const late = interpolate(before, after, 0.85);
		expect(row(late, 'upstream-authorize')?.draw).toBeGreaterThan(0);
		expect(row(late, 'upstream-authorize')?.draw).toBeLessThan(1);
	});

	it('bring in a new field on a message that stays', () => {
		const middle = interpolate(before, after, 0.8);
		const chip = middle.chips.find((c) => c.id === 'authorize:scope=openid');
		expect(chip?.opacity).toBeGreaterThan(0);
		expect(chip?.opacity).toBeLessThan(1);
		expect(row(middle, 'authorize')?.opacity).toBe(1);
	});

	it('continue smoothly when a toggle flips mid-transition', () => {
		const middle = interpolate(before, after, 0.5);
		const reversed = interpolate(middle, before, 0);
		expect(row(reversed, 'token-request')?.y).toBeCloseTo(row(middle, 'token-request')!.y);
		expect(interpolate(middle, before, 1)).toEqual(before);
	});
});
