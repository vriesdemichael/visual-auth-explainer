import { describe, expect, it } from 'vitest';
import { authorizationCode as flow } from '#lib/flow/authorization-code.ts';
import { diffViews, evaluate, isEmptyDiff } from '#lib/flow/model.ts';
import { presets } from '#lib/flow/index.ts';
import { allValidSettings, defaultSettings, type Settings } from '#lib/flow/settings.ts';
import shippedStepIds from '#lib/flow/shipped-step-ids.json';

const view = (settings: Partial<Settings> = {}) =>
	evaluate(flow, { ...defaultSettings, ...settings });
const diff = (before: Partial<Settings>, after: Partial<Settings>) =>
	diffViews(view(before), view(after));

describe('every valid combination', () => {
	const combinations = allValidSettings();

	it('uses unique step IDs in the definition', () => {
		const ids = flow.steps.map((step) => step.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it.each(combinations.map((settings) => [JSON.stringify(settings), settings] as const))(
		'builds a coherent diagram: %s',
		(_, settings) => {
			const result = evaluate(flow, settings);
			const lifelines = new Set(result.lifelines.map((line) => line.id));
			for (const step of result.steps) {
				expect(lifelines.has(step.from), `${step.id} from ${step.from}`).toBe(true);
				expect(lifelines.has(step.to), `${step.id} to ${step.to}`).toBe(true);
				expect(step.label).not.toBe('');
				expect(step.concept).not.toBe('');
				expect(new Set(step.fields.map((f) => f.name)).size).toBe(step.fields.length);
			}
			for (const group of result.groups) {
				const members = result.steps.filter((step) => step.group === group.id);
				expect(members.length, `group ${group.id}`).toBeGreaterThan(0);
				const first = result.steps.indexOf(members[0]);
				expect(result.steps.slice(first, first + members.length)).toEqual(members);
			}
			for (const step of result.steps) {
				if (step.group) expect(result.groups.map((g) => g.id)).toContain(step.group);
			}
		}
	);

	it('produces a different diagram for each one', () => {
		const shapes = combinations.map((settings) => JSON.stringify(evaluate(flow, settings)));
		expect(new Set(shapes).size).toBe(combinations.length);
	});
});

describe('step IDs', () => {
	it('stay stable, because links depend on them (ADR-003)', () => {
		expect(flow.steps.map((step) => step.id).sort()).toEqual([...shippedStepIds].sort());
	});
});

// These four test whether one model can absorb very different kinds of change (premise section 8).
describe('OIDC', () => {
	const change = diff({}, { oidc: true });

	it('adds a scope and an ID token to existing messages', () => {
		expect(change.addedFields).toContainEqual({ step: 'authorize', field: 'scope=openid' });
		expect(change.addedFields).toContainEqual({ step: 'token-response', field: 'id_token' });
	});

	it('adds an endpoint and renames two lifelines', () => {
		expect(change.addedSteps).toEqual([
			'validate-id-token',
			'userinfo-request',
			'userinfo-response'
		]);
		expect(change.renamedLifelines).toEqual(['app', 'idp']);
	});

	it('leaves the lifelines themselves alone', () => {
		expect(change.addedLifelines).toEqual([]);
	});
});

describe('DPoP', () => {
	const change = diff({}, { binding: 'dpop' });

	it('touches several existing steps', () => {
		const touched = new Set(change.addedFields.map((field) => field.step));
		expect([...touched]).toEqual(
			expect.arrayContaining(['authorize', 'token-request', 'token-response', 'api-request'])
		);
		expect(change.addedSteps).toEqual(['generate-key']);
	});

	it('adds a retry only when the server requires a nonce', () => {
		const retry = diff({ binding: 'dpop' }, { binding: 'dpop', dpopNonce: true });
		expect(retry.addedSteps).toEqual(['nonce-challenge', 'token-request-retry']);
		const steps = view({ binding: 'dpop', dpopNonce: true }).steps.map((step) => step.id);
		expect(steps.indexOf('token-request')).toBeLessThan(steps.indexOf('nonce-challenge'));
		expect(steps.indexOf('token-request-retry')).toBeLessThan(steps.indexOf('token-response'));
	});
});

describe('brokering', () => {
	const change = diff({}, { broker: true });

	it('adds a lifeline and a nested flow in place of the local login', () => {
		expect(change.addedLifelines).toEqual(['upstream']);
		expect(change.removedSteps).toEqual(['login-page', 'submit-credentials']);
		expect(change.addedSteps).toContain('upstream-token-request');
		expect(view({ broker: true }).groups.map((group) => group.id)).toEqual(['brokered-login']);
	});

	it('changes nothing the app sends or receives', () => {
		expect(change.addedFields).toEqual([]);
		expect(change.removedFields).toEqual([]);
		const appSteps = (settings: Partial<Settings>) =>
			view(settings)
				.steps.filter(
					(step) => step.phase !== 'setup' && (step.from === 'app' || step.to === 'app')
				)
				.map((step) => step.id);
		expect(appSteps({ broker: true })).toEqual(appSteps({}));
	});
});

describe('stored upstream tokens', () => {
	it('add a retrieval that differs between the two API versions', () => {
		const v1 = view({ broker: true, upstreamTokens: 'v1' });
		const v2 = view({ broker: true, upstreamTokens: 'v2' });
		const retrieval = (result: typeof v1) =>
			result.steps.find((step) => step.id === 'retrieve-upstream-token');
		expect(retrieval(v1)?.label).toMatch(/^GET/);
		expect(retrieval(v2)?.label).toMatch(/^POST/);
		expect(retrieval(v2)?.fields.map((f) => f.name)).toContain('client_secret');
		expect(retrieval(v1)?.fields.map((f) => f.name)).toEqual(['Authorization: Bearer']);
	});

	it('store the tokens inside the nested flow', () => {
		const stored = view({ broker: true, upstreamTokens: 'v1' }).steps.find(
			(step) => step.id === 'store-upstream-tokens'
		);
		expect(stored?.group).toBe('brokered-login');
	});
});

describe('diffs', () => {
	it('are empty for no change', () => {
		expect(isEmptyDiff(diff({ oidc: true }, { oidc: true }))).toBe(true);
	});

	it('run in both directions', () => {
		const on = diff({}, { broker: true });
		const off = diff({ broker: true }, {});
		expect(off.removedSteps).toEqual(on.addedSteps);
		expect(off.addedSteps).toEqual(on.removedSteps);
	});
});

describe('presets', () => {
	it.each(presets.map((preset) => [preset.id, preset] as const))('%s is valid', (_, preset) => {
		const settings = { ...defaultSettings, ...preset.settings };
		expect(allValidSettings()).toContainEqual(settings);
	});
});
