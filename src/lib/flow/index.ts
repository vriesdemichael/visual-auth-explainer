import { authorizationCode } from '#lib/flow/authorization-code.ts';
import type { FlowDef } from '#lib/flow/model.ts';
import type { Settings } from '#lib/flow/settings.ts';

export const flows: Record<string, FlowDef> = {
	[authorizationCode.id]: authorizationCode
};

export interface Preset {
	id: string;
	title: string;
	flow: string;
	settings: Partial<Settings>;
}

export const presets: readonly Preset[] = [
	{ id: 'oauth', title: 'OAuth', flow: authorizationCode.id, settings: {} },
	{ id: 'oidc', title: 'OpenID Connect', flow: authorizationCode.id, settings: { oidc: true } },
	{ id: 'dpop', title: 'DPoP', flow: authorizationCode.id, settings: { binding: 'dpop' } },
	{
		id: 'dpop-nonce',
		title: 'DPoP with a nonce',
		flow: authorizationCode.id,
		settings: { binding: 'dpop', dpopNonce: true }
	},
	{ id: 'broker', title: 'External IdP', flow: authorizationCode.id, settings: { broker: true } },
	{
		id: 'upstream-v1',
		title: 'Stored upstream tokens, API V1',
		flow: authorizationCode.id,
		settings: { broker: true, upstreamTokens: 'v1' }
	},
	{
		id: 'upstream-v2',
		title: 'Stored upstream tokens, API V2',
		flow: authorizationCode.id,
		settings: { broker: true, upstreamTokens: 'v2' }
	},
	{
		id: 'everything',
		title: 'Everything on',
		flow: authorizationCode.id,
		settings: {
			oidc: true,
			binding: 'dpop',
			dpopNonce: true,
			broker: true,
			upstreamTokens: 'v2'
		}
	}
];
