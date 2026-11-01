import type { FlowDef } from '#lib/flow/model.ts';
import { any, is, not } from '#lib/flow/settings.ts';

const oidc = is('oidc', true);
const confidential = is('clientType', 'confidential');
const broker = is('broker', true);
const storedTokens = any(is('upstreamTokens', 'v1'), is('upstreamTokens', 'v2'));
const apiV1 = is('upstreamTokens', 'v1');
const apiV2 = is('upstreamTokens', 'v2');

/**
 * What happens before any user arrives. It has a diagram of its own, because no user does this: the
 * people on it do. Each person sits next to the system they look after.
 */
export const authorizationCodeSetup: FlowDef = {
	id: 'authorization-code-setup',
	title: 'Setting up the authorization code flow',
	summary:
		'What people do before any user arrives, so the app and the identity provider know each other.',
	intro:
		'Before anyone can log in, two things have to happen. The identity provider has to learn about the app: what it is called, whether it can keep a secret, and where users may be sent back to. And the app has to learn about the identity provider: its address, where to send people, and how to check its tokens.',
	specs: ['rfc6749'],
	lifelines: [
		{
			id: 'app-team',
			plainName: 'App team',
			plainRole: 'People',
			name: 'App team',
			role: 'People',
			icon: 'people',
			concept: 'The people who build and run the app. They know where it runs.'
		},
		{
			id: 'app',
			plainName: 'App',
			plainRole: 'The one being set up',
			name: 'App',
			role: [{ when: oidc, text: 'Relying party' }, { text: 'OAuth client' }],
			icon: 'app',
			concept:
				'The application being set up. It has to learn about the identity provider before anyone logs in.'
		},
		{
			id: 'idp',
			plainName: 'Identity provider',
			plainRole: 'Will log users in',
			name: 'IdP',
			role: [
				{ when: broker, text: 'Broker' },
				{ when: oidc, text: 'OpenID provider' },
				{ text: 'Authorization server' }
			],
			icon: 'idp',
			concept: 'The identity provider. It has to know about the app, and the issuer names it.'
		},
		{
			id: 'idp-admin',
			plainName: 'Admin',
			plainRole: 'People',
			name: 'IdP admin',
			role: 'People',
			icon: 'people',
			concept: 'The people who run the identity provider. They register apps in its admin console.'
		},
		{
			id: 'upstream',
			plainName: 'Other provider',
			plainRole: 'Will do the login',
			name: 'Upstream IdP',
			role: 'External provider',
			icon: 'upstream',
			concept: 'Another identity provider, which the identity provider will trust to log users in.',
			when: broker
		}
	],
	groups: [],
	steps: [
		{
			id: 'register-client',
			from: 'app-team',
			to: 'idp-admin',
			kind: 'human',
			plain: 'Ask to register the app',
			label: 'Ask to register the app',
			concept:
				"The app team gives an admin the app's redirect URIs and client type. People do this, so there is no HTTP message.",
			links: [{ diagram: 'flow', step: 'authorize', text: 'See where this address gets checked' }],
			fields: [
				{ name: 'redirect_uris', place: 'setting', note: 'Checked again during every login' },
				{ name: 'client type', place: 'setting' }
			]
		},
		{
			id: 'create-client',
			from: 'idp-admin',
			to: 'idp',
			kind: 'human',
			plain: 'Create the client',
			label: 'Create the client',
			concept:
				'The admin enters those values in the admin console. From here on, the identity provider knows this app.',
			fields: [
				{ name: 'client_id', place: 'setting' },
				{ name: 'client_secret', place: 'setting', artifact: 'secret', when: confidential }
			]
		},
		{
			id: 'hand-over-credentials',
			from: 'idp-admin',
			to: 'app-team',
			kind: 'human',
			plain: [
				{ when: confidential, text: 'Hand over the client ID and secret' },
				{ text: 'Hand over the client ID' }
			],
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
				{ name: 'client_secret', place: 'setting', artifact: 'secret', when: confidential }
			]
		},
		{
			id: 'register-with-upstream',
			from: 'idp-admin',
			to: 'upstream',
			kind: 'human',
			plain: 'Register with the other provider',
			label: 'Register the IdP as a client',
			concept:
				'The identity provider is itself a client of the other provider, so it has to be registered there the same way.',
			when: broker,
			fields: [
				{
					name: 'redirect_uris',
					place: 'setting',
					note: "The identity provider's broker endpoint"
				},
				{ name: 'client_id', place: 'setting' },
				{ name: 'client_secret', place: 'setting' }
			]
		},
		{
			id: 'enable-token-storage',
			from: 'idp-admin',
			to: 'idp',
			kind: 'human',
			plain: 'Allow keeping its tokens',
			label: 'Allow token storage',
			concept: [
				{
					when: apiV2,
					text: 'An admin turns on token storage for the other provider, and allows this client to retrieve the tokens.'
				},
				{
					text: 'An admin turns on token storage for the other provider, and gives the user a role to read them.'
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
			id: 'configure-app',
			from: 'app-team',
			to: 'app',
			kind: 'human',
			plain: 'Configure the app',
			label: 'Configure the app',
			concept: [
				{
					when: confidential,
					text: 'The team gives the app the issuer URL, the client ID and the secret.'
				},
				{ text: 'The team gives the app the issuer URL and the client ID.' }
			],
			fields: [
				{ name: 'issuer', place: 'setting' },
				{ name: 'client_id', place: 'setting' },
				{ name: 'client_secret', place: 'setting', artifact: 'secret', when: confidential }
			]
		},
		{
			id: 'discover',
			from: 'app',
			to: 'idp',
			kind: 'request',
			plain: "The app looks up the provider's addresses",
			label: 'GET /.well-known/…',
			execute: { answer: 'discovery-document' },
			concept:
				'The app starts from the issuer URL and asks the identity provider where everything else is.',
			fields: [
				{ name: '/.well-known/openid-configuration', place: 'path', when: oidc },
				{ name: '/.well-known/oauth-authorization-server', place: 'path', when: not(oidc) }
			]
		},
		{
			id: 'discovery-document',
			from: 'idp',
			to: 'app',
			kind: 'response',
			plain: 'Where everything is',
			label: 'Endpoints',
			concept:
				"The identity provider's endpoints, and where to find the keys that verify its tokens.",
			links: [
				{
					diagram: 'flow',
					step: 'open-app',
					text: 'Setup is done. See what happens when a user arrives'
				}
			],
			fields: [
				{ name: 'issuer', place: 'body' },
				{ name: 'authorization_endpoint', place: 'body' },
				{ name: 'token_endpoint', place: 'body' },
				{ name: 'jwks_uri', place: 'body' },
				{ name: 'userinfo_endpoint', place: 'body', when: oidc }
			]
		}
	]
};
