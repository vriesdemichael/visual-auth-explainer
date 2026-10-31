import { describe, expect, it } from 'vitest';
import { authorizationCode as flow } from '#lib/flow/authorization-code.ts';
import { evaluate } from '#lib/flow/model.ts';
import { allValidSettings, defaultSettings } from '#lib/flow/settings.ts';
import {
	nextStep,
	parseState,
	presetSearch,
	previousStep,
	resolveStep,
	serializeState,
	visibleSteps,
	withSetting,
	withSetupOpen
} from '#lib/flow/state.ts';

describe('the URL', () => {
	it('is empty for the default state', () => {
		expect(serializeState(flow, parseState(flow, ''))).toBe('');
	});

	it('holds only what differs from the defaults', () => {
		const state = parseState(flow, '');
		const { state: next } = withSetting(flow, state, 'oidc', true);
		expect(serializeState(flow, next)).toBe('oidc=1');
	});

	it('round-trips every valid combination at every step', () => {
		for (const settings of allValidSettings()) {
			const view = evaluate(flow, settings);
			for (const setupOpen of [false, true]) {
				for (const step of visibleSteps(view, setupOpen)) {
					const state = { flow: flow.id, settings, setupOpen, step: step.id };
					expect(parseState(flow, serializeState(flow, state))).toEqual(state);
				}
			}
		}
	});

	it('falls back on values it does not know', () => {
		const state = parseState(flow, 'binding=magic&step=nope&client=');
		expect(state.settings).toEqual(defaultSettings);
		expect(state.step).toBe('open-app');
	});

	it('rejects combinations that are not valid', () => {
		const state = parseState(flow, 'client=public&broker=1&upstream=v2&nonce=1');
		expect(state.settings.upstreamTokens).toBe('off');
		expect(state.settings.dpopNonce).toBe(false);
		expect(state.settings.broker).toBe(true);
	});

	it('opens setup when the step is in it', () => {
		const state = parseState(flow, 'step=discover');
		expect(state.setupOpen).toBe(true);
		expect(state.step).toBe('discover');
	});

	it('builds links for presets', () => {
		expect(presetSearch(flow, {})).toBe('');
		expect(presetSearch(flow, { binding: 'dpop', dpopNonce: true })).toBe('binding=dpop&nonce=1');
	});
});

describe('the current step', () => {
	it('stays put when a setting keeps it', () => {
		const state = parseState(flow, 'step=token-request');
		expect(withSetting(flow, state, 'oidc', true).state.step).toBe('token-request');
	});

	it('moves to the nearest earlier step when a setting removes it (ADR-003)', () => {
		const state = parseState(flow, 'oidc=1&step=userinfo-response');
		expect(withSetting(flow, state, 'oidc', false).state.step).toBe('token-response');

		const login = parseState(flow, 'step=submit-credentials');
		expect(withSetting(flow, login, 'broker', true).state.step).toBe('authorize');
	});

	it('falls to the first step when nothing earlier remains', () => {
		const view = evaluate(flow, defaultSettings);
		expect(resolveStep(flow, view, false, 'discover')).toBe('open-app');
	});

	it('leaves setup when setup closes', () => {
		const state = parseState(flow, 'step=discover');
		expect(withSetupOpen(flow, state, false).step).toBe('open-app');
	});
});

describe('stepping', () => {
	it('walks every visible step in order and stops at the end', () => {
		let state = parseState(flow, 'oidc=1&binding=dpop&nonce=1&broker=1&upstream=v2');
		const walked = [state.step];
		for (let next = nextStep(flow, state); next; next = nextStep(flow, state)) {
			state = next;
			walked.push(state.step);
		}
		const expected = visibleSteps(evaluate(flow, state.settings), false).map((s) => s.id);
		expect(walked).toEqual(expected);
		expect(nextStep(flow, state)).toBeNull();
	});

	it('walks back into setup from the first login step', () => {
		const state = previousStep(flow, parseState(flow, ''));
		expect(state?.setupOpen).toBe(true);
		expect(state?.step).toBe('discovery-document');
	});

	it('stops at the very first step', () => {
		expect(previousStep(flow, parseState(flow, 'setup=1'))).toBeNull();
	});
});
