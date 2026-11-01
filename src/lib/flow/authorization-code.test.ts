import { describe, expect, it } from 'vitest';
import { authorizationCode as flow } from '#lib/flow/authorization-code.ts';
import { authorizationCodeSetup as setup } from '#lib/flow/authorization-code-setup.ts';
import { diffViews, evaluate, holdingsAt, isEmptyDiff, type DiagramId } from '#lib/flow/model.ts';
import { authorizationCodeBase as base, presets } from '#lib/flow/index.ts';
import { allValidSettings, defaultSettings, type Settings } from '#lib/flow/settings.ts';
import shippedStepIds from '#lib/flow/shipped-step-ids.json';

const view = (settings: Partial<Settings> = {}) =>
	evaluate(flow, { ...defaultSettings, ...settings });
const diff = (before: Partial<Settings>, after: Partial<Settings>) =>
	diffViews(view(before), view(after));
const setupView = (settings: Partial<Settings> = {}) =>
	evaluate(setup, { ...defaultSettings, ...settings });

describe('every valid combination', () => {
	const combinations = allValidSettings();
	const diagrams: readonly DiagramId[] = ['flow', 'setup'];

	it.each(diagrams)('uses unique step IDs in the definition of %s', (diagram) => {
		const ids = base.diagrams[diagram].steps.map((step) => step.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	describe.each(diagrams)('in %s', (diagram) => {
		it.each(combinations.map((settings) => [JSON.stringify(settings), settings] as const))(
			'builds a coherent diagram: %s',
			(_, settings) => {
				const result = evaluate(base.diagrams[diagram], settings);
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
					for (const link of step.links) {
						const target = evaluate(base.diagrams[link.diagram], settings);
						expect(link.diagram, `${step.id} links to its own diagram`).not.toBe(diagram);
						expect(target.steps.map((s) => s.id)).toContain(link.step);
					}
				}
			}
		);
	});

	it('produces a different user flow for each one', () => {
		const shapes = combinations.map((settings) => JSON.stringify(evaluate(flow, settings)));
		expect(new Set(shapes).size).toBe(combinations.length);
	});
});

describe('step IDs', () => {
	it('stay stable, because links depend on them (ADR-003)', () => {
		const ids = [...flow.steps, ...setup.steps].map((step) => step.id);
		expect(new Set(ids).size).toBe(ids.length);
		expect(ids.sort()).toEqual([...shippedStepIds].sort());
	});
});

describe('how a message travels', () => {
	const channelOf = (id: string) => view().steps.find((step) => step.id === id)?.channel;

	it('is through the browser whenever the browser is on either end', () => {
		for (const settings of allValidSettings()) {
			for (const step of evaluate(flow, settings).steps) {
				const browser = step.from === 'browser' || step.to === 'browser';
				if (browser) expect(step.channel, step.id).toBe('front');
				else expect(step.channel, step.id).not.toBe('front');
			}
		}
	});

	it('tells the code in the redirect from the tokens on the direct call', () => {
		expect(channelOf('redirect-with-code')).toBe('front');
		expect(channelOf('token-request')).toBe('back');
		expect(channelOf('token-response')).toBe('back');
		expect(channelOf('api-check-token')).toBe('internal');
	});

	it('is people in setup, until the app itself calls', () => {
		const channel = (id: string) => setupView().steps.find((step) => step.id === id)?.channel;
		expect(channel('register-client')).toBe('people');
		expect(channel('discover')).toBe('back');
	});
});

// This is what the application teaches at every step, so it must hold everywhere it can be seen.
describe('who has seen what', () => {
	const lastStep = (settings: Settings) => evaluate(flow, settings).steps.at(-1)!.id;
	const heldAtEnd = (settings: Settings) =>
		holdingsAt(evaluate(flow, settings), lastStep(settings));

	it('keeps the password from the app, whatever the settings', () => {
		for (const settings of allValidSettings()) {
			expect(heldAtEnd(settings).app).not.toContain('password');
			expect(heldAtEnd(settings).api).not.toContain('password');
		}
	});

	it('keeps tokens from the browser, because they never go through it', () => {
		for (const settings of allValidSettings()) {
			const browser = heldAtEnd(settings).browser;
			expect(browser).not.toContain('access-token');
			expect(browser).not.toContain('id-token');
			expect(browser).not.toContain('secret');
		}
	});

	it('does show the code to the browser, which is why a code is worth little alone', () => {
		expect(heldAtEnd(defaultSettings).browser).toContain('code');
	});

	it('never shows the API the ID token, which is not for it', () => {
		for (const settings of allValidSettings()) {
			expect(heldAtEnd(settings).api).not.toContain('id-token');
		}
	});

	it('lets the API see the access token only when the app calls it', () => {
		const flowView = view();
		expect(holdingsAt(flowView, 'token-response').api).toEqual([]);
		expect(holdingsAt(flowView, 'api-request').api).toEqual(['access-token']);
	});

	it('builds up step by step', () => {
		const flowView = view();
		expect(holdingsAt(flowView, 'open-app').app).toEqual(['secret']);
		expect(holdingsAt(flowView, 'callback').app).toEqual(['secret', 'code']);
		expect(holdingsAt(flowView, 'token-response').app).toEqual(['secret', 'code', 'access-token']);
	});

	it('hands the password to the upstream IdP instead when another IdP does the login', () => {
		const brokered = { ...defaultSettings, broker: true };
		expect(heldAtEnd(brokered).upstream).toContain('password');
		expect(heldAtEnd(brokered).idp).not.toContain('password');
		expect(heldAtEnd(defaultSettings).idp).toContain('password');
	});

	it('gives a public client no secret to start with', () => {
		const held = heldAtEnd({ ...defaultSettings, clientType: 'public' });
		expect(held.app).not.toContain('secret');
	});

	it('moves the secret from the admin to the team to the app in setup', () => {
		const setupFlow = setupView();
		expect(holdingsAt(setupFlow, 'register-client')['idp-admin']).toEqual([]);
		expect(holdingsAt(setupFlow, 'create-client')['idp-admin']).toEqual(['secret']);
		expect(holdingsAt(setupFlow, 'create-client')['app-team']).toEqual([]);
		expect(holdingsAt(setupFlow, 'hand-over-credentials')['app-team']).toEqual(['secret']);
		expect(holdingsAt(setupFlow, 'hand-over-credentials').app).toEqual([]);
		expect(holdingsAt(setupFlow, 'configure-app').app).toEqual(['secret']);
	});
});

describe('the two diagrams', () => {
	const combinations = allValidSettings();

	it('keep the user and the browser out of setup', () => {
		for (const settings of combinations) {
			const ids = evaluate(setup, settings).lifelines.map((line) => line.id);
			expect(ids).not.toContain('browser');
			expect(ids).not.toContain('api');
		}
	});

	it('put the people who do setup on its diagram', () => {
		expect(setupView().lifelines.map((line) => line.id)).toEqual([
			'app-team',
			'app',
			'idp',
			'idp-admin'
		]);
	});

	it('keep people out of the user flow', () => {
		for (const settings of combinations) {
			expect(evaluate(flow, settings).steps.map((step) => step.kind)).not.toContain('human');
		}
	});

	it('draw hand-offs differently from discovery, which really is HTTP', () => {
		const kindOf = (id: string) => setupView().steps.find((step) => step.id === id)?.kind;
		expect(kindOf('register-client')).toBe('human');
		expect(kindOf('hand-over-credentials')).toBe('human');
		expect(kindOf('discover')).toBe('request');
		expect(kindOf('discovery-document')).toBe('response');
	});

	it('link the redirect URI check to where it was registered, and back', () => {
		const authorize = view().steps.find((step) => step.id === 'authorize');
		expect(authorize?.links.map((link) => link.step)).toEqual(['register-client']);
		const register = setupView().steps.find((step) => step.id === 'register-client');
		expect(register?.links.map((link) => link.step)).toEqual(['authorize']);
	});

	it('link the start of the user flow to setup, and the end of setup to the user flow', () => {
		expect(view().steps[0].links[0]).toMatchObject({ diagram: 'setup' });
		expect(setupView().steps.at(-1)?.links[0]).toMatchObject({ diagram: 'flow', step: 'open-app' });
	});

	it('let a setting reach into setup', () => {
		const change = diffViews(setupView(), setupView({ broker: true }));
		expect(change.addedLifelines).toEqual(['upstream']);
		expect(change.addedSteps).toEqual(['register-with-upstream']);
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
				.steps.filter((step) => step.from === 'app' || step.to === 'app')
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
