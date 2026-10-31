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

describe('the plain language', () => {
	const everything = [...flow.steps, ...setup.steps];
	const plainTexts = allValidSettings().flatMap((settings) =>
		[flow, setup].flatMap((diagram) => evaluate(diagram, settings).steps.map((step) => step.plain))
	);

	it('is there for every step', () => {
		for (const text of plainTexts) expect(text).not.toBe('');
		expect(everything.every((step) => step.plain)).toBe(true);
	});

	it('uses no words from the wire, because that is what advanced mode is for', () => {
		const wire = /\b(GET|POST|302|400|\/\w+|client_id|redirect_uri|scope|nonce|IdP)\b/;
		expect([...new Set(plainTexts)].filter((text) => wire.test(text))).toEqual([]);
	});

	it('fits on the lifelines', () => {
		for (const line of [...flow.lifelines, ...setup.lifelines]) {
			expect(line.plainName.length, line.id).toBeLessThanOrEqual(18);
			expect(line.plainRole.length, line.id).toBeLessThanOrEqual(20);
		}
	});

	it('explains what an issuer is, on the identity provider', () => {
		const idp = flow.lifelines.find((line) => line.id === 'idp');
		expect(idp?.concept).toContain('issuer');
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

describe('PKCE', () => {
	const change = diff({}, { pkce: true });
	const fieldsOf = (id: string, settings: Partial<Settings> = { pkce: true }) =>
		view(settings)
			.steps.find((step) => step.id === id)
			?.fields.map((field) => field.name);

	it('adds the challenge going out and the verifier coming back', () => {
		expect(fieldsOf('authorize')).toEqual(
			expect.arrayContaining(['code_challenge', 'code_challenge_method=S256'])
		);
		expect(fieldsOf('token-request')).toContain('code_verifier');
		expect(fieldsOf('authorize')).not.toContain('code_verifier');
	});

	it('adds the app making them and the identity provider checking them', () => {
		expect(change.addedSteps).toEqual(['make-verifier', 'check-verifier']);
		expect(change.addedLifelines).toEqual([]);
		const steps = view({ pkce: true }).steps.map((step) => step.id);
		expect(steps.indexOf('make-verifier')).toBeLessThan(steps.indexOf('redirect-to-idp'));
		expect(steps.indexOf('check-verifier')).toBe(steps.indexOf('token-response') - 1);
	});

	it('never sends the verifier through the browser, whatever the settings', () => {
		for (const settings of allValidSettings()) {
			const flowView = evaluate(flow, settings);
			const held = holdingsAt(flowView, flowView.steps.at(-1)!.id);
			expect(held.browser).not.toContain('verifier');
			if (settings.pkce) expect(held.browser).toContain('challenge');
		}
	});

	it('leaves the secret with the app, so a verifier does not replace it', () => {
		const heldAt = (id: string) => holdingsAt(view({ pkce: true }), id);
		expect(heldAt('make-verifier').app).toEqual(['secret', 'verifier', 'challenge']);
		expect(heldAt('authorize').idp).toEqual(['secret', 'challenge']);
		expect(heldAt('callback').idp).not.toContain('verifier');
		expect(heldAt('token-request').idp).toContain('verifier');
	});

	// Keycloak takes all four, which is what makes the two settings independent (questions.json).
	it('does not depend on the client type', () => {
		const combinations = allValidSettings();
		for (const clientType of ['public', 'confidential'] as const) {
			for (const pkce of [false, true]) {
				expect(combinations).toContainEqual({ ...defaultSettings, clientType, pkce });
			}
		}
	});

	it('says what a stolen code is worth, and that differs for each case', () => {
		const stolen = (settings: Partial<Settings>) =>
			view(settings).steps.find((step) => step.id === 'token-request')?.pitfall;
		expect(stolen({ clientType: 'public' })?.text).toMatch(/gets the tokens/);
		expect(stolen({ clientType: 'public', pkce: true })?.text).toMatch(/get nothing/);
		expect(stolen({})?.text).toMatch(/hand the code to the real app/);
		expect(stolen({ pkce: true })?.text).toMatch(/get nothing/);
		expect(stolen({ oidc: true })?.text).toMatch(/nonce/);
	});

	it('takes back what the app says about a code being worth little, when it is not', () => {
		const said = (settings: Partial<Settings>) =>
			view(settings).steps.find((step) => step.id === 'callback')?.concept;
		expect(said({})).toMatch(/worth little/);
		expect(said({ clientType: 'public', pkce: true })).toMatch(/worth little/);
		expect(said({ clientType: 'public' })).toMatch(/all anyone needs/);
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
