import { describe, expect, it } from 'vitest';
import {
	allValidSettings,
	change,
	defaultSettings,
	holds,
	is,
	not,
	normalize,
	settingsIn,
	unavailable,
	all,
	any
} from '#lib/flow/settings.ts';

describe('conditions', () => {
	it('evaluate against the settings', () => {
		const oidcAndDpop = all(is('oidc', true), is('binding', 'dpop'));
		expect(holds(oidcAndDpop, defaultSettings)).toBe(false);
		expect(holds(oidcAndDpop, { ...defaultSettings, oidc: true, binding: 'dpop' })).toBe(true);
		expect(holds(not(is('oidc', true)), defaultSettings)).toBe(true);
		expect(holds(any(is('oidc', true), is('broker', false)), defaultSettings)).toBe(true);
	});

	it('name the settings they depend on', () => {
		expect(settingsIn(all(is('oidc', true), not(is('binding', 'dpop'))))).toEqual([
			'oidc',
			'binding'
		]);
	});
});

describe('constraints', () => {
	it('allow exactly the expected combinations', () => {
		// oidc (2) x token type (bearer, dpop, dpop with nonce) x client and upstream tokens:
		// confidential has no broker, broker, V1 and V2. Public has no V2.
		expect(allValidSettings()).toHaveLength(2 * 3 * (4 + 3));
	});

	it('include the defaults', () => {
		expect(normalize(defaultSettings).resets).toEqual([]);
	});

	it('say why an option is unavailable', () => {
		const publicClient = { ...defaultSettings, clientType: 'public', broker: true } as const;
		expect(unavailable('upstreamTokens', 'v2', publicClient)?.because).toMatch(/confidential/);
		expect(unavailable('upstreamTokens', 'v1', publicClient)).toBeNull();
		expect(unavailable('upstreamTokens', 'v1', defaultSettings)?.because).toMatch(/another IdP/);
		expect(unavailable('dpopNonce', true, defaultSettings)?.because).toMatch(/DPoP/);
	});

	it('reject invalid combinations and fall back to a valid one', () => {
		const invalid = { ...defaultSettings, dpopNonce: true, upstreamTokens: 'v1' } as const;
		const { settings, resets } = normalize(invalid);
		expect(settings).toEqual(defaultSettings);
		expect(resets.map((reset) => reset.setting)).toEqual(['dpopNonce', 'upstreamTokens']);
	});

	it('are stable: normalizing twice changes nothing', () => {
		for (const settings of allValidSettings()) {
			expect(normalize(normalize(settings).settings).settings).toEqual(settings);
		}
	});

	it('cascade when a change takes away what another setting needs', () => {
		const start = { ...defaultSettings, broker: true, upstreamTokens: 'v2' } as const;
		const toPublic = change(start, 'clientType', 'public');
		expect(toPublic.settings.upstreamTokens).toBe('off');
		expect(toPublic.settings.broker).toBe(true);
		expect(toPublic.resets[0].because).toMatch(/confidential/);

		const brokerOff = change({ ...start, upstreamTokens: 'v1' }, 'broker', false);
		expect(brokerOff.settings.upstreamTokens).toBe('off');
	});
});
