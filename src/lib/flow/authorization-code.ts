import type { DiagramDef } from '#lib/flow/model.ts';
import { all, any, is, not } from '#lib/flow/settings.ts';

const oidc = is('oidc', true);
const confidential = is('clientType', 'confidential');
const pkce = is('pkce', true);
const consent = is('consent', true);
const attacker = is('attacker', true);
// The code is one-time, and on a public client nothing stops someone else using it first.
const codeGone = all(attacker, not(confidential));
const stillGoing = not(codeGone);
const attackerWins = all(codeGone, not(pkce));
const stoppedByPkce = all(codeGone, pkce);
const stoppedBySecret = all(attacker, confidential);
const dpop = is('binding', 'dpop');
const bearer = is('binding', 'bearer');
const nonce = is('dpopNonce', true);
const broker = is('broker', true);
const storedTokens = any(is('upstreamTokens', 'v1'), is('upstreamTokens', 'v2'));
const apiV1 = is('upstreamTokens', 'v1');
const apiV2 = is('upstreamTokens', 'v2');

/**
 * Every field here is held to the recordings of a real Keycloak by src/lib/recordings/recordings.test.ts.
 * The concept texts are not, because they explain and do not describe the wire.
 */
export const authorizationCode: DiagramDef = {
	id: 'authorization-code',
	title: 'Authorization code flow',
	caption: 'What happens when a user arrives.',
	summary: 'An app gets access on behalf of a user, without ever seeing their password.',
	intro:
		'An app wants to do something for a user, such as read their calendar, without ever seeing their password. OAuth is how it gets permission. OpenID Connect adds who the user is, which is what logging in with an account elsewhere comes down to. Press Next to follow it, one message at a time.',
	specs: ['rfc6749', 'rfc6750'],
	lifelines: [
		{
			id: 'browser',
			plainName: "User's browser",
			plainRole: 'Where the user is',
			name: "User's browser",
			role: 'Where the user is',
			icon: 'browser',
			front: true,
			concept:
				'Where the user is. Anything sent through the browser can be seen, and changed, by the user and by software in the browser. That is why the flow is careful about what goes this way.'
		},
		{
			id: 'app',
			plainName: 'App',
			plainRole: 'What the user uses',
			name: 'App',
			role: [{ when: oidc, text: 'Relying party' }, { text: 'OAuth client' }],
			icon: 'app',
			startsWith: [{ artifact: 'secret', when: confidential }],
			concept: [
				{
					when: not(confidential),
					text: "The application the user wants to use. In OAuth's terms it is the client, and it never sees the user's password. If it runs in the browser, it and the browser on this diagram are the same place: its direct calls come from the page, and anything running in that page can see them."
				},
				{
					text: "The application the user wants to use. In OAuth's terms it is the client, and it never sees the user's password."
				}
			]
		},
		{
			id: 'idp',
			plainName: 'Identity provider',
			plainRole: 'Logs users in',
			name: 'IdP',
			role: [
				{ when: broker, text: 'Broker' },
				{ when: oidc, text: 'OpenID provider' },
				{ text: 'Authorization server' }
			],
			icon: 'idp',
			startsWith: [{ artifact: 'secret', when: confidential }],
			concept:
				'The identity provider, or IdP, logs users in and issues tokens. Its issuer is the address that names it: a token it signs says who issued it, and everyone checks that against the address they were set up with.'
		},
		{
			id: 'attacker',
			plainName: 'Someone else',
			plainRole: 'Has no business here',
			name: 'Attacker',
			role: 'Has a copy of the code',
			icon: 'attacker',
			concept:
				"Someone who can see the redirects that go through the browser, but is not the app. On a phone that can be another app claiming the same address. In a browser it can be a log or a history that keeps addresses. Something running inside the app's own page sees far more than this, and no setting here stops that.",
			when: attacker
		},
		{
			id: 'upstream',
			plainName: 'Other provider',
			plainRole: 'Does the login',
			name: 'Upstream IdP',
			role: 'External provider',
			icon: 'upstream',
			concept:
				"Another identity provider, such as the one at the user's employer, which the identity provider trusts to log the user in.",
			when: broker
		},
		{
			id: 'api',
			plainName: 'API',
			plainRole: 'Has the data',
			name: 'API',
			role: 'Resource server',
			icon: 'api',
			concept:
				'What the app wants to call on behalf of the user. It decides from the token whether to answer, without ever talking to the user.'
		}
	],
	groups: [
		{
			id: 'brokered-login',
			plain: 'The login at the other provider',
			label: 'Brokered login: here the identity provider is the client',
			when: broker
		},
		{ id: 'nonce-retry', plain: 'A fresh proof', label: 'Nonce retry', when: nonce }
	],
	steps: [
		{
			id: 'open-app',
			from: 'browser',
			to: 'app',
			kind: 'request',
			plain: 'The user opens the app',
			label: 'Open the app',
			concept: 'The user wants something from the app, and the app needs them logged in first.',
			inPractice:
				'Which pages need a login is your code. For most of what follows, a library does the work, and you give it a few values.',
			links: [
				{
					diagram: 'setup',
					step: 'register-client',
					text: 'See how the app and the identity provider got to know each other'
				}
			]
		},
		{
			id: 'generate-key',
			from: 'app',
			to: 'app',
			kind: 'internal',
			plain: 'The app makes a key pair',
			label: 'Generate a key pair',
			concept:
				'DPoP ties tokens to a key only this app holds, so a stolen token is useless without the key.',
			inPractice: 'A library does this, if it supports DPoP. Not all of them do yet.',
			when: dpop
		},
		{
			id: 'make-verifier',
			from: 'app',
			to: 'app',
			kind: 'internal',
			plain: 'The app makes up a one-time secret',
			label: 'Generate the verifier and challenge',
			concept:
				'The app makes up a random value for this login, the verifier, and keeps it to itself. From it, it works out a fingerprint, the challenge, that cannot be turned back. Only the fingerprint goes through the browser.',
			inPractice: 'A library does this for you, often once you turn it on.',
			when: pkce,
			fields: [
				{
					name: 'code_verifier',
					place: 'memory',
					note: 'Random, for this login only',
					artifact: 'verifier'
				},
				{
					name: 'code_challenge',
					place: 'memory',
					note: 'SHA-256 of the verifier',
					artifact: 'challenge'
				}
			]
		},
		{
			id: 'redirect-to-idp',
			from: 'app',
			to: 'browser',
			kind: 'response',
			plain: 'The app sends the browser to log in',
			label: '302 to the identity provider',
			concept:
				'The app sends the browser to the identity provider, because the password must never reach the app.',
			inPractice: 'A library does this, from the values you gave it in setup.',
			fields: [{ name: 'code_challenge', place: 'query', artifact: 'challenge', when: pkce }]
		},
		{
			id: 'authorize',
			from: 'browser',
			to: 'idp',
			kind: 'request',
			plain: 'The browser asks to log in',
			label: 'GET /authorize',
			concept: [
				{
					when: oidc,
					text: 'The browser asks the identity provider to log the user in. The openid scope asks for proof of who that was as well. The identity provider first checks that the address to send the user back to is one registered in setup.'
				},
				{
					text: 'The browser asks the identity provider to log the user in and grant the app access. The identity provider first checks that the address to send the user back to is one registered in setup.'
				}
			],
			pitfall: {
				title: 'What if the address does not match?',
				text: 'The identity provider has to stop and show an error, and must not send the browser anywhere. Otherwise an attacker could ask for the code to be sent to them, which is why current advice is an exact match.'
			},
			links: [
				{
					diagram: 'setup',
					step: 'register-client',
					text: 'See where the address was registered'
				}
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
				},
				{
					name: 'code_challenge',
					place: 'query',
					note: 'The identity provider keeps this with the code',
					artifact: 'challenge',
					when: pkce
				},
				{
					name: 'code_challenge_method=S256',
					place: 'query',
					note: 'How the fingerprint was made',
					when: pkce
				}
			]
		},
		{
			id: 'login-page',
			from: 'idp',
			to: 'browser',
			kind: 'response',
			plain: 'The login page',
			label: 'Login page',
			concept: 'The identity provider asks the user to prove who they are, on its own page.',
			when: not(broker)
		},
		{
			id: 'submit-credentials',
			from: 'browser',
			to: 'idp',
			kind: 'request',
			plain: 'The user enters their password',
			label: 'Submit credentials',
			concept: 'The user signs in at the identity provider. The app sees none of this.',
			when: not(broker),
			execute: { answer: 'redirect-with-code', when: not(consent) },
			fields: [{ name: 'username and password', place: 'body', artifact: 'password' }]
		},
		{
			id: 'redirect-to-upstream',
			group: 'brokered-login',
			from: 'idp',
			to: 'browser',
			kind: 'response',
			plain: 'Sent on to the other provider',
			label: '303 to the other provider',
			concept:
				'The identity provider does not log the user in itself. It sends the browser on to the other provider.',
			inPractice: 'Nothing changes for your app. It does not know this is happening.',
			when: broker
		},
		{
			id: 'upstream-authorize',
			group: 'brokered-login',
			from: 'browser',
			to: 'upstream',
			kind: 'request',
			plain: 'The browser asks to log in there',
			label: 'GET /authorize',
			concept:
				'The same request the app made, but now the identity provider is the client asking for a login.',
			when: broker,
			fields: [
				{ name: 'response_type=code', place: 'query' },
				{
					name: 'client_id',
					place: 'query',
					note: "The identity provider's own client ID at the upstream"
				},
				{ name: 'redirect_uri', place: 'query', note: "The identity provider's broker endpoint" },
				{ name: 'state', place: 'query' },
				{ name: 'scope=openid', place: 'query' },
				{ name: 'nonce', place: 'query' }
			]
		},
		{
			id: 'upstream-sign-in',
			group: 'brokered-login',
			from: 'browser',
			to: 'upstream',
			kind: 'request',
			plain: 'The user enters their password there',
			label: 'Sign in',
			concept:
				'The user signs in at the other provider. Neither the app nor the identity provider sees the password.',
			when: broker,
			execute: { answer: 'upstream-redirect-back' },
			fields: [{ name: 'username and password', place: 'body', artifact: 'password' }]
		},
		{
			id: 'upstream-redirect-back',
			group: 'brokered-login',
			from: 'upstream',
			to: 'browser',
			kind: 'response',
			plain: 'Sent back with a code',
			label: '302 back with a code',
			concept:
				'The other provider sends the browser back to the identity provider with a one-time code.',
			when: broker,
			fields: [
				{ name: 'code', place: 'query' },
				{ name: 'state', place: 'query' },
				{ name: 'iss', place: 'query', note: 'Names the server this came from' }
			]
		},
		{
			id: 'upstream-callback',
			group: 'brokered-login',
			from: 'browser',
			to: 'idp',
			kind: 'request',
			plain: 'The code reaches the identity provider',
			label: 'Deliver the code',
			concept: "The browser delivers the code to the identity provider's broker endpoint.",
			when: broker,
			fields: [
				{ name: 'code', place: 'query' },
				{ name: 'state', place: 'query' },
				{ name: 'iss', place: 'query', note: 'Names the server this came from' }
			]
		},
		{
			id: 'upstream-token-request',
			group: 'brokered-login',
			from: 'idp',
			to: 'upstream',
			kind: 'request',
			plain: 'It trades the code for tokens',
			label: 'POST /token',
			concept:
				'The identity provider trades the code for tokens, on a connection the browser never sees.',
			when: broker,
			execute: { answer: 'upstream-token-response', when: storedTokens },
			fields: [
				{ name: 'grant_type=authorization_code', place: 'body' },
				{ name: 'code', place: 'body' },
				{ name: 'redirect_uri', place: 'body' },
				{ name: 'client_id', place: 'body' },
				{ name: 'client_secret', place: 'body' }
			]
		},
		{
			id: 'upstream-token-response',
			group: 'brokered-login',
			from: 'upstream',
			to: 'idp',
			kind: 'response',
			plain: 'Tokens for the identity provider',
			label: 'Upstream tokens',
			concept:
				'These tokens belong to the identity provider. The app will get tokens the identity provider issues itself.',
			when: broker,
			fields: [
				{ name: 'access_token', place: 'body', artifact: 'upstream-token' },
				{ name: 'id_token', place: 'body' },
				{ name: 'token_type=Bearer', place: 'body' },
				{ name: 'expires_in', place: 'body' },
				{ name: 'refresh_token', place: 'body' },
				{ name: 'scope', place: 'body' }
			]
		},
		{
			id: 'store-upstream-tokens',
			group: 'brokered-login',
			from: 'idp',
			to: 'idp',
			kind: 'internal',
			plain: 'It keeps those tokens',
			label: 'Store upstream tokens',
			concept: [
				{
					when: apiV2,
					text: 'The identity provider keeps the upstream tokens, in the user session or the database.'
				},
				{
					text: 'The identity provider keeps the upstream tokens in its database, per user and upstream IdP.'
				}
			],
			when: storedTokens
		},
		{
			id: 'match-user',
			group: 'brokered-login',
			from: 'idp',
			to: 'idp',
			kind: 'internal',
			plain: 'It links this person to a user',
			label: 'Match or create the user',
			concept:
				'The identity provider links the external identity to a local user, creating one if needed.',
			when: broker
		},
		{
			id: 'consent-page',
			from: 'idp',
			to: 'browser',
			kind: 'response',
			plain: 'What the app is asking for',
			label: 'Consent page',
			concept:
				'The identity provider asks the user whether this app may have this access. What it lists are scopes: each one names some access or some information. They come from what the app asked for and from how it was set up. This is between the user and the identity provider, and the app has no part in it.',
			pitfall: {
				title: 'What if the user says no?',
				text: 'The browser still goes back to the app, but with error=access_denied in place of a code. So the app has to expect this, and has nothing to trade.'
			},
			when: consent
		},
		{
			id: 'consent-grant',
			from: 'browser',
			to: 'idp',
			kind: 'request',
			plain: 'The user agrees',
			label: 'Grant access',
			concept:
				'The user says yes. The identity provider remembers that for this user and this app, so it does not ask again at the next login.',
			when: consent,
			execute: { answer: 'redirect-with-code' },
			fields: [
				{
					name: 'accept',
					place: 'body',
					note: 'How this form says yes, which is up to the server'
				},
				{
					name: 'code',
					place: 'body',
					note: "The server's own login session, not the code in this flow"
				}
			]
		},
		{
			id: 'redirect-with-code',
			from: 'idp',
			to: 'browser',
			kind: 'response',
			plain: 'Sent back with a one-time code',
			label: '302 back with a code',
			concept:
				'The identity provider sends the browser back to the app with a short-lived, one-time code. This goes through the browser, where it can be seen, so it cannot be a token yet.',
			fields: [
				{ name: 'code', place: 'query', artifact: 'code' },
				{ name: 'state', place: 'query' },
				{ name: 'iss', place: 'query', note: 'Names the server this came from' }
			]
		},
		{
			id: 'attacker-steals-code',
			from: 'browser',
			to: 'attacker',
			kind: 'request',
			plain: 'Someone else copies the code',
			label: 'Code intercepted',
			concept:
				'The code crosses the browser, so anything that can see that can copy it, the moment it goes by.',
			recordedAs:
				'The request the real app gets, drawn going to them as well. How someone gets a copy is not something a recording can show.',
			when: attacker,
			fields: [
				{ name: 'code', place: 'query', artifact: 'code' },
				{ name: 'state', place: 'query', note: 'Means nothing to them, and they can ignore it' },
				{ name: 'iss', place: 'query', note: 'Tells them where to take the code' }
			]
		},
		{
			id: 'attacker-token-request',
			from: 'attacker',
			to: 'idp',
			kind: 'request',
			plain: 'They try to trade it for tokens',
			label: 'POST /token',
			execute: { answer: 'attacker-token-response', when: attackerWins },
			concept: [
				{
					when: not(confidential),
					text: 'They send the code to the identity provider, exactly as the real app would. This client has no secret, so nothing marks this request as not coming from the app.'
				},
				{
					text: 'They send the code to the identity provider, as the real app would, but they do not have the secret to send with it.'
				}
			],
			when: attacker,
			fields: [
				{ name: 'grant_type=authorization_code', place: 'body' },
				{ name: 'code', place: 'body', artifact: 'code' },
				{ name: 'redirect_uri', place: 'body' },
				{ name: 'client_id', place: 'body', note: 'Not a secret, and it was in the login address' }
			]
		},
		{
			id: 'attacker-token-response',
			from: 'idp',
			to: 'attacker',
			kind: 'response',
			plain: [
				{ when: attackerWins, text: 'They get the tokens' },
				{ when: stoppedByPkce, text: 'Refused: they have no verifier' },
				{ text: 'Refused: they have no secret' }
			],
			label: [
				{ when: attackerWins, text: '200 with tokens' },
				{ when: stoppedByPkce, text: '400 invalid_grant' },
				{ text: '401 unauthorized_client' }
			],
			concept: [
				{
					when: attackerWins,
					text: 'The identity provider has no way to tell. They now hold what the app was supposed to get, and the user never knew.'
				},
				{
					when: stoppedByPkce,
					text: 'The code was tied to a challenge when it was issued, and only the verifier matches it. That was never in a redirect, so someone who only saw the code does not have it.'
				},
				{
					text: 'Without the secret, the identity provider will not even look at the code. But they could still hand it to the real app from their own browser, so that it trades the code for them, which is what PKCE stops.'
				}
			],
			when: attacker,
			fields: [
				{ name: 'access_token', place: 'body', artifact: 'access-token', when: attackerWins },
				{ name: 'token_type=Bearer', place: 'body', when: attackerWins },
				{ name: 'id_token', place: 'body', when: all(attackerWins, oidc) },
				{ name: 'expires_in', place: 'body', when: attackerWins },
				{ name: 'refresh_token', place: 'body', when: attackerWins },
				{ name: 'scope', place: 'body', when: attackerWins },
				{
					name: 'error=invalid_grant',
					place: 'body',
					note: 'The code cannot be used this way',
					when: stoppedByPkce
				},
				{
					name: 'error=unauthorized_client',
					place: 'body',
					note: 'The client did not prove who it is. The spec calls this invalid_client, and this server says this instead',
					when: stoppedBySecret
				},
				{
					name: 'error_description',
					place: 'body',
					note: 'Which check it failed',
					when: not(attackerWins)
				}
			]
		},
		{
			id: 'attacker-api-request',
			from: 'attacker',
			to: 'api',
			kind: 'request',
			plain: 'They call the API as the user',
			label: 'GET /resource',
			concept: 'A bearer token works for whoever holds it, so this is all it takes.',
			when: attackerWins,
			fields: [{ name: 'Authorization: Bearer', place: 'header', artifact: 'access-token' }]
		},
		{
			id: 'attacker-api-response',
			from: 'api',
			to: 'attacker',
			kind: 'response',
			plain: 'The API answers them',
			label: '200 with the resource',
			concept:
				"The API has no way to tell either. As far as it knows, this is the user's app, doing what the user allowed.",
			when: attackerWins
		},
		{
			id: 'callback',
			from: 'browser',
			to: 'app',
			kind: 'request',
			plain: 'The code reaches the app',
			label: 'Deliver the code',
			concept: [
				{
					when: all(not(confidential), not(pkce)),
					text: 'The code reaches the app. With no secret and no PKCE, this code is all anyone needs to get the tokens, and it has just been through the browser.'
				},
				{ text: 'The code reaches the app. On its own it is worth little, which is the point.' }
			],
			inPractice:
				'A library handles this, at the address you registered. That address has to exist in your app, and match exactly.',
			fields: [
				{ name: 'code', place: 'query', artifact: 'code' },
				{ name: 'state', place: 'query', note: 'Must match what the app sent' },
				{ name: 'iss', place: 'query', note: 'Names the server this came from' }
			]
		},
		{
			id: 'token-request',
			from: 'app',
			to: 'idp',
			kind: 'request',
			plain: 'The app trades the code for tokens',
			label: 'POST /token',
			execute: { answer: 'token-response', when: stillGoing },
			inPractice: [
				{
					when: confidential,
					text: 'A library does this. Keep the secret in your configuration, and out of your code.'
				},
				{ text: 'A library does this. There is no secret to keep, because there could not be one.' }
			],
			concept: [
				{
					when: all(confidential, pkce),
					text: 'The app trades the code for tokens on a direct call. Its secret proves which app it is, and the verifier proves it started this very login. Neither was ever in a redirect.'
				},
				{
					when: confidential,
					text: 'The app trades the code for tokens on a direct call, and proves who it is with its secret. Someone who only saw the code in the browser cannot do this.'
				},
				{
					when: pkce,
					text: 'The app trades the code for tokens on a direct call. A public client has no secret to prove who it is, but it does have the verifier, which was never in a redirect. Someone who only saw the code cannot do this. If the app runs in the browser, this call comes from its own JavaScript.'
				},
				{
					text: 'The app trades the code for tokens on a direct call. A public client has no secret to prove who it is, so anyone holding the code could do this too, which is the gap PKCE closes. If the app runs in the browser, this call comes from its own JavaScript.'
				}
			],
			pitfall: {
				title: 'What if someone else gets hold of the code?',
				text: [
					{
						when: all(not(confidential), not(pkce)),
						text: 'They can do exactly this. Nothing in this request shows it comes from the real app, so whoever intercepted the code gets the tokens. This is the attack PKCE was made for.'
					},
					{
						when: not(confidential),
						text: 'If all they can do is read the code, they get nothing. They would also need the verifier, which is only being sent now, and the challenge they may have seen cannot be turned back into it. Someone who can also change the login request as it goes by can get round this, though that takes much more.'
					},
					{
						when: pkce,
						text: 'They get nothing, even by handing the code to the real app from their own browser. The app would send the verifier of that other login, and it does not match.'
					},
					{
						when: oidc,
						text: 'They cannot do this alone, because they do not have the secret. They could hand the code to the real app from their own browser, so that it trades the code for them. The nonce lets the app notice this, if it checks. PKCE stops it at the identity provider.'
					},
					{
						text: 'They cannot do this alone, because they do not have the secret. But they can hand the code to the real app from their own browser, so that it trades the code for them, and then they are in as the user. PKCE stops this as well.'
					}
				]
			},
			fields: [
				{ name: 'grant_type=authorization_code', place: 'body' },
				{ name: 'code', place: 'body', artifact: 'code' },
				{ name: 'redirect_uri', place: 'body' },
				{ name: 'client_id', place: 'body', when: not(confidential) },
				{
					name: 'Authorization: Basic',
					place: 'header',
					note: 'The client ID and secret',
					artifact: 'secret',
					when: confidential
				},
				{
					name: 'code_verifier',
					place: 'body',
					note: 'Sent now, and never in a redirect',
					artifact: 'verifier',
					when: pkce
				},
				{
					name: 'DPoP',
					place: 'header',
					note: 'A proof signed with the key',
					artifact: 'proof',
					when: dpop
				}
			]
		},
		{
			id: 'nonce-challenge',
			group: 'nonce-retry',
			from: 'idp',
			to: 'app',
			kind: 'response',
			plain: 'The server asks for a fresh proof',
			label: '400 use_dpop_nonce',
			concept: 'The server rejects the proof and hands the app a nonce to sign into the next one.',
			when: all(all(dpop, nonce), stillGoing),
			specOnly: 'RFC 9449 section 8',
			fields: [
				{ name: 'error=use_dpop_nonce', place: 'body' },
				{ name: 'DPoP-Nonce', place: 'header' }
			]
		},
		{
			id: 'token-request-retry',
			group: 'nonce-retry',
			from: 'app',
			to: 'idp',
			kind: 'request',
			plain: 'The app tries again',
			label: 'POST /token',
			concept: 'The same request again, with a new proof that includes the nonce.',
			when: all(all(dpop, nonce), stillGoing),
			specOnly: 'RFC 9449 section 8',
			fields: [{ name: 'DPoP', place: 'header', note: 'A proof with the nonce', artifact: 'proof' }]
		},
		{
			id: 'real-app-refused',
			from: 'idp',
			to: 'app',
			kind: 'response',
			plain: 'The real app is refused',
			label: '400 invalid_grant',
			inPractice: 'A library reports this as an error. Your app should offer to start again.',
			concept: [
				{
					when: pkce,
					text: 'A code works once, and this server counts a failed try as that once, which the specs do not ask for. So PKCE kept the tokens from them, but someone with the code can still spoil the login. The user has to start again.'
				},
				{
					text: 'A code works once, and it has been used, so the app gets nothing and the user sees an error. The specs advise the server to cancel what that code got, and this one does. But someone else has had the tokens by then, and an API that only checks the signature goes on taking them until they expire.'
				}
			],
			when: codeGone,
			fields: [
				{ name: 'error=invalid_grant', place: 'body', note: 'The code cannot be used this way' },
				{ name: 'error_description', place: 'body', note: 'Which check it failed' }
			]
		},
		{
			id: 'check-verifier',
			from: 'idp',
			to: 'idp',
			kind: 'internal',
			plain: 'It checks the one-time secret',
			label: 'Check the verifier',
			concept:
				'The identity provider works out the fingerprint of the verifier it just got, and compares it with the challenge it kept with this code. They only match for whoever started this login.',
			when: all(pkce, stillGoing),
			fields: [
				{
					name: 'code_verifier',
					place: 'memory',
					note: 'Its SHA-256 has to match',
					artifact: 'verifier'
				},
				{ name: 'code_challenge', place: 'memory', artifact: 'challenge' }
			]
		},
		{
			id: 'token-response',
			when: stillGoing,
			from: 'idp',
			to: 'app',
			kind: 'response',
			plain: [{ when: oidc, text: 'An access token and an ID token' }, { text: 'An access token' }],
			label: [{ when: oidc, text: 'Access token and ID token' }, { text: 'Access token' }],
			concept: [
				{
					when: oidc,
					text: 'The access token is for the API, and the ID token tells the app who logged in.'
				},
				{ text: 'The access token lets the app call the API. It is meant for the API to read.' }
			],
			inPractice:
				'A library takes these. Where they are kept is up to you, and worth thinking about, because whoever gets them can use them.',
			fields: [
				{ name: 'access_token', place: 'body', artifact: 'access-token' },
				{ name: 'token_type=Bearer', place: 'body', when: bearer },
				{ name: 'token_type=DPoP', place: 'body', when: dpop },
				{ name: 'id_token', place: 'body', artifact: 'id-token', when: oidc },
				{ name: 'expires_in', place: 'body' },
				{
					name: 'refresh_token',
					place: 'body',
					note: 'Gets a new access token later, which this diagram does not follow'
				},
				{ name: 'scope', place: 'body' }
			]
		},
		{
			id: 'validate-id-token',
			from: 'app',
			to: 'app',
			kind: 'internal',
			plain: 'The app checks the ID token',
			label: 'Validate the ID token',
			concept:
				'The app checks signature, issuer, audience, expiry and nonce before it trusts the token.',
			inPractice: 'A library does this. Do not skip it, and do not write it yourself.',
			when: all(oidc, stillGoing),
			fields: [
				{ name: 'iss', place: 'token' },
				{ name: 'aud', place: 'token' },
				{ name: 'exp', place: 'token' },
				{ name: 'nonce', place: 'token' }
			]
		},
		{
			id: 'userinfo-request',
			from: 'app',
			to: 'idp',
			kind: 'request',
			plain: 'The app asks about the user',
			label: 'GET /userinfo',
			concept: 'The app can ask for more about the user, using the access token.',
			inPractice: 'Often not needed, because the ID token may already say enough.',
			when: all(oidc, stillGoing),
			fields: [
				{ name: 'Authorization: Bearer', place: 'header', artifact: 'access-token', when: bearer },
				{ name: 'Authorization: DPoP', place: 'header', artifact: 'access-token', when: dpop },
				{
					name: 'DPoP',
					place: 'header',
					note: 'A proof tied to this access token',
					artifact: 'proof',
					when: dpop
				}
			]
		},
		{
			id: 'userinfo-response',
			from: 'idp',
			to: 'app',
			kind: 'response',
			plain: 'Details about the user',
			label: 'User claims',
			concept:
				'Who the user is, limited to the scopes granted, which are not always those asked for.',
			when: all(oidc, stillGoing),
			fields: [{ name: 'sub', place: 'body' }]
		},
		{
			id: 'api-request',
			when: stillGoing,
			from: 'app',
			to: 'api',
			kind: 'request',
			plain: 'The app calls the API with the token',
			label: 'GET /resource',
			concept: [
				{
					when: dpop,
					text: 'The app sends the token and a new proof, which shows it holds the key the token is tied to.'
				},
				{ text: 'The app sends the access token. Whoever holds a bearer token can use it.' }
			],
			inPractice:
				'This part is your code, though a library can add the token to each call for you.',
			fields: [
				{ name: 'Authorization: Bearer', place: 'header', artifact: 'access-token', when: bearer },
				{ name: 'Authorization: DPoP', place: 'header', artifact: 'access-token', when: dpop },
				{
					name: 'DPoP',
					place: 'header',
					note: 'A proof tied to this access token',
					artifact: 'proof',
					when: dpop
				}
			]
		},
		{
			id: 'api-check-token',
			when: stillGoing,
			from: 'api',
			to: 'api',
			kind: 'internal',
			plain: 'The API checks the token',
			label: 'Check the token',
			concept: [
				{
					when: dpop,
					text: 'The API checks the token, and that the proof was signed with the key the token names.'
				},
				{ text: 'The API checks the signature, that the token has not expired, and who it is for.' }
			],
			inPractice:
				'A library or a gateway does this, once you tell it the issuer and who tokens have to be for. Forgetting the second is a common mistake.',
			fields: [
				{ name: 'aud', place: 'token' },
				{ name: 'exp', place: 'token' },
				{ name: 'cnf.jkt', place: 'token', note: 'The key the token is tied to', when: dpop }
			]
		},
		{
			id: 'api-response',
			when: stillGoing,
			from: 'api',
			to: 'app',
			kind: 'response',
			plain: 'The API answers',
			label: '200 with the resource',
			concept: 'The app has what it came for, and the user never gave it their password.',
			inPractice: 'What it answers is up to whoever built that API, which may be you.'
		},
		{
			id: 'retrieve-upstream-token',
			from: 'app',
			to: 'idp',
			kind: 'request',
			execute: { answer: 'upstream-token' },
			inPractice: "Your code asks for this, when it needs the other provider's API.",
			plain: "The app asks for the other provider's token",
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
			when: all(storedTokens, stillGoing),
			fields: [
				{
					name: 'Authorization: Bearer',
					place: 'header',
					artifact: 'access-token',
					when: all(apiV1, bearer)
				},
				{
					name: 'Authorization: DPoP',
					place: 'header',
					artifact: 'access-token',
					when: all(apiV1, dpop)
				},
				{
					name: 'DPoP',
					place: 'header',
					note: 'A proof tied to this access token',
					artifact: 'proof',
					when: all(apiV1, dpop)
				},
				{ name: 'client_id', place: 'body', when: apiV2 },
				{ name: 'client_secret', place: 'body', artifact: 'secret', when: apiV2 },
				{
					name: 'token',
					place: 'body',
					note: "The user's access token",
					artifact: 'access-token',
					when: apiV2
				}
			]
		},
		{
			id: 'upstream-token',
			from: 'idp',
			to: 'app',
			kind: 'response',
			plain: 'The identity provider hands it over',
			label: 'Upstream access token',
			concept: [
				{
					when: apiV2,
					text: 'Only the access token the other provider issued, handed over by the identity provider.'
				},
				{
					text: 'Everything the other provider issued, handed over by the identity provider: the access token, and its ID and refresh tokens too.'
				}
			],
			when: all(storedTokens, stillGoing),
			fields: [
				{ name: 'access_token', place: 'body', artifact: 'upstream-token' },
				{ name: 'expires_in', place: 'body' },
				{ name: 'id_token', place: 'body', when: apiV1 },
				{ name: 'token_type=Bearer', place: 'body', when: apiV1 },
				{ name: 'refresh_token', place: 'body', when: apiV1 },
				{ name: 'scope', place: 'body', when: apiV1 },
				{ name: 'issued_token_type', place: 'body', when: apiV2 }
			]
		},
		{
			id: 'call-upstream',
			from: 'app',
			to: 'upstream',
			kind: 'request',
			plain: 'The app calls the other provider',
			label: "Call the upstream's API",
			concept: "With that token, the app can call the upstream provider's APIs directly.",
			inPractice: 'This part is your code, using the token as that API asks.',
			when: all(storedTokens, stillGoing),
			fields: [{ name: 'Authorization: Bearer', place: 'header', artifact: 'upstream-token' }]
		}
	]
};
