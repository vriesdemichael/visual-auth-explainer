import { describe, expect, it } from 'vitest';
import { authorizationCodeBase as base } from '#lib/flow/index.ts';
import { evaluate, type DiagramId } from '#lib/flow/model.ts';
import { allValidSettings, defaultSettings, settingDefs } from '#lib/flow/settings.ts';
import {
	nextStep,
	parseState,
	presetSearch,
	previousStep,
	resolveStep,
	serializeState,
	withDiagram,
	withSetting,
	withSourceClosed,
	withSourceOpen,
	withSourceSection
} from '#lib/flow/state.ts';

const onFlow = (search: string) => parseState(base, 'flow', search);
const onSetup = (search: string) => parseState(base, 'setup', search);

describe('the URL', () => {
	it('is empty for the default state of each diagram', () => {
		expect(serializeState(base, onFlow(''))).toBe('');
		expect(serializeState(base, onSetup(''))).toBe('');
	});

	it('holds only what differs from the defaults', () => {
		const { state: next } = withSetting(base, onFlow(''), 'oidc', true);
		expect(serializeState(base, next)).toBe('oidc=1');
	});

	it('round-trips every valid combination at every step of both diagrams', () => {
		const diagrams: readonly DiagramId[] = ['flow', 'setup'];
		for (const settings of allValidSettings()) {
			for (const diagram of diagrams) {
				for (const step of evaluate(base.diagrams[diagram], settings).steps) {
					const state = { flow: base.id, diagram, settings, step: step.id, source: null };
					expect(parseState(base, diagram, serializeState(base, state))).toEqual(state);
				}
			}
		}
	});

	it('falls back on values it does not know', () => {
		const state = onFlow('binding=magic&step=nope&client=');
		expect(state.settings).toEqual(defaultSettings);
		expect(state.step).toBe('open-app');
	});

	it('rejects combinations that are not valid', () => {
		const state = onFlow('client=public&broker=1&upstream=v2&nonce=1');
		expect(state.settings.upstreamTokens).toBe('off');
		expect(state.settings.dpopNonce).toBe(false);
		expect(state.settings.broker).toBe(true);
	});

	it('builds links for presets', () => {
		expect(presetSearch(base, {})).toBe('');
		expect(presetSearch(base, { binding: 'dpop', dpopNonce: true })).toBe('binding=dpop&nonce=1');
	});
});

describe('older links (ADR-003)', () => {
	it('open setup when they ask for it', () => {
		const state = onFlow('setup=1');
		expect(state.diagram).toBe('setup');
		expect(state.step).toBe('register-client');
	});

	it('open setup when the step is in it', () => {
		const state = onFlow('step=discover');
		expect(state.diagram).toBe('setup');
		expect(state.step).toBe('discover');
	});

	it('follow the step when it is in the user flow', () => {
		const state = onFlow('setup=1&step=open-app');
		expect(state.diagram).toBe('flow');
		expect(state.step).toBe('open-app');
	});

	it('work from either path', () => {
		expect(onSetup('step=open-app').diagram).toBe('flow');
		expect(onSetup('').diagram).toBe('setup');
	});
});

describe('the current step', () => {
	it('stays put when a setting keeps it', () => {
		const state = onFlow('step=token-request');
		expect(withSetting(base, state, 'oidc', true).state.step).toBe('token-request');
	});

	it('moves to the nearest earlier step when a setting removes it (ADR-003)', () => {
		const state = onFlow('oidc=1&step=userinfo-response');
		expect(withSetting(base, state, 'oidc', false).state.step).toBe('token-response');

		const login = onFlow('step=submit-credentials');
		expect(withSetting(base, login, 'broker', true).state.step).toBe('authorize');

		const brokered = onSetup('broker=1&step=register-with-upstream');
		expect(withSetting(base, brokered, 'broker', false).state.step).toBe('hand-over-credentials');
	});

	it('falls to the first step when nothing earlier remains', () => {
		const flow = base.diagrams.flow;
		expect(resolveStep(flow, evaluate(flow, defaultSettings), 'discover')).toBe('open-app');
	});
});

describe('switching diagrams', () => {
	it('keeps the settings and starts at the first step', () => {
		const state = withDiagram(base, onFlow('oidc=1&step=token-request'), 'setup');
		expect(state.diagram).toBe('setup');
		expect(state.settings.oidc).toBe(true);
		expect(state.step).toBe('register-client');
	});

	it('can go straight to a related step', () => {
		const state = withDiagram(base, onSetup(''), 'flow', 'authorize');
		expect(state.diagram).toBe('flow');
		expect(state.step).toBe('authorize');
	});
});

describe('an open source', () => {
	const ref = settingDefs.dpopNonce.sources[0];

	it('round-trips through the URL, with its section', () => {
		const state = withSourceOpen(onFlow('binding=dpop'), 'dpopNonce', ref);
		const search = serializeState(base, state);
		expect(search).toBe('binding=dpop&source=rfc9449&for=nonce&section=8');
		expect(onFlow(search)).toEqual(state);
	});

	it('survives moving around, because it is beside the diagram', () => {
		const state = withSourceOpen(onFlow(''), 'binding', settingDefs.binding.sources[0]);
		expect(nextStep(base, state)?.source).toEqual(state.source);
		expect(withSetting(base, state, 'oidc', true).state.source).toEqual(state.source);
		expect(withDiagram(base, state, 'setup').source).toEqual(state.source);
	});

	it('can move to another section, or to none', () => {
		const state = withSourceOpen(onFlow('binding=dpop'), 'dpopNonce', ref);
		expect(withSourceSection(state, '9').source?.section).toBe('9');
		expect(withSourceSection(state, null).source?.section).toBeNull();
	});

	it('closes', () => {
		const state = withSourceOpen(onFlow(''), 'binding', settingDefs.binding.sources[0]);
		const closed = withSourceClosed(state);
		expect(closed.source).toBeNull();
		expect(serializeState(base, closed)).toBe('');
	});

	it('opens nothing for a link it does not recognise', () => {
		expect(onFlow('source=rfc9449').source).toBeNull();
		expect(onFlow('source=rfc1&for=binding').source).toBeNull();
		expect(onFlow('source=rfc9449&for=nope').source).toBeNull();
		expect(onFlow('source=rfc6749&for=binding').source).toBeNull();
	});

	it('has no section when it has no text to open at', () => {
		expect(onFlow('source=oidc-core&for=oidc&section=8').source).toEqual({
			id: 'oidc-core',
			setting: 'oidc',
			section: null
		});
	});
});

describe('stepping', () => {
	it('walks every step of a diagram in order and stops at the end', () => {
		let state = onFlow('oidc=1&binding=dpop&nonce=1&broker=1&upstream=v1');
		const walked = [state.step];
		for (let next = nextStep(base, state); next; next = nextStep(base, state)) {
			state = next;
			walked.push(state.step);
		}
		const expected = evaluate(base.diagrams.flow, state.settings).steps.map((s) => s.id);
		expect(walked).toEqual(expected);
		expect(nextStep(base, state)).toBeNull();
	});

	it('stays inside a diagram in both directions', () => {
		expect(previousStep(base, onFlow(''))).toBeNull();
		expect(previousStep(base, onSetup(''))).toBeNull();
		expect(nextStep(base, onSetup('step=discovery-document'))).toBeNull();
	});
});
