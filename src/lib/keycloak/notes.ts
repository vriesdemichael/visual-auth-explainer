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
	/** What in an access token this setting controls. */
	claims?: readonly string[];
	/** How to say that, when it does not simply come from this setting. */
	claimsVerb?: string;
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
	claims: readonly string[];
	claimsVerb?: string;
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
		text: 'The addresses this client may send users back to. Anything else gets a 400, and the page says: Invalid parameter: redirect_uri. It does take a * at the end of an address, which then lets any page on that site get the code, and * alone takes any site at all. An exact match closes both.',
		place: clientSettings('Access settings', 'Valid redirect URIs'),
		backedBy: {
			question: 'validRedirectUris',
			shows: {
				before: { status: 400 },
				after: { status: 200 },
				wildcard: { atTheEnd: { sameSite: 200, otherSite: 400 }, alone: { otherSite: 200 } }
			}
		}
	},
	{
		id: 'consent-required',
		steps: ['consent-page', 'submit-credentials'],
		title: 'Consent required',
		text: [
			{
				when: is('consent', true),
				text: "On for this client. What the page lists are the client's scopes, by their display names. Once someone agrees they are not asked again, on a client with a secret or without one, until the app asks for a scope they have not agreed to, and then only about that scope."
			},
			{
				text: 'Off on a new client, which is why most logins through Keycloak never ask the user anything. Turn it on to get the question.'
			}
		],
		place: clientSettings('Login settings', 'Consent required'),
		backedBy: {
			question: 'consentRequired',
			shows: {
				before: { asked: false, audience: 'account', hasRoles: true },
				after: {
					asked: true,
					secondLoginAsked: false,
					whenDeclined: 'access_denied',
					audience: 'account',
					hasRoles: true
				},
				onAPublicClient: {
					first: { asked: true },
					second: { asked: false },
					withANewScope: { asked: true, lists: ['Phone number'] },
					withThatScopeAgain: { asked: false }
				}
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
		id: 'implicit-flow',
		steps: ['redirect-with-code'],
		title: 'Implicit flow',
		text: 'Off on a new client, though the server lists it as something it supports. Asking for it then gets an error, and turning this on lets the token go through the browser. Current advice is to leave it off.',
		place: clientSettings('Capability config', 'Implicit flow'),
		backedBy: {
			question: 'implicitFlow',
			shows: { serverLists: true, before: { allowed: false }, after: { allowed: true } }
		}
	},
	{
		id: 'web-origins',
		steps: ['token-request'],
		title: 'Web origins',
		text: "An app that runs in the page makes this request from the page, so the browser blocks it unless the app's origin is listed here. It shows up as a CORS error, and the code still works afterwards, so the login can be tried again once the origin is listed. The app in this recording is a server standing in for one, which needs nothing here.",
		when: not(confidential),
		place: clientSettings('Access settings', 'Web origins'),
		backedBy: {
			question: 'webOrigins',
			shows: {
				before: { blocked: true, theSameCodeAfterwards: 200 },
				after: { blocked: false, status: 200 }
			}
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
				text: 'Someone with only the code gets a 400 invalid_grant: PKCE code verifier not specified. That try also uses up the code, so the real app has to start the login again. That is how Keycloak does it, and the specs do not say whether a failed try counts.'
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
				when: dpop,
				text: "Off by default. This login named the app's key with dpop_jkt, so someone with only the code gets a 400: DPoP Proof missing, or with their own key, that its thumbprint does not match. A login that does not name a key has no such protection: they get tokens with a key of their own, even with Require DPoP bound tokens on."
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
				confidentialNoPkceNoSecret: { status: 401, theRealAppAfterwards: { status: 200 } },
				withDpop: {
					namedKeyNoProof: { status: 400, description: 'DPoP Proof missing' },
					namedKeyOtherProof: {
						status: 400,
						description: 'DPoP Proof public key thumbprint does not match dpop_jkt'
					},
					namedKeyRightProof: { status: 200, tokenType: 'DPoP' },
					noNamedKeyNoProof: { status: 200, tokenType: 'Bearer' },
					noNamedKeyTheirOwnProof: { status: 200, tokenType: 'DPoP' },
					requiredNoProof: { status: 400 },
					requiredTheirOwnProof: { status: 200, tokenType: 'DPoP' }
				}
			}
		},
		seen: 'Tried with each kind of client, with and without PKCE, on'
	},
	{
		id: 'code-used-twice',
		steps: ['real-app-refused'],
		title: 'A code used twice',
		text: 'Keycloak cancels what the code got when someone uses it again: after this, UserInfo says 401 to their access token and their refresh token is refused. The demo API looks at the token itself and never asks Keycloak, so it goes on answering until the token expires. An API that asks the server each time may not.',
		when: not(pkce),
		backedBy: {
			question: 'stolenTokensAfterTheRealAppTried',
			shows: {
				before: { userinfo: 200, demoApi: 200 },
				after: { userinfo: 401, demoApi: 200 },
				refresh: { status: 400 }
			}
		},
		seen: 'Tried on'
	},
	{
		id: 'client-scopes',
		steps: ['token-response'],
		claims: [
			'name',
			'email',
			'preferred_username',
			'given_name',
			'family_name',
			'email_verified',
			'scope'
		],
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
		steps: ['token-response', 'token-runs-out'],
		claims: ['exp'],
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
		steps: ['token-response', 'api-check-token'],
		claims: ['aud'],
		claimsVerb: 'can be changed with',
		title: 'Audience mapper',
		text: "A default client's access token names account as its audience, not your API, so an API that checks the audience refuses it. Here account comes from the default roles client scope, and without that scope there is no audience at all. Add an Audience mapper to the client's dedicated scope to name your API. The demo API here is told to accept account, so that it can run against a default client, which means any default client's token in this realm gets in. Yours should expect its own name.",
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
				before: { aud: 'account', namesTheApi: false, demoApi: 200 },
				after: { namesTheApi: true },
				withoutTheRolesScope: { aud: null }
			}
		}
	},
	{
		id: 'revoke-refresh-token',
		steps: ['refresh-again-response', 'refresh-newest-response'],
		title: 'Revoke Refresh Token',
		text: "Off by default, so the old refresh token keeps working though a new one came back, on a client with no secret too. RFC 9700 asks more than that of a public client, so this is the setting to look at. Turn it on and a second use says Maximum allowed refresh token reuse exceeded, and then the newest one says Session doesn't have required client, because the second use ended the session for that client.",
		when: is('refresh', true),
		place: {
			path: ['Realm settings', 'Tokens', 'Revoke Refresh Token'],
			page: 'realm-settings',
			opens: 'Tokens',
			shows: ['Revoke Refresh Token']
		},
		backedBy: {
			question: 'revokeRefreshToken',
			shows: {
				before: {
					setting: false,
					oldAgain: { status: 200 },
					oldAgainWithNoSecret: { again: 200 }
				},
				after: {
					oldAgain: {
						status: 400,
						error: 'invalid_grant',
						description: 'Maximum allowed refresh token reuse exceeded'
					},
					newest: {
						status: 400,
						error: 'invalid_grant',
						description: "Session doesn't have required client"
					}
				}
			}
		}
	},
	{
		id: 'short-for-this-recording',
		steps: ['token-runs-out'],
		title: 'How long this recording waited',
		text: 'An access token lasts five minutes on a default Keycloak, and its refresh token thirty. In this recording the access token lasts three seconds, so it does not have to wait, which is why expires_in says 3. With its real life, the same two calls answered the same: UserInfo said 401, and a refresh then said 200.',
		when: is('refresh', true),
		backedBy: {
			question: 'refreshTokens',
			shows: {
				first: { expiresIn: 300, refreshExpiresIn: 1800 },
				pastItsLife: { userinfo: 401, thenARefresh: 200 }
			}
		},
		seen: 'Let a token run out, and tried both on'
	},
	{
		id: 'how-an-api-says-no',
		steps: ['api-response'],
		title: 'What its own API answers',
		text: "This answer is from the demo API. Keycloak's own UserInfo answers the same way: a 401 with no error when there is no token, a 401 with invalid_token and Token verification failed when it does not accept one, and a 403 with insufficient_scope when the token does not have the openid scope.",
		when: not(is('apiToken', 'good')),
		backedBy: {
			question: 'howAnApiSaysNo',
			shows: {
				goodToken: { status: 200 },
				noToken: { status: 401, wwwAuthenticate: 'Bearer realm="demo"' },
				changed: {
					status: 401,
					wwwAuthenticate:
						'Bearer realm="demo", error="invalid_token", error_description="Token verification failed"'
				},
				withoutOpenid: {
					status: 403,
					wwwAuthenticate:
						'Bearer realm="demo", error="insufficient_scope", error_description="Missing openid scope"'
				}
			}
		},
		seen: 'Tried each of these on'
	},
	{
		id: 'require-dpop',
		steps: ['token-request'],
		title: 'Require DPoP bound tokens',
		text: 'Off by default, and a client that sends a proof still gets a bound token. Turn it on and a request with no proof is refused. Someone with a stolen code can still send a proof of their own, so this alone does not protect the code.',
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
		text: 'Going straight to the other provider takes a default provider on this step of the browser flow, or the app sending kc_idp_hint. Without either, Keycloak shows its own login page, with a button for the other provider.',
		when: is('broker', true),
		place: {
			path: ['Authentication', 'browser', 'Identity Provider Redirector'],
			page: 'browser-flow',
			opens: 'browser',
			shows: ['Identity Provider Redirector']
		},
		backedBy: {
			question: 'brokerRedirector',
			shows: {
				before: { redirects: true },
				after: { redirects: false },
				withHint: { redirects: true }
			}
		}
	},
	{
		id: 'store-tokens',
		steps: ['store-upstream-tokens', 'enable-token-storage'],
		title: 'Store tokens',
		text: [
			{
				when: apiV2,
				text: 'Off by default. On API V2 this or Store token in session is enough for the app to ask, and with neither it gets a 400.'
			},
			{ text: 'Off by default, and then there is nothing for the app to ask for.' }
		],
		when: any(apiV1, apiV2),
		place: providerSettings('Store tokens'),
		backedBy: {
			question: 'storeTokens',
			shows: {
				byDefault: { storeToken: false },
				before: { status: 200 },
				after: { status: 400 }
			}
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

const notesOfFlow: Readonly<Record<string, readonly NoteDef[]>> = {
	'authorization-code': noteDefs
};

/** The notes on a step of this base flow, in these settings. */
export function notesFor(flow: string, step: string, settings: Settings): Note[] {
	return (notesOfFlow[flow] ?? [])
		.filter((def) => def.steps.includes(step) && (!def.when || holds(def.when, settings)))
		.map((def) => ({
			id: def.id,
			title: def.title,
			text: resolveText(def.text, settings),
			path: def.place?.path,
			serverOption: def.serverOption,
			flag: def.flag,
			evidence: def.seen ?? CHANGED_IT,
			claims: def.claims ?? [],
			claimsVerb: def.claimsVerb
		}));
}
