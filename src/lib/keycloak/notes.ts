import { resolveText, type Text } from '#lib/flow/model.ts';
import {
	all,
	any,
	holds,
	is,
	not,
	type Condition,
	type KeycloakFlag,
	type Settings
} from '#lib/flow/settings.ts';

/**
 * Which Keycloak setting controls what a step shows. This is the only place the protocol diagrams
 * get anything about one product, so someone on another identity provider can leave it out
 * (ADR-015). Each note is held to something a real server did, by src/lib/keycloak/notes.test.ts.
 */

const confidential = is('clientType', 'confidential');
const pkce = is('pkce', true);
const dpop = is('binding', 'dpop');
const apiV1 = is('upstreamTokens', 'v1');
const apiV2 = is('upstreamTokens', 'v2');

const FLAG_V2 = 'identity-brokering-api:v2';

/** A page of the admin console, which the recorder knows how to open. */
export type ConsolePage =
	| 'client-settings'
	| 'client-advanced'
	| 'client-scopes'
	| 'client-dedicated-scope'
	| 'provider-settings'
	| 'realm-settings'
	| 'browser-flow';

export interface ConsolePlace {
	/** What someone clicks through, in the words of the console. */
	path: readonly string[];
	page: ConsolePage;
	/** Something on the page to press first, for what only shows after that. */
	opens?: string;
	/** Words the recorder looks for on that page of a real server. */
	shows: readonly string[];
	/** A flag the server has to run with before the console shows this at all. */
	needsFlag?: string;
}

export interface NoteDef {
	id: string;
	steps: readonly string[];
	title: string;
	text: Text;
	when?: Condition;
	place?: ConsolePlace;
	/** A setting that is not in the console, because the server starts with it. */
	serverOption?: string;
	flag?: KeycloakFlag;
	/** The answer in questions.json that proves this, and what it has to show. */
	backedBy: { question: string; shows: Readonly<Record<string, unknown>> };
	/** What was done to find this out, when it was more than changing one setting. */
	seen?: string;
}

export interface Note {
	id: string;
	title: string;
	text: string;
	path?: readonly string[];
	serverOption?: string;
	flag?: KeycloakFlag;
	/** How this was found out, up to the name of the server. */
	evidence: string;
}

const CHANGED_IT = 'Changed this, and the answer changed, on';
const YOUR_CLIENT = 'your client';
const clientSettings = (section: string, label: string, needsFlag?: string): ConsolePlace => ({
	path: ['Clients', YOUR_CLIENT, 'Settings', section, label],
	page: 'client-settings',
	shows: [section, label],
	needsFlag
});
const providerSettings = (label: string): ConsolePlace => ({
	path: ['Identity providers', 'the provider', 'Settings', 'Advanced settings', label],
	page: 'provider-settings',
	shows: ['Advanced settings', label]
});

const requirePkcePlace = clientSettings('Capability config', 'Require PKCE');

