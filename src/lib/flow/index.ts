import { authorizationCode } from '#lib/flow/authorization-code.ts';
import { authorizationCodeSetup } from '#lib/flow/authorization-code-setup.ts';
import type { BaseFlow } from '#lib/flow/model.ts';
import type { Settings } from '#lib/flow/settings.ts';

export const authorizationCodeBase: BaseFlow = {
	id: authorizationCode.id,
	diagrams: { flow: authorizationCode, setup: authorizationCodeSetup }
};

export const flows: Record<string, BaseFlow> = {
	[authorizationCodeBase.id]: authorizationCodeBase
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
	{ id: 'pkce', title: 'PKCE', flow: authorizationCode.id, settings: { pkce: true } },
	{
		id: 'public',
		title: 'An app with no secret',
		flow: authorizationCode.id,
		settings: { clientType: 'public' }
	},
	{
		id: 'public-pkce',
		title: 'An app with no secret, with PKCE',
		flow: authorizationCode.id,
		settings: { clientType: 'public', pkce: true }
	},
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
			pkce: true,
			binding: 'dpop',
			dpopNonce: true,
			broker: true,
			upstreamTokens: 'v1'
		}
	}
];
