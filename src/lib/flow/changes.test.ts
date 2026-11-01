import { describe, expect, it } from 'vitest';
import {
	afterFlip,
	afterMove,
	NOTHING_CHANGED,
	settingsNotHere,
	type LastChange
} from '#lib/flow/changes.ts';
import { authorizationCodeBase as base } from '#lib/flow/index.ts';
import { diffViews, evaluate, type ViewDiff } from '#lib/flow/model.ts';
import { defaultSettings, simpleSettingIds, type Settings } from '#lib/flow/settings.ts';

const flow = base.diagrams.flow;
const setup = base.diagrams.setup;
const diffOf = (before: Partial<Settings>, after: Partial<Settings>): ViewDiff =>
	diffViews(
		evaluate(flow, { ...defaultSettings, ...before }),
		evaluate(flow, { ...defaultSettings, ...after })
	);
const none = diffOf({}, {});
const oidcOn = diffOf({}, { oidc: true });
const move = (diff: ViewDiff, rest: Partial<Parameters<typeof afterMove>[1]> = {}) => ({
	diff,
	stepChanged: false,
	diagramChanged: false,
	ready: true,
	byFlip: false,
	...rest
});

describe('what a flip says', () => {
	it('names the setting and what it reset', () => {
		const resets = [
			{ setting: 'upstreamTokens', because: 'It needs a secret.' }
		] as LastChange['resets'];
		const said = afterFlip(
			NOTHING_CHANGED,
			'clientType',
			flow,
			setup,
			defaultSettings,
			{ ...defaultSettings, clientType: 'public' },
			resets
		);
		expect(said.setting).toBe('clientType');
		expect(said.resets).toEqual(resets);
		expect(said.elsewhere).toBe(false);
	});

	it('says when it only changed the other diagram', () => {
		const said = afterFlip(
			{ ...NOTHING_CHANGED, diff: oidcOn },
			'broker',
			setup,
			flow,
			defaultSettings,
			defaultSettings,
			[]
		);
		expect(said.elsewhere).toBe(false);
		// A setting that only the user flow shows, looked at from setup.
		const consent = afterFlip(
			{ ...NOTHING_CHANGED, diff: oidcOn },
			'attacker',
			setup,
			flow,
			defaultSettings,
			{ ...defaultSettings, attacker: true },
			[]
		);
		expect(consent.elsewhere).toBe(true);
		expect(consent.diff).toBeNull();
	});
});

describe('what is said once the state has moved', () => {
	const flipped: LastChange = {
		diff: null,
		resets: [{ setting: 'upstreamTokens', because: 'It needs a secret.' }],
		elsewhere: false,
		setting: 'oidc'
	};

	it('keeps the why of a flip, with what it did', () => {
		const said = afterMove(flipped, move(oidcOn, { byFlip: true }));
		expect(said).toEqual({ ...flipped, diff: oidcOn });
	});

	it('does not explain Back with the words of the setting flipped before it', () => {
		const said = afterMove({ ...flipped, diff: oidcOn }, move(diffOf({ oidc: true }, {})));
		expect(said.setting).toBeNull();
		expect(said.resets).toEqual([]);
		expect(said.diff?.removedSteps.length).toBeGreaterThan(0);
	});

	it('does not say something was reset after Back restored it', () => {
		const said = afterMove(flipped, move(oidcOn));
		expect(said.resets).toEqual([]);
	});

	it('goes away on stepping', () => {
		expect(afterMove({ ...flipped, diff: oidcOn }, move(none, { stepChanged: true }))).toBe(
			NOTHING_CHANGED
		);
	});

	it('goes away on the other diagram', () => {
		expect(afterMove(flipped, move(oidcOn, { diagramChanged: true }))).toBe(NOTHING_CHANGED);
	});

	it('stays when nothing moved', () => {
		expect(afterMove(flipped, move(none))).toBe(flipped);
	});

	it('says nothing about the page starting up', () => {
		expect(afterMove(NOTHING_CHANGED, move(oidcOn, { ready: false }))).toBe(NOTHING_CHANGED);
	});
});

describe('which settings simple mode leaves out', () => {
	it('offers every switch that does something on the user flow', () => {
		expect(settingsNotHere(base, 'flow', defaultSettings)).toEqual([]);
	});

	it('leaves out those about the other diagram on setup', () => {
		const left = settingsNotHere(base, 'setup', defaultSettings);
		expect(left).toContain('attacker');
		expect(left.every((id) => simpleSettingIds.includes(id))).toBe(true);
	});

	it('keeps a setting someone has left on', () => {
		const on = { ...defaultSettings, attacker: true };
		expect(settingsNotHere(base, 'setup', on)).not.toContain('attacker');
	});
});
