import type { FlowDef } from '#lib/flow/model.ts';
import { all, any, is, not } from '#lib/flow/settings.ts';

const oidc = is('oidc', true);
const confidential = is('clientType', 'confidential');
const dpop = is('binding', 'dpop');
const bearer = is('binding', 'bearer');
const nonce = is('dpopNonce', true);
const broker = is('broker', true);
const storedTokens = any(is('upstreamTokens', 'v1'), is('upstreamTokens', 'v2'));
const apiV1 = is('upstreamTokens', 'v1');
const apiV2 = is('upstreamTokens', 'v2');

/**
 * Prototype content for step 0. Message shapes come from the specs named on each setting, and only
 * the OpenID Connect toggle has been run against a real Keycloak (docs/research/followup-checks.md).
 */
export const authorizationCode: FlowDef = {
	id: 'authorization-code',
	title: 'Authorization code flow',
	summary: 'An app gets access on behalf of a user, without ever seeing their password.',
	phases: [
		{ id: 'setup', label: 'Setup, before any user arrives' },
		{ id: 'login', label: 'Login' },
		{ id: 'use', label: 'Using the tokens' }
	],
	lifelines: [
		{
			id: 'browser',
			name: 'Browser',
			role: "The user's",
			concept:
				'Where the user is. Messages through the browser can be seen and changed by the user or by software in the browser.'
		},
		{
			id: 'app',
			name: 'App',
			role: [{ when: oidc, text: 'Relying party' }, { text: 'OAuth client' }],
			concept: "The application the user wants to use. It never sees the user's password."
		},
		{
			id: 'idp',
			name: 'IdP',
			role: [
				{ when: broker, text: 'Broker' },
				{ when: oidc, text: 'OpenID provider' },
				{ text: 'Authorization server' }
			],
			concept:
				'The identity provider. It logs the user in and issues tokens, and the issuer names it.'
		},
		{
			id: 'upstream',
			name: 'Upstream IdP',
			role: 'External provider',
			concept: 'Another identity provider, which the IdP trusts to log the user in.',
			when: broker
		},
		{
			id: 'api',
			name: 'API',
			role: 'Resource server',
			concept: 'What the app wants to call on behalf of the user. It accepts or rejects the token.'
		}
	],
	groups: [
		{ id: 'brokered-login', label: 'Brokered login: here the IdP is the client', when: broker },
		{ id: 'nonce-retry', label: 'Nonce retry', when: nonce }
	],
	steps: [
		{
			id: 'register-client',
			phase: 'setup',
			from: 'app',
			to: 'idp',
			kind: 'human',
			label: 'Register the app',
			concept:
				"The app team gives an IdP admin the app's redirect URIs and client type. People do this in a console, so there is no HTTP message.",
			fields: [
				{ name: 'redirect_uris', place: 'setting', note: 'Checked again during every login' },
				{ name: 'client type', place: 'setting' }
			]
		},
		{
			id: 'hand-over-credentials',
			phase: 'setup',
			from: 'idp',
			to: 'app',
			kind: 'human',
			label: [
				{ when: confidential, text: 'Hand over client ID and secret' },
				{ text: 'Hand over client ID' }
			],
			concept: [
				{
					when: confidential,
					text: 'The admin passes the client ID and secret back to the app team.'
				},
				{ text: 'The admin passes the client ID back. A public client has no secret to keep.' }
			],
			fields: [
				{ name: 'client_id', place: 'setting' },
				{ name: 'client_secret', place: 'setting', when: confidential }
			]
		},
		{
			id: 'register-with-upstream',
			phase: 'setup',
			from: 'idp',
			to: 'upstream',
			kind: 'human',
			label: 'Register the IdP as a client',
			concept:
				'The IdP is itself a client of the upstream IdP, so it has to be registered there the same way.',
			when: broker,
			fields: [
				{ name: 'redirect_uris', place: 'setting', note: "The IdP's broker endpoint" },
				{ name: 'client_id', place: 'setting' },
				{ name: 'client_secret', place: 'setting' }
			]
		},
		{
			id: 'enable-token-storage',
			phase: 'setup',
			from: 'idp',
			to: 'idp',
			kind: 'human',
			label: 'Allow token storage',
			concept: [
				{
					when: apiV2,
					text: 'An admin turns on token storage for the upstream IdP, and allows this client to retrieve the tokens.'
				},
				{
					text: 'An admin turns on token storage for the upstream IdP, and gives the user a role to read them.'
				}
			],
			when: storedTokens,
			fields: [
				{ name: 'Store Tokens', place: 'setting' },
				{ name: 'read-token role', place: 'setting', when: apiV1 },
				{ name: 'Allow retrieve external tokens', place: 'setting', when: apiV2 }
			]
		},
		{
			id: 'discover',
			phase: 'setup',
			from: 'app',
			to: 'idp',
			kind: 'request',
			label: 'GET /.well-known/…',
			concept: 'The app starts from the issuer URL and asks the IdP where everything else is.',
			fields: [
				{ name: '/.well-known/openid-configuration', place: 'path', when: oidc },
				{ name: '/.well-known/oauth-authorization-server', place: 'path', when: not(oidc) }
			]
		},
		{
			id: 'discovery-document',
			phase: 'setup',
			from: 'idp',
			to: 'app',
			kind: 'response',
			label: 'Endpoints and keys',
			concept: "The IdP's endpoints, and where to find the keys that verify its tokens.",
			fields: [
				{ name: 'issuer', place: 'body' },
				{ name: 'authorization_endpoint', place: 'body' },
				{ name: 'token_endpoint', place: 'body' },
				{ name: 'jwks_uri', place: 'body' },
				{ name: 'userinfo_endpoint', place: 'body', when: oidc }
			]
		},
		{
			id: 'open-app',
			phase: 'login',
			from: 'browser',
			to: 'app',
			kind: 'request',
			label: 'Open the app',
			concept: 'The user wants something from the app, and the app needs them logged in first.'
		},
		{
			id: 'generate-key',
			phase: 'login',
			from: 'app',
			to: 'app',
			kind: 'internal',
			label: 'Generate a key pair',
			concept:
				'DPoP ties tokens to a key only this app holds, so a stolen token is useless without the key.',
			when: dpop
		},
		{
			id: 'redirect-to-idp',
			phase: 'login',
			from: 'app',
			to: 'browser',
			kind: 'response',
			label: '302 to the IdP',
			concept:
				'The app sends the browser to the IdP, because the password must never reach the app.'
		},
		{
			id: 'authorize',
			phase: 'login',
			from: 'browser',
			to: 'idp',
			kind: 'request',
			label: 'GET /authorize',
			concept: [
				{
					when: oidc,
					text: 'The browser asks the IdP to log the user in. The openid scope asks for proof of who that was as well.'
				},
				{ text: 'The browser asks the IdP to log the user in and grant the app access.' }
			],
			fields: [
				{ name: 'response_type=code', place: 'query' },
				{ name: 'client_id', place: 'query' },
				{ name: 'redirect_uri', place: 'query', note: 'Must match what was registered in setup' },
				{ name: 'state', place: 'query' },
				{ name: 'scope=openid', place: 'query', when: oidc },
				{ name: 'nonce', place: 'query', when: oidc },
				{
					name: 'dpop_jkt',
					place: 'query',
					note: 'Optional: ties the code to the key',
					when: dpop
				}
			]
		},
		{
			id: 'login-page',
			phase: 'login',
			from: 'idp',
			to: 'browser',
			kind: 'response',
			label: 'Login page',
			concept: 'The IdP asks the user to prove who they are, on its own page.',
			when: not(broker)
		},
		{
			id: 'submit-credentials',
			phase: 'login',
			from: 'browser',
			to: 'idp',
			kind: 'request',
			label: 'Submit credentials',
			concept: 'The user signs in at the IdP. The app sees none of this.',
			when: not(broker)
		},
		{
			id: 'redirect-to-upstream',
			phase: 'login',
			group: 'brokered-login',
			from: 'idp',
			to: 'browser',
			kind: 'response',
			label: '302 to the upstream IdP',
			concept:
				'The IdP does not log the user in itself. It sends the browser on to the upstream IdP.',
			when: broker
		},
		{
			id: 'upstream-authorize',
			phase: 'login',
			group: 'brokered-login',
			from: 'browser',
			to: 'upstream',
			kind: 'request',
			label: 'GET /authorize',
			concept: 'The same request the app made, but now the IdP is the client asking for a login.',
			when: broker,
			fields: [
				{ name: 'client_id', place: 'query', note: "The IdP's own client ID at the upstream" },
				{ name: 'redirect_uri', place: 'query', note: "The IdP's broker endpoint" },
				{ name: 'state', place: 'query' }
			]
		},
		{
			id: 'upstream-sign-in',
			phase: 'login',
			group: 'brokered-login',
			from: 'browser',
			to: 'upstream',
			kind: 'request',
			label: 'Sign in',
			concept:
				'The user signs in at the upstream IdP. Neither the app nor the IdP sees the password.',
			when: broker
		},
		{
			id: 'upstream-redirect-back',
			phase: 'login',
			group: 'brokered-login',
			from: 'upstream',
			to: 'browser',
			kind: 'response',
			label: '302 back with a code',
			concept: 'The upstream IdP sends the browser back to the IdP with a one-time code.',
			when: broker
		},
		{
			id: 'upstream-callback',
			phase: 'login',
			group: 'brokered-login',
			from: 'browser',
			to: 'idp',
			kind: 'request',
			label: 'Deliver the code',
			concept: "The browser delivers the code to the IdP's broker endpoint.",
			when: broker
		},
		{
			id: 'upstream-token-request',
			phase: 'login',
			group: 'brokered-login',
			from: 'idp',
			to: 'upstream',
			kind: 'request',
			label: 'POST /token',
			concept: 'The IdP trades the code for tokens, on a connection the browser never sees.',
			when: broker,
			fields: [
				{ name: 'grant_type=authorization_code', place: 'body' },
				{ name: 'code', place: 'body' },
				{ name: 'client_id', place: 'body' },
				{ name: 'client_secret', place: 'body' }
			]
		},
		{
			id: 'upstream-token-response',
			phase: 'login',
			group: 'brokered-login',
			from: 'upstream',
			to: 'idp',
			kind: 'response',
			label: 'Upstream tokens',
			concept: 'These tokens belong to the IdP. The app will get tokens the IdP issues itself.',
			when: broker,
			fields: [
				{ name: 'access_token', place: 'body' },
				{ name: 'id_token', place: 'body' }
			]
		},
		{
			id: 'store-upstream-tokens',
			phase: 'login',
			group: 'brokered-login',
			from: 'idp',
			to: 'idp',
			kind: 'internal',
			label: 'Store upstream tokens',
			concept: [
				{
					when: apiV2,
					text: 'The IdP keeps the upstream tokens, in the user session or the database.'
				},
				{ text: 'The IdP keeps the upstream tokens in its database, per user and upstream IdP.' }
			],
			when: storedTokens
		},
		{
			id: 'match-user',
			phase: 'login',
			group: 'brokered-login',
			from: 'idp',
			to: 'idp',
			kind: 'internal',
			label: 'Match or create the user',
			concept: 'The IdP links the external identity to a local user, creating one if needed.',
			when: broker
		},
		{
			id: 'redirect-with-code',
			phase: 'login',
			from: 'idp',
			to: 'browser',
			kind: 'response',
			label: '302 back with a code',
			concept:
				'The IdP sends the browser back to the redirect URI with a short-lived, one-time code.',
			fields: [
				{ name: 'code', place: 'query' },
				{ name: 'state', place: 'query' }
			]
		},
		{
			id: 'callback',
			phase: 'login',
			from: 'browser',
			to: 'app',
			kind: 'request',
			label: 'Deliver the code',
			concept: 'The code reaches the app. On its own it is worth little, which is the point.',
			fields: [
				{ name: 'code', place: 'query' },
				{ name: 'state', place: 'query', note: 'Must match what the app sent' }
			]
		},
		{
			id: 'token-request',
			phase: 'login',
			from: 'app',
			to: 'idp',
			kind: 'request',
			label: 'POST /token',
			concept: 'The app trades the code for tokens, on a direct connection the browser never sees.',
			fields: [
				{ name: 'grant_type=authorization_code', place: 'body' },
				{ name: 'code', place: 'body' },
				{ name: 'redirect_uri', place: 'body' },
				{ name: 'client_id', place: 'body' },
				{ name: 'client_secret', place: 'body', when: confidential },
				{ name: 'DPoP', place: 'header', note: 'A proof signed with the key', when: dpop }
			]
		},
		{
			id: 'nonce-challenge',
			phase: 'login',
			group: 'nonce-retry',
			from: 'idp',
			to: 'app',
			kind: 'response',
			label: '400 use_dpop_nonce',
			concept: 'The server rejects the proof and hands the app a nonce to sign into the next one.',
			when: all(dpop, nonce),
			fields: [
				{ name: 'error=use_dpop_nonce', place: 'body' },
				{ name: 'DPoP-Nonce', place: 'header' }
			]
		},
		{
			id: 'token-request-retry',
			phase: 'login',
			group: 'nonce-retry',
			from: 'app',
			to: 'idp',
			kind: 'request',
			label: 'POST /token',
			concept: 'The same request again, with a new proof that includes the nonce.',
			when: all(dpop, nonce),
			fields: [{ name: 'DPoP', place: 'header', note: 'A proof with the nonce' }]
		},
		{
			id: 'token-response',
			phase: 'login',
			from: 'idp',
			to: 'app',
			kind: 'response',
			label: [{ when: oidc, text: 'Access token and ID token' }, { text: 'Access token' }],
			concept: [
				{
					when: oidc,
					text: 'The access token is for the API, and the ID token tells the app who logged in.'
				},
				{ text: 'The access token lets the app call the API. It is meant for the API to read.' }
			],
			fields: [
				{ name: 'access_token', place: 'body' },
				{ name: 'token_type=Bearer', place: 'body', when: bearer },
				{ name: 'token_type=DPoP', place: 'body', when: dpop },
				{ name: 'id_token', place: 'body', when: oidc }
			]
		},
		{
			id: 'validate-id-token',
			phase: 'login',
			from: 'app',
			to: 'app',
			kind: 'internal',
			label: 'Validate the ID token',
			concept:
				'The app checks signature, issuer, audience, expiry and nonce before it trusts the token.',
			when: oidc,
			fields: [
				{ name: 'iss', place: 'token' },
				{ name: 'aud', place: 'token' },
				{ name: 'exp', place: 'token' },
				{ name: 'nonce', place: 'token' }
			]
		},
		{
			id: 'userinfo-request',
			phase: 'login',
			from: 'app',
			to: 'idp',
			kind: 'request',
			label: 'GET /userinfo',
			concept: 'The app can ask for more about the user, using the access token.',
			when: oidc,
			fields: [
				{ name: 'Authorization: Bearer', place: 'header', when: bearer },
				{ name: 'Authorization: DPoP', place: 'header', when: dpop },
				{ name: 'DPoP', place: 'header', note: 'A proof tied to this access token', when: dpop }
			]
		},
		{
			id: 'userinfo-response',
			phase: 'login',
			from: 'idp',
			to: 'app',
			kind: 'response',
			label: 'User claims',
			concept: 'Who the user is, limited to what the requested scopes allow.',
			when: oidc,
			fields: [{ name: 'sub', place: 'body' }]
		},
		{
			id: 'api-request',
			phase: 'use',
			from: 'app',
			to: 'api',
			kind: 'request',
			label: 'GET /resource',
			concept: [
				{
					when: dpop,
					text: 'The app sends the token and a new proof, which shows it holds the key the token is tied to.'
				},
				{ text: 'The app sends the access token. Whoever holds a bearer token can use it.' }
			],
			fields: [
				{ name: 'Authorization: Bearer', place: 'header', when: bearer },
				{ name: 'Authorization: DPoP', place: 'header', when: dpop },
				{ name: 'DPoP', place: 'header', note: 'A proof tied to this access token', when: dpop }
			]
		},
		{
			id: 'api-check-token',
			phase: 'use',
			from: 'api',
			to: 'api',
			kind: 'internal',
			label: 'Check the token',
			concept: [
				{
					when: dpop,
					text: 'The API checks the token, and that the proof was signed with the key the token names.'
				},
				{ text: 'The API checks that the token is valid, for this API, and not expired.' }
			],
			fields: [
				{ name: 'aud', place: 'token' },
				{ name: 'exp', place: 'token' },
				{ name: 'cnf.jkt', place: 'token', note: 'The key the token is tied to', when: dpop }
			]
		},
		{
			id: 'api-response',
			phase: 'use',
			from: 'api',
			to: 'app',
			kind: 'response',
			label: '200 with the resource',
			concept: 'The app has what it came for, and the user never gave it their password.'
		},
		{
			id: 'retrieve-upstream-token',
			phase: 'use',
			from: 'app',
			to: 'idp',
			kind: 'request',
			label: [
				{ when: apiV2, text: 'POST /broker/{alias}/token' },
				{ text: 'GET /broker/{alias}/token' }
			],
			concept: [
				{
					when: apiV2,
					text: "The app asks for the stored upstream token, and authenticates as a client. The client's settings allow it."
				},
				{
					text: "The app asks for the stored upstream token with the user's access token. A role on the user allows it."
				}
			],
			when: storedTokens,
			fields: [
				{ name: 'Authorization: Bearer', place: 'header', when: apiV1 },
				{ name: 'client_id', place: 'body', when: apiV2 },
				{ name: 'client_secret', place: 'body', when: apiV2 },
				{ name: 'token', place: 'body', note: "The user's access token", when: apiV2 }
			]
		},
		{
			id: 'upstream-token',
			phase: 'use',
			from: 'idp',
			to: 'app',
			kind: 'response',
			label: 'Upstream access token',
			concept: 'The token the upstream IdP issued, handed over by the IdP.',
			when: storedTokens,
			fields: [{ name: 'access_token', place: 'body' }]
		},
		{
			id: 'call-upstream',
			phase: 'use',
			from: 'app',
			to: 'upstream',
			kind: 'request',
			label: "Call the upstream's API",
			concept: "With that token, the app can call the upstream provider's APIs directly.",
			when: storedTokens,
			fields: [{ name: 'Authorization: Bearer', place: 'header' }]
		}
	]
};
