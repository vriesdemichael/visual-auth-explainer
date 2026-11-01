import type { SourceRef } from '#lib/sources/sources.ts';

export interface Settings {
	oidc: boolean;
	clientType: 'public' | 'confidential';
	binding: 'bearer' | 'dpop';
	dpopNonce: boolean;
	broker: boolean;
	upstreamTokens: 'off' | 'v1' | 'v2';
}

export type SettingId = keyof Settings;

/** Conditions are data, not functions, so the application can say which setting caused what. */
export type Condition =
	| { [K in SettingId]: { setting: K; is: Settings[K] } }[SettingId]
	| { all: readonly Condition[] }
	| { any: readonly Condition[] }
	| { not: Condition };

export const is = <K extends SettingId>(setting: K, value: Settings[K]): Condition =>
	({ setting, is: value }) as Condition;
export const all = (...conditions: Condition[]): Condition => ({ all: conditions });
export const any = (...conditions: Condition[]): Condition => ({ any: conditions });
export const not = (condition: Condition): Condition => ({ not: condition });

export function holds(condition: Condition, settings: Settings): boolean {
	if ('setting' in condition) return settings[condition.setting] === condition.is;
	if ('all' in condition) return condition.all.every((c) => holds(c, settings));
	if ('any' in condition) return condition.any.some((c) => holds(c, settings));
	return !holds(condition.not, settings);
}

export function settingsIn(condition: Condition): SettingId[] {
	if ('setting' in condition) return [condition.setting];
	const parts =
		'all' in condition ? condition.all : 'any' in condition ? condition.any : [condition.not];
	return [...new Set(parts.flatMap(settingsIn))];
}

/** What must hold for a setting or option to be available, and the reason to show when it does not. */
export interface Requirement {
	when: Condition;
	because: string;
}

interface SettingBase {
	label: string;
	param: string;
	summary: string;
	sources: readonly SourceRef[];
	requires?: Requirement;
}

export interface ToggleDef extends SettingBase {
	kind: 'toggle';
	default: boolean;
}

export interface OptionDef<V extends string = string> {
	value: V;
	label: string;
	requires?: Requirement;
}

export interface ChoiceDef<V extends string = string> extends SettingBase {
	kind: 'choice';
	default: V;
	options: readonly OptionDef<V>[];
}

export type SettingDef = ToggleDef | ChoiceDef;

type DefFor<T> = [T] extends [boolean] ? ToggleDef : ChoiceDef<T & string>;

