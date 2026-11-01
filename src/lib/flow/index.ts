import { authorizationCode } from '#lib/flow/authorization-code.ts';
import { authorizationCodeSetup } from '#lib/flow/authorization-code-setup.ts';
import type { BaseFlow, Preset } from '#lib/flow/model.ts';
import { settingIds } from '#lib/flow/settings.ts';

const presets: readonly Preset[] = [
	{ id: 'oauth', title: 'OAuth', settings: {} },
	{ id: 'api-no-token', title: 'The API sent no token', settings: { apiToken: 'none' } },
	{ id: 'api-expired', title: 'The API sent an expired token', settings: { apiToken: 'expired' } },
	{ id: 'api-changed', title: 'The API sent a changed token', settings: { apiToken: 'changed' } },
	{
		id: 'api-elsewhere',
		title: 'The API sent a token for another API',
		settings: { apiToken: 'elsewhere' }
	},
	{
		id: 'api-no-scope',
		title: 'The API sent a token that does not allow this',
		settings: { apiToken: 'noscope' }
	},
	{ id: 'oidc', title: 'OpenID Connect', settings: { oidc: true } },
	{
		id: 'consent',
		title: 'Asking the user',
		settings: { consent: true }
	},
	{ id: 'pkce', title: 'PKCE', settings: { pkce: true } },
	{
		id: 'public',
		title: 'An app with no secret',
		settings: { clientType: 'public' }
	},
	{
		id: 'public-pkce',
		title: 'An app with no secret, with PKCE',
		settings: { clientType: 'public', pkce: true }
	},
	{
		id: 'oidc-pkce',
		title: 'OpenID Connect with PKCE',
		settings: { oidc: true, pkce: true }
	},
	{
		id: 'browser-app',
		title: 'An app in the browser',
		settings: { oidc: true, clientType: 'public', pkce: true }
	},
	{
		id: 'attack-public',
		title: 'An attacker, against an app with no secret',
		settings: { attacker: true, clientType: 'public' }
	},
	{
		id: 'attack-public-pkce',
		title: 'An attacker, against an app with no secret, with PKCE',
		settings: { attacker: true, clientType: 'public', pkce: true }
	},
	{
		id: 'attack-confidential',
		title: 'An attacker, against an app with a secret',
		settings: { attacker: true }
	},
	{
		id: 'attack-confidential-pkce',
		title: 'An attacker, against an app with a secret, with PKCE',
		settings: { attacker: true, pkce: true }
	},
	{ id: 'dpop', title: 'DPoP', settings: { binding: 'dpop' } },
	{
		id: 'dpop-nonce',
		title: 'DPoP with a nonce',
		settings: { binding: 'dpop', dpopNonce: true }
	},
	{ id: 'broker', title: 'External IdP', settings: { broker: true } },
	{
		id: 'upstream-v1',
		title: 'Stored upstream tokens, API V1',
		settings: { broker: true, upstreamTokens: 'v1' }
	},
	{
		id: 'upstream-v2',
		title: 'Stored upstream tokens, API V2',
		settings: { broker: true, upstreamTokens: 'v2' }
	},
	{
		id: 'everything',
		title: 'Everything on',
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

export const authorizationCodeBase: BaseFlow = {
	id: authorizationCode.id,
	diagrams: { flow: authorizationCode, setup: authorizationCodeSetup },
	settings: settingIds,
	presets
};

export const flows: Record<string, BaseFlow> = {
	[authorizationCodeBase.id]: authorizationCodeBase
};