export const noteDefs: readonly NoteDef[] = [
	{
		id: 'valid-redirect-uris',
		steps: ['authorize', 'create-client'],
		title: 'Valid redirect URIs',
		text: 'The addresses this client may send users back to. Anything else gets a 400, and the page says: Invalid parameter: redirect_uri.',
		place: clientSettings('Access settings', 'Valid redirect URIs'),
		backedBy: {
			question: 'validRedirectUris',
			shows: { before: { status: 400 }, after: { status: 200 } }
		}
	},
	{
		id: 'consent-required',
		steps: ['consent-page', 'submit-credentials'],
		title: 'Consent required',
		text: [
			{
				when: is('consent', true),
				text: "On for this client. What the page lists are the client's scopes, by their display names. Once someone agrees, they are not asked again."
			},
			{
				text: 'Off on a new client, which is why most logins through Keycloak never ask the user anything. Turn it on to get the question.'
			}
		],
		place: clientSettings('Login settings', 'Consent required'),
		backedBy: {
			question: 'consentRequired',
			shows: {
				before: { asked: false },
				after: { asked: true, secondLoginAsked: false, whenDeclined: 'access_denied' }
			}
		}
	},
	{
		id: 'client-authentication',
		steps: ['token-request', 'create-client'],
		title: 'Client authentication',
		text: [
			{
				when: confidential,
				text: 'On, which makes this a confidential client. Turn it off and this request needs no secret.'
			},
			{
				text: 'Off, which makes this a public client. Turn it on and this request gets a 401 without a secret, with the error unauthorized_client, where RFC 6749 says invalid_client.'
			}
		],
		place: clientSettings('Capability config', 'Client authentication'),
		backedBy: {
			question: 'clientAuthentication',
			shows: { before: { status: 401 }, after: { status: 200 } }
		}
	},
	{
		id: 'require-pkce',
		steps: ['authorize'],
		title: 'Require PKCE',
		text: [
			{
				when: pkce,
				text: 'Not what makes this work: any client that sends a challenge gets PKCE. Turn it on to refuse a login that has none.'
			},
			{
				text: 'Off by default, so a login with no challenge goes through. Turn it on, and the app gets an error back at its redirect URI instead of a code.'
			}
		],
		place: requirePkcePlace,
		backedBy: {
			question: 'requirePkce',
			shows: { before: { gotCode: true }, after: { gotCode: false } }
		}
	},
	{
		id: 'intercepted-code',
		steps: ['token-request', 'attacker-token-response'],
		title: 'Require PKCE',
		text: [
			{
				when: all(pkce, not(confidential)),
				text: 'Someone with only the code gets a 400 invalid_grant: PKCE code verifier not specified. That try also uses up the code, so the real app has to start the login again. That is how Keycloak does it, and the specs do not ask for it.'
			},
			{
				when: pkce,
				text: 'Without the secret, this gets a 401 before PKCE comes into it, with the error unauthorized_client, where RFC 6749 says invalid_client. The code itself is still good, so the real app carries on.'
			},
			{
				when: confidential,
				text: 'Without the secret, this gets a 401, with the error unauthorized_client, where RFC 6749 says invalid_client. The code itself is still good, and PKCE is not insisted on unless this is turned on.'
			},
			{
				text: 'Off by default, so a public client with no PKCE gets its tokens, and so does anyone else who has the code. The real app then finds the code already used. Turn it on to refuse a login without PKCE.'
			}
		],
		place: requirePkcePlace,
		backedBy: {
			question: 'interceptedCode',
			shows: {
				publicWithoutPkce: { status: 200, gotTokens: true },
				publicWithPkceNoVerifier: {
					status: 400,
					description: 'PKCE code verifier not specified',
					theRealAppAfterwards: { status: 400, description: 'Code not valid' }
				},
				confidentialNoPkceNoSecret: { status: 401, theRealAppAfterwards: { status: 200 } }
			}
		},
		seen: 'Tried with each kind of client, with and without PKCE, on'
	},
	{
		id: 'client-scopes',
		steps: ['token-response'],
		title: 'Client scopes',
		text: "What the access token says about the user comes from the client's default client scopes, whether or not the app asked for openid. A new client has profile and email among them, so its token already holds a name and an email address. Take those two off and they are gone.",
		place: {
			path: ['Clients', YOUR_CLIENT, 'Client scopes'],
			page: 'client-scopes',
			shows: ['profile', 'email']
		},
		backedBy: {
			question: 'clientScopes',
			shows: {
				before: { hasName: true, hasEmail: true },
				after: { hasName: false, hasEmail: false }
			}
		}
	},
	{
		id: 'token-lifespan',
		steps: ['token-response'],
		title: 'Access Token Lifespan',
		text: 'Sets expires_in for this client. Left empty, it comes from the realm, which is five minutes on a new one.',
		place: {
			path: ['Clients', YOUR_CLIENT, 'Advanced', 'Advanced settings', 'Access Token Lifespan'],
			page: 'client-advanced',
			shows: ['Advanced settings', 'Access Token Lifespan']
		},
		backedBy: {
			question: 'tokenLifespan',
			shows: { before: { expiresIn: 300 }, after: { expiresIn: 60 } }
		}
	},
	{
		id: 'audience',
		steps: ['api-check-token'],
		title: 'Audience mapper',
		text: "A default client's access token names account as its audience, not your API, so an API that checks the audience refuses it. Add an Audience mapper to the client's dedicated scope to name your API.",
		place: {
			path: [
				'Clients',
				YOUR_CLIENT,
				'Client scopes',
				'your client-dedicated',
				'Configure a new mapper',
				'Audience'
			],
			page: 'client-dedicated-scope',
			opens: 'Configure a new mapper',
			shows: ['Audience']
		},
		backedBy: {
			question: 'audience',
			shows: {
				before: { aud: 'account', namesTheApi: false },
				after: { namesTheApi: true }
			}
		}
	},
	{
		id: 'require-dpop',
		steps: ['token-request'],
		title: 'Require DPoP bound tokens',
		text: 'Off by default, and a client that sends a proof still gets a bound token. Turn it on and a request with no proof is refused.',
		when: dpop,
		place: clientSettings('Capability config', 'Require DPoP bound tokens'),
		flag: { name: 'dpop' },
		backedBy: {
			question: 'requireDpop',
			shows: { before: { status: 200, tokenType: 'Bearer' }, after: { status: 400 } }
		}
	},
	{
		id: 'no-dpop-nonce',
		steps: ['nonce-challenge'],
		title: 'Not something it did',
		text: 'Keycloak did not ask for a nonce when this was recorded: a proof with none got a 200 and a bound token.',
		backedBy: { question: 'dpopNonce', shows: { tokenStatus: 200, askedForNonce: false } },
		seen: 'Seen on'
	},
	{
		id: 'issuer',
		steps: ['configure-app', 'discover'],
		title: 'Endpoints',
		text: "The issuer is the server's address, then /realms/ and the name of the realm, so each realm is an identity provider of its own. This page links to its discovery document.",
		place: {
			path: ['Realm settings', 'General', 'Endpoints'],
			page: 'realm-settings',
			shows: ['Endpoints']
		},
		backedBy: {
			question: 'issuerPerRealm',
			shows: { realmsDiffer: true, endsWithRealm: true }
		},
		seen: 'Compared two realms on'
	},
	{
		id: 'broker-redirector',
		steps: ['redirect-to-upstream'],
		title: 'Identity Provider Redirector',
		text: 'Going straight to the other provider takes a default provider on this step of the browser flow. Without one, Keycloak shows its own login page, with a button for the other provider.',
		when: is('broker', true),
		place: {
			path: ['Authentication', 'browser', 'Identity Provider Redirector'],
			page: 'browser-flow',
			opens: 'browser',
			shows: ['Identity Provider Redirector']
		},
		backedBy: {
			question: 'brokerRedirector',
			shows: { before: { redirects: true }, after: { redirects: false } }
		}
	},
	{
		id: 'store-tokens',
		steps: ['store-upstream-tokens', 'enable-token-storage'],
		title: 'Store tokens',
		text: 'Off by default, and then there is nothing for the app to ask for.',
		when: any(apiV1, apiV2),
		place: providerSettings('Store tokens'),
		backedBy: {
			question: 'storeTokens',
			shows: { before: { status: 200 }, after: { status: 400 } }
		}
	},
	{
		id: 'stored-tokens-readable',
		steps: ['retrieve-upstream-token', 'enable-token-storage'],
		title: 'Stored tokens readable',
		text: 'Gives each new user the role that lets their access token read the stored tokens. Without it, this request gets a 403. Users that already exist do not get it from this setting.',
		when: apiV1,
		place: providerSettings('Stored tokens readable'),
		flag: { name: 'identity-brokering-api:v1' },
		backedBy: {
			question: 'storedTokensReadable',
			shows: { before: { status: 200 }, after: { status: 403 } }
		}
	},
	{
		id: 'allow-external-tokens',
		steps: ['retrieve-upstream-token', 'enable-token-storage'],
		title: 'Allow retrieve external tokens',
		text: 'Lets this client ask for stored tokens, from the providers named in Allowed Identity Providers for External Tokens. The console only shows it on a server with API V2 on.',
		when: apiV2,
		place: clientSettings('Capability config', 'Allow retrieve external tokens', FLAG_V2),
		flag: { name: FLAG_V2 },
		backedBy: {
			question: 'allowExternalTokens',
			shows: { before: { status: 200 }, after: { status: 403 } }
		}
	},
	{
		id: 'brokering-api-flags',
		steps: ['retrieve-upstream-token'],
		title: 'A server option',
		text: [
			{
				when: apiV2,
				text: 'API V2 needs the server started with this flag, and that turns API V1 off, which the docs do not say. Set it where the server starts. It is not in the admin console.'
			},
			{
				text: 'API V1 is on unless the server is started with the V2 flag, and that turns it off, which the docs do not say. Set it where the server starts. It is not in the admin console.'
			}
		],
		when: any(apiV1, apiV2),
		serverOption: `--features=${FLAG_V2}`,
		backedBy: {
			question: 'apiV1WhenV2IsEnabled',
			shows: { status: 400 }
		},
		seen: 'Tried with and without the flag on'
	}
];

/** The notes on a step, in these settings. */
export function notesFor(step: string, settings: Settings): Note[] {
	return noteDefs
		.filter((def) => def.steps.includes(step) && (!def.when || holds(def.when, settings)))
		.map((def) => ({
			id: def.id,
			title: def.title,
			text: resolveText(def.text, settings),
			path: def.place?.path,
			serverOption: def.serverOption,
			flag: def.flag,
			evidence: def.seen ?? CHANGED_IT
		}));
}
