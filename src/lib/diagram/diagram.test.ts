import { describe, expect, it } from 'vitest';
import { labelCentre, layHeld, layoutDiagram, SELF_LOOP, WIDTH } from '#lib/diagram/layout.ts';
import { interpolate, toFrame, type Frame } from '#lib/diagram/motion.ts';
import { authorizationCode as flow } from '#lib/flow/authorization-code.ts';
import { authorizationCodeSetup as setup } from '#lib/flow/authorization-code-setup.ts';
import { evaluate, holdingsAt } from '#lib/flow/model.ts';
import { allValidSettings, defaultSettings, type Settings } from '#lib/flow/settings.ts';
import type { Mode } from '#lib/flow/vocabulary.ts';

const layout = (settings: Partial<Settings> = {}, mode: Mode = 'advanced') =>
	layoutDiagram(evaluate(flow, { ...defaultSettings, ...settings }), mode);

describe('layout', () => {
	it.each(allValidSettings().map((settings) => [JSON.stringify(settings), settings] as const))(
		'gives every step a row, top to bottom: %s',
		(_, settings) => {
			for (const diagram of [flow, setup]) {
				const result = layoutDiagram(evaluate(diagram, settings));
				const expected = evaluate(diagram, settings).steps.map((s) => s.id);
				expect(result.rows.map((row) => row.id)).toEqual(expected);
				const ys = result.rows.map((row) => row.y);
				expect(ys).toEqual([...ys].sort((a, b) => a - b));
				expect(new Set(ys).size).toBe(ys.length);
				expect(result.height).toBeGreaterThan(ys[ys.length - 1]);
			}
		}
	);

	it('keeps a label off its step number, and inside the diagram', () => {
		const half = (label: string) => (label.length * 7.3) / 2;
		const wrong = allValidSettings().flatMap((settings) =>
			(['simple', 'advanced'] as const).flatMap((mode) =>
				[flow, setup].flatMap((diagram) =>
					layoutDiagram(evaluate(diagram, settings), mode)
						.rows.filter((row) => !row.self)
						.flatMap((row) => {
							const centre = labelCentre(row.x1, row.x2, row.label);
							const clear = Math.abs(centre - row.x1) - half(row.label) >= 10;
							const inside = centre - half(row.label) >= 0 && centre + half(row.label) <= WIDTH;
							return clear && inside ? [] : [`${mode} ${row.id}: ${row.label}`];
						})
				)
			)
		);
		expect([...new Set(wrong)]).toEqual([]);
	});

	// A label on a message to itself has only the room beside the lane, and nothing wraps it.
	it('keeps the label of a message to itself inside the diagram', () => {
		const charWidth = 6.4;
		for (const settings of allValidSettings()) {
			for (const diagram of [flow, setup]) {
				for (const mode of ['simple', 'advanced'] as const) {
					const { rows } = layoutDiagram(evaluate(diagram, settings), mode);
					for (const row of rows.filter((candidate) => candidate.self)) {
						const room = SELF_LOOP.width + 8 + row.label.length * charWidth;
						const edge = row.x1 + row.selfSide * room;
						expect(edge, row.label).toBeGreaterThanOrEqual(0);
						expect(edge, row.label).toBeLessThanOrEqual(WIDTH);
					}
				}
			}
		}
	});

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

	it('puts what a setting changed, and credentials and tokens, on the message', () => {
		const base = layout().chips;
		expect(base.every((chip) => chip.artifact)).toBe(true);
		expect(base.map((chip) => chip.id)).toContain('token-response:access_token');

		const chips = layout({ oidc: true }).chips;
		const ids = chips.map((chip) => chip.id);
		expect(ids).toContain('authorize:scope=openid');
		expect(ids).toContain('token-response:id_token');
		expect(ids).not.toContain('authorize:client_id');
		expect(chips.find((chip) => chip.id === 'token-response:id_token')?.text).toBe('ID token');
		expect(chips.find((chip) => chip.id === 'authorize:scope=openid')?.text).toBe('scope=openid');
	});

	it('moves nothing when the mode changes (ADR-004)', () => {
		for (const settings of allValidSettings()) {
			const [simple, advanced] = (['simple', 'advanced'] as const).map((mode) =>
				layoutDiagram(evaluate(flow, settings), mode)
			);
			expect(simple.rows.map((row) => row.y)).toEqual(advanced.rows.map((row) => row.y));
			expect(simple.height).toBe(advanced.height);
		}
	});

	it('shows plain words and no parameters in simple mode', () => {
		const simple = layout({ oidc: true }, 'simple');
		expect(simple.rows.find((row) => row.id === 'authorize')?.label).toBe(
			'The browser asks to log in'
		);
		expect(simple.chips.every((chip) => chip.artifact)).toBe(true);
		expect(simple.lanes.find((lane) => lane.id === 'idp')?.name).toBe('Identity provider');
	});

	it('still marks what a real server did not do in simple mode', () => {
		const simple = layout({ binding: 'dpop', dpopNonce: true }, 'simple');
		expect(simple.chips.map((chip) => chip.id)).toContain('nonce-challenge:spec only');
	});

	it('numbers every message, and says in words what the arrow shows', () => {
		const { rows } = layout();
		expect(rows.map((row) => row.number)).toEqual(rows.map((_, i) => i + 1));
		expect(rows[2].route).toBe("User's browser to IdP");
	});

	it('keeps every chip inside the diagram, in every combination', () => {
		for (const settings of allValidSettings()) {
			for (const mode of ['simple', 'advanced'] as const) {
				const { chips, width } = layoutDiagram(evaluate(flow, settings), mode);
				for (const chip of chips) {
					expect(chip.x, chip.id).toBeGreaterThanOrEqual(0);
					expect(chip.x + chip.width, chip.id).toBeLessThanOrEqual(width);
				}
			}
		}
	});

	it('leaves room on a row for its chips, and keeps them clear of the next row', () => {
		const { rows, chips } = layout({ oidc: true, binding: 'dpop' });
		for (const chip of chips) {
			const row = rows.find((candidate) => candidate.id === chip.step)!;
			const next = rows[rows.indexOf(row) + 1];
			expect(chip.y + 18).toBeLessThanOrEqual(row.y - 26 + row.band + 2);
			if (next) expect(chip.y + 18).toBeLessThan(next.y - 8);
			expect(chip.x).toBeGreaterThanOrEqual(0);
			expect(chip.x + chip.width).toBeLessThanOrEqual(WIDTH);
		}
	});

	it('fits what a lifeline can have seen in the room under its name, in every combination', () => {
		for (const settings of allValidSettings()) {
			for (const diagram of [flow, setup]) {
				const view = evaluate(diagram, settings);
				const { headHeight } = layoutDiagram(view);
				for (const step of view.steps) {
					for (const held of Object.values(holdingsAt(view, step.id))) {
						for (const chip of layHeld(held)) {
							expect(chip.y + 16).toBeLessThanOrEqual(headHeight);
							expect(Math.abs(chip.x)).toBeLessThanOrEqual(87);
							expect(chip.x + chip.width).toBeLessThanOrEqual(87);
						}
					}
				}
			}
		}
	});

	it('keeps the heads the same size in both modes and while stepping', () => {
		const view = evaluate(flow, { ...defaultSettings, oidc: true, pkce: true });
		expect(layoutDiagram(view, 'simple').headHeight).toBe(
			layoutDiagram(view, 'advanced').headHeight
		);
	});

	it('only makes the heads taller when a diagram needs it, so the first one stays compact', () => {
		const plain = layout().headHeight;
		const busy = layout({ oidc: true, pkce: true, binding: 'dpop' }).headHeight;
		expect(busy).toBeGreaterThan(plain);
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

	it('keeps setup rows out of the user flow', () => {
		const rows = layout({ broker: true, upstreamTokens: 'v1' }).rows.map((row) => row.id);
		for (const step of setup.steps) expect(rows).not.toContain(step.id);
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