export const settingDefs: { [K in SettingId]: DefFor<Settings[K]> } = {
	oidc: {
		kind: 'toggle',
		label: 'OpenID Connect',
		param: 'oidc',
		default: false,
		summary: 'Adds proof of who logged in on top of the access OAuth grants.',
		sources: [
			{
				source: 'oidc-core',
				why: 'This switch adds what it defines on top of OAuth: the openid scope, the ID token and UserInfo.'
			}
		]
	},
	clientType: {
		kind: 'choice',
		label: 'Client type',
		param: 'client',
		default: 'confidential',
		summary:
			'Whether the app can keep a secret. A public client also needs PKCE, not modelled yet.',
		sources: [
			{
				source: 'rfc6749',
				section: '2.1',
				why: 'Section 2.1 defines both types by one thing: whether the client can keep its credentials confidential. An app in a browser cannot.'
			}
		],
		options: [
			{ value: 'confidential', label: 'Confidential' },
			{ value: 'public', label: 'Public' }
		]
	},
	binding: {
		kind: 'choice',
		label: 'Token type',
		param: 'binding',
		default: 'bearer',
		summary: 'Whether holding the token is enough, or the app must also prove it holds a key.',
		sources: [
			{ source: 'rfc6750', why: 'This is the Bearer option: holding the token is enough.' },
			{
				source: 'rfc9449',
				why: 'This is the DPoP option: the app also has to prove it holds the key.'
			}
		],
		options: [
			{ value: 'bearer', label: 'Bearer' },
			{ value: 'dpop', label: 'DPoP' }
		]
	},
	dpopNonce: {
		kind: 'toggle',
		label: 'Server requires a nonce',
		param: 'nonce',
		default: false,
		summary: 'The server rejects the first proof, to limit how long a proof can be used.',
		sources: [
			{
				source: 'rfc9449',
				section: '8',
				why: 'Section 8 lets the server answer a proof without its nonce with use_dpop_nonce, which limits how far ahead a proof can be made.'
			}
		],
		requires: { when: is('binding', 'dpop'), because: 'A DPoP nonce only applies to DPoP tokens.' }
	},
	broker: {
		kind: 'toggle',
		label: 'External IdP',
		param: 'broker',
		default: false,
		summary: 'The IdP hands the login to another IdP. The app does not notice.',
		sources: [
			{
				source: 'keycloak-brokering',
				why: "Keycloak's name for this is identity brokering. The diagram shows a login through an upstream provider that uses the authorization code flow."
			}
		]
	},
	upstreamTokens: {
		kind: 'choice',
		label: 'Stored upstream tokens',
		param: 'upstream',
		default: 'off',
		summary: "The IdP keeps the upstream IdP's tokens, and the app can ask for them.",
		sources: [
			{
				source: 'keycloak-stored-tokens',
				why: 'The two API options here are the two versions this page describes.'
			}
		],
		requires: {
			when: is('broker', true),
			because: 'Upstream tokens only exist when another IdP handles the login.'
		},
		options: [
			{ value: 'off', label: 'Off' },
			{ value: 'v1', label: 'API V1' },
			{
				value: 'v2',
				label: 'API V2',
				requires: {
					when: all(is('clientType', 'confidential'), is('binding', 'bearer')),
					because: 'API V2 only works with a confidential client and a Bearer token.'
				}
			}
		]
	}
};

export const settingIds = Object.keys(settingDefs) as SettingId[];

export const defaultSettings = Object.fromEntries(
	settingIds.map((id) => [id, settingDefs[id].default])
) as unknown as Settings;

function optionOf(id: SettingId, value: unknown): OptionDef | undefined {
	const def: SettingDef = settingDefs[id];
	return def.kind === 'choice' ? def.options.find((option) => option.value === value) : undefined;
}

/** Why this setting could not take this value right now, or null when it can. */
export function unavailable<K extends SettingId>(
	id: K,
	value: Settings[K],
	settings: Settings
): Requirement | null {
	if (value === settingDefs[id].default) return null;
	const requirements = [settingDefs[id].requires, optionOf(id, value)?.requires];
	return requirements.find((r) => r && !holds(r.when, settings)) ?? null;
}

export function isOffered(id: SettingId, settings: Settings): boolean {
	const requires = settingDefs[id].requires;
	return !requires || holds(requires.when, settings);
}

export interface Reset {
	setting: SettingId;
	because: string;
}

/** Settings fall back to their default when what they need no longer holds, until nothing changes. */
export function normalize(settings: Settings): { settings: Settings; resets: Reset[] } {
	const next = { ...settings };
	const resets: Reset[] = [];
	let changed = true;
	while (changed) {
		changed = false;
		for (const id of settingIds) {
			const failed = unavailable(id, next[id], next);
			if (failed) {
				Object.assign(next, { [id]: settingDefs[id].default });
				resets.push({ setting: id, because: failed.because });
				changed = true;
			}
		}
	}
	return { settings: next, resets };
}

export function change<K extends SettingId>(settings: Settings, id: K, value: Settings[K]) {
	return normalize({ ...settings, [id]: value });
}

function valuesOf(id: SettingId): readonly (boolean | string)[] {
	const def: SettingDef = settingDefs[id];
	return def.kind === 'toggle' ? [false, true] : def.options.map((option) => option.value);
}

export function allValidSettings(): Settings[] {
	const combinations = settingIds.reduce<Partial<Settings>[]>(
		(partial, id) =>
			partial.flatMap((settings) => valuesOf(id).map((value) => ({ ...settings, [id]: value }))),
		[{}]
	) as Settings[];
	return combinations.filter((settings) => normalize(settings).resets.length === 0);
}
