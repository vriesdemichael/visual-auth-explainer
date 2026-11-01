// Things the diagram makes a claim about, tried for real. Each answer is what the server did, so a
// claim in the flow data can be held against it (docs/research/followup-checks.md).
import { createHash, generateKeyPairSync, randomBytes, sign } from 'node:crypto';
import type { Browser } from '@playwright/test';
import type { Demo } from './demo.ts';
import {
	Admin,
	APP,
	BROKERED_REALM,
	CLIENT_SECRET,
	CONFIDENTIAL_CLIENT,
	KEYCLOAK,
	LOCAL_REALM,
	PASSWORD,
	PKCE_CLIENT,
	PUBLIC_CLIENT,
	REDIRECT_URI,
	UPSTREAM_REALM,
	USERNAME
} from './keycloak.ts';

const b64 = (value: string | Buffer) => Buffer.from(value).toString('base64url');
const sha256 = (value: string) => createHash('sha256').update(value).digest('base64url');
const random = () => randomBytes(16).toString('base64url');

function proofKey() {
	const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
	const { kty, crv, x, y } = publicKey.export({ format: 'jwk' }) as Record<string, string>;
	const jwk = { crv, kty, x, y };
	return (method: string, url: string, extra: Record<string, string> = {}) => {
		const signing = `${b64(JSON.stringify({ typ: 'dpop+jwt', alg: 'ES256', jwk }))}.${b64(
			JSON.stringify({
				jti: random(),
				htm: method,
				htu: url,
				iat: Math.floor(Date.now() / 1000),
				...extra
			})
		)}`;
		const signature = sign('sha256', Buffer.from(signing), {
			key: privateKey,
			dsaEncoding: 'ieee-p1363'
		});
		return `${signing}.${signature.toString('base64url')}`;
	};
}

/** Logs in through a real browser and hands back the code, without the demo app finishing the job. */
async function codeFor(
	browser: Browser,
	demo: Demo,
	realm: string,
	clientId: string,
	extra: Record<string, string> = {}
) {
	const context = await browser.newContext();
	const page = await context.newPage();
	demo.lastCode = '';
	const query = new URLSearchParams({
		response_type: 'code',
		client_id: clientId,
		redirect_uri: REDIRECT_URI,
		state: random(),
		...extra
	});
	const response = await page.goto(
		`${KEYCLOAK}/realms/${realm}/protocol/openid-connect/auth?${query}`
	);
	if (await page.locator('#username').count()) {
		await page.fill('#username', USERNAME);
		await page.fill('#password', PASSWORD);
		await page.click('#kc-login');
		await page.getByRole('heading', { name: 'Done' }).waitFor();
	}
	const landed = page.url();
	await context.close();
	return { code: demo.lastCode, firstStatus: response?.status() ?? 0, landed };
}

async function token(realm: string, body: Record<string, string>, headers = {}) {
	const url = `${KEYCLOAK}/realms/${realm}/protocol/openid-connect/token`;
	const response = await fetch(url, {
		method: 'POST',
		headers: { 'content-type': 'application/x-www-form-urlencoded', ...headers },
		body: new URLSearchParams(body).toString()
	});
	return {
		url,
		status: response.status,
		nonce: response.headers.get('dpop-nonce'),
		json: (await response.json()) as Record<string, string>
	};
}

const confidentialBody = (code: string) => ({
	grant_type: 'authorization_code',
	code,
	redirect_uri: REDIRECT_URI,
	client_id: CONFIDENTIAL_CLIENT,
	client_secret: CLIENT_SECRET
});

async function outcome(response: Response) {
	const text = await response.text();
	return {
		status: response.status,
		wwwAuthenticate: response.headers.get('www-authenticate'),
		// Only the shape of a success, because the body of one is a token or someone's profile.
		body: response.ok ? 'a successful answer' : text.slice(0, 160)
	};
}

const statusOf = async (url: string, headers: Record<string, string>) =>
	outcome(await fetch(url, { headers }));

async function dpopBoundBrokeredToken(browser: Browser, demo: Demo, admin: Admin) {
	await admin.forgetBrokeredUsers();
	const proof = proofKey();
	const { code } = await codeFor(browser, demo, BROKERED_REALM, CONFIDENTIAL_CLIENT);
	const url = `${KEYCLOAK}/realms/${BROKERED_REALM}/protocol/openid-connect/token`;
	const result = await token(BROKERED_REALM, confidentialBody(code), { dpop: proof('POST', url) });
	return { proof, accessToken: result.json.access_token, tokenType: result.json.token_type };
}

const brokerTokenUrl = `${KEYCLOAK}/realms/${BROKERED_REALM}/broker/${UPSTREAM_REALM}/token`;

const claimsOf = (jwt: string) =>
	JSON.parse(Buffer.from(jwt.split('.')[1], 'base64url').toString()) as Record<string, unknown>;

interface Client {
	id: string;
	attributes?: Record<string, string>;
}

/** A client of its own for each try, so changing a setting cannot disturb anything else. */
async function freshClient(admin: Admin, clientId: string, extra: object = {}) {
	await admin.call('POST', `/realms/${LOCAL_REALM}/clients`, {
		clientId,
		enabled: true,
		standardFlowEnabled: true,
		redirectUris: [REDIRECT_URI],
		publicClient: false,
		clientAuthenticatorType: 'client-secret',
		secret: CLIENT_SECRET,
		...extra
	});
	const [client] = await admin.call<Client[]>(
		'GET',
		`/realms/${LOCAL_REALM}/clients?clientId=${clientId}`
	);
	return client;
}

const tokensFor = async (
	browser: Browser,
	demo: Demo,
	clientId: string,
	send: Record<string, string> = { client_secret: CLIENT_SECRET }
) => {
	const { code } = await codeFor(browser, demo, LOCAL_REALM, clientId);
	return token(LOCAL_REALM, {
		grant_type: 'authorization_code',
		code,
		redirect_uri: REDIRECT_URI,
		client_id: clientId,
		...send
	});
};

/**
 * What each Keycloak note says: change the setting, and see the behaviour change. Each answer is
 * what the server did before and after, on a real login.
 */
async function behindTheNotes(browser: Browser, demo: Demo, admin: Admin) {
	const answers: Record<string, unknown> = {};
	const onClient = (client: Client) => `/realms/${LOCAL_REALM}/clients/${client.id}`;
	const change = (client: Client, changes: object) =>
		admin.call('PUT', onClient(client), { ...client, ...changes });

	{
		const client = await freshClient(admin, 'note-redirect');
		const elsewhere = `${APP}/elsewhere`;
		const ask = async () => {
			const answer = await fetch(
				`${KEYCLOAK}/realms/${LOCAL_REALM}/protocol/openid-connect/auth?${new URLSearchParams({
					response_type: 'code',
					client_id: 'note-redirect',
					redirect_uri: elsewhere,
					state: random()
				})}`,
				{ redirect: 'manual' }
			);
			const text = await answer.text();
			return { status: answer.status, says: text.match(/Invalid parameter[^<]*/)?.[0] ?? null };
		};
		const before = await ask();
		await change(client, { redirectUris: [REDIRECT_URI, elsewhere] });
		answers.validRedirectUris = { before, after: await ask() };
	}

	{
		const client = await freshClient(admin, 'note-type');
		const noSecret = {};
		const before = await tokensFor(browser, demo, 'note-type', noSecret);
		await change(client, { publicClient: true });
		const after = await tokensFor(browser, demo, 'note-type', noSecret);
		answers.clientAuthentication = {
			before: { status: before.status, error: before.json.error },
			after: { status: after.status, gotTokens: 'access_token' in after.json }
		};
	}

	{
		const client = await freshClient(admin, 'note-pkce', { publicClient: true });
		const before = await codeFor(browser, demo, LOCAL_REALM, 'note-pkce');
		await change(client, { attributes: { 'pkce.code.challenge.method': 'S256' } });
		const after = await codeFor(browser, demo, LOCAL_REALM, 'note-pkce');
		answers.requirePkce = {
			before: { gotCode: Boolean(before.code) },
			after: {
				gotCode: Boolean(after.code),
				says: new URL(after.landed).searchParams.get('error_description')
			}
		};
	}

	{
		const client = await freshClient(admin, 'note-scopes');
		const said = (claims: Record<string, unknown>) => ({
			hasName: 'name' in claims,
			hasEmail: 'email' in claims,
			scope: claims.scope
		});
		const before = await tokensFor(browser, demo, 'note-scopes');
		const scopes = await admin.call<{ id: string; name: string }[]>(
			'GET',
			`${onClient(client)}/default-client-scopes`
		);
		for (const scope of scopes.filter(({ name }) => name === 'profile' || name === 'email')) {
			await admin.call('DELETE', `${onClient(client)}/default-client-scopes/${scope.id}`);
		}
		const after = await tokensFor(browser, demo, 'note-scopes');
		answers.clientScopes = {
			before: said(claimsOf(before.json.access_token)),
			after: said(claimsOf(after.json.access_token))
		};
	}

	{
		const client = await freshClient(admin, 'note-audience');
		const said = (aud: unknown) => ({ aud, namesTheApi: [aud].flat().includes('my-api') });
		const before = await tokensFor(browser, demo, 'note-audience');
		await admin.call('POST', `${onClient(client)}/protocol-mappers/models`, {
			name: 'my-api',
			protocol: 'openid-connect',
			protocolMapper: 'oidc-audience-mapper',
			config: { 'included.custom.audience': 'my-api', 'access.token.claim': 'true' }
		});
		const after = await tokensFor(browser, demo, 'note-audience');
		answers.audience = {
			before: said(claimsOf(before.json.access_token).aud),
			after: said(claimsOf(after.json.access_token).aud)
		};
	}

	{
		const client = await freshClient(admin, 'note-dpop');
		const before = await tokensFor(browser, demo, 'note-dpop');
		await change(client, { attributes: { 'dpop.bound.access.tokens': 'true' } });
		const after = await tokensFor(browser, demo, 'note-dpop');
		answers.requireDpop = {
			before: { status: before.status, tokenType: before.json.token_type },
			after: { status: after.status, error: after.json.error }
		};
	}

	{
		const client = await freshClient(admin, 'note-lifespan');
		const before = await tokensFor(browser, demo, 'note-lifespan');
		await change(client, { attributes: { 'access.token.lifespan': '60' } });
		const after = await tokensFor(browser, demo, 'note-lifespan');
		answers.tokenLifespan = {
			before: { expiresIn: before.json.expires_in },
			after: { expiresIn: after.json.expires_in }
		};
	}

	{
		const issuerOf = async (realm: string) => {
			const answer = await fetch(`${KEYCLOAK}/realms/${realm}/.well-known/openid-configuration`);
			return ((await answer.json()) as { issuer: string }).issuer;
		};
		const [local, brokered] = [await issuerOf(LOCAL_REALM), await issuerOf(BROKERED_REALM)];
		answers.issuerPerRealm = {
			issuers: [local, brokered],
			realmsDiffer: local !== brokered,
			endsWithRealm: local.endsWith(`/realms/${LOCAL_REALM}`)
		};
	}

	return answers;
}

/** Whether the app can get the stored token, for a user who logs in for the first time now. */
async function storedTokenStatus(browser: Browser, demo: Demo, admin: Admin) {
	await admin.forgetBrokeredUsers();
	const { code } = await codeFor(browser, demo, BROKERED_REALM, CONFIDENTIAL_CLIENT);
	const result = await token(BROKERED_REALM, confidentialBody(code));
	const answer = await statusOf(brokerTokenUrl, {
		authorization: `Bearer ${result.json.access_token}`
	});
	return { status: answer.status, says: answer.body };
}

async function behindTheBrokeringNotes(browser: Browser, demo: Demo, admin: Admin) {
	const onProvider = `/realms/${BROKERED_REALM}/identity-provider/instances/${UPSTREAM_REALM}`;
	const provider = await admin.call<object>('GET', onProvider);
	const setProvider = (changes: object) =>
		admin.call('PUT', onProvider, { ...provider, ...changes });

	const before = await storedTokenStatus(browser, demo, admin);
	await setProvider({ storeToken: false });
	const storeOff = await storedTokenStatus(browser, demo, admin);
	await setProvider({ addReadTokenRoleOnCreate: false });
	await setProvider({ storeToken: true, addReadTokenRoleOnCreate: false });
	const readableOff = await storedTokenStatus(browser, demo, admin);
	await setProvider({});

	// Last, because it changes the login for everything after it, and the server stops after this.
	const authorize = async () => {
		const answer = await fetch(
			`${KEYCLOAK}/realms/${BROKERED_REALM}/protocol/openid-connect/auth?${new URLSearchParams({
				response_type: 'code',
				client_id: CONFIDENTIAL_CLIENT,
				redirect_uri: REDIRECT_URI,
				state: random()
			})}`,
			{ redirect: 'manual' }
		);
		const location = answer.headers.get('location') ?? '';
		return { status: answer.status, redirects: location.includes(`/broker/${UPSTREAM_REALM}/`) };
	};
	const redirecting = await authorize();
	const executions = await admin.call<{ providerId?: string; authenticationConfig?: string }[]>(
		'GET',
		`/realms/${BROKERED_REALM}/authentication/flows/browser/executions`
	);
	const redirector = executions.find((e) => e.providerId === 'identity-provider-redirector');
	await admin.call(
		'DELETE',
		`/realms/${BROKERED_REALM}/authentication/config/${redirector?.authenticationConfig}`
	);
	const notRedirecting = await authorize();

	return {
		storeTokens: { before, after: storeOff },
		storedTokensReadable: { before, after: readableOff },
		brokerRedirector: { before: redirecting, after: notRedirecting }
	};
}

export async function questionsWithApiV1(browser: Browser, demo: Demo, admin: Admin) {
	const answers: Record<string, unknown> = {
		...(await behindTheNotes(browser, demo, admin))
	};

	// Does Keycloak ever ask for a DPoP nonce?
	{
		const proof = proofKey();
		const { code } = await codeFor(browser, demo, LOCAL_REALM, CONFIDENTIAL_CLIENT, {
			scope: 'openid'
		});
		const url = `${KEYCLOAK}/realms/${LOCAL_REALM}/protocol/openid-connect/token`;
		const result = await token(LOCAL_REALM, confidentialBody(code), { dpop: proof('POST', url) });
		answers.dpopNonce = {
			tokenStatus: result.status,
			tokenType: result.json.token_type,
			askedForNonce: result.status === 400 && result.json.error === 'use_dpop_nonce',
			dpopNonceHeader: result.nonce
		};

		// Does UserInfo take a DPoP-bound token the way the diagram shows?
		const accessToken = result.json.access_token;
		const userinfo = `${KEYCLOAK}/realms/${LOCAL_REALM}/protocol/openid-connect/userinfo`;
		answers.userinfoWithDpopToken = {
			withProof: await statusOf(userinfo, {
				authorization: `DPoP ${accessToken}`,
				dpop: proof('GET', userinfo, { ath: sha256(accessToken) })
			}),
			withoutProof: await statusOf(userinfo, { authorization: `DPoP ${accessToken}` }),
			asBearer: await statusOf(userinfo, { authorization: `Bearer ${accessToken}` })
		};
	}

	// Does API V1 take a DPoP-bound access token?
	{
		const { proof, accessToken, tokenType } = await dpopBoundBrokeredToken(browser, demo, admin);
		answers.apiV1WithDpopToken = {
			tokenType,
			asBearer: await statusOf(brokerTokenUrl, { authorization: `Bearer ${accessToken}` }),
			asDpop: await statusOf(brokerTokenUrl, {
				authorization: `DPoP ${accessToken}`,
				dpop: proof('GET', brokerTokenUrl, { ath: sha256(accessToken) })
			})
		};
	}

	// Is a public client without PKCE accepted?
	{
		const { code, landed } = await codeFor(browser, demo, LOCAL_REALM, PUBLIC_CLIENT);
		const result = code
			? await token(LOCAL_REALM, {
					grant_type: 'authorization_code',
					code,
					redirect_uri: REDIRECT_URI,
					client_id: PUBLIC_CLIENT
				})
			: null;
		const required = await codeFor(browser, demo, LOCAL_REALM, PKCE_CLIENT);
		answers.publicClientWithoutPkce = {
			byDefault: {
				gotCode: Boolean(code),
				tokenStatus: result?.status ?? null,
				landed: landed.split('?')[0]
			},
			withPkceRequiredOnTheClient: {
				gotCode: Boolean(required.code),
				landed: required.landed.split('&state')[0]
			}
		};
	}

	// What can someone do with a code they intercepted? Every try here is a code from a real login.
	{
		const verifier = random() + random();
		const pkce = { code_challenge: sha256(verifier), code_challenge_method: 'S256' };
		const attempt = async (clientId: string, extra: Record<string, string>, send: object) => {
			const { code } = await codeFor(browser, demo, LOCAL_REALM, clientId, extra);
			const body = { grant_type: 'authorization_code', code, redirect_uri: REDIRECT_URI };
			const tried = await token(LOCAL_REALM, { ...body, client_id: clientId, ...send });
			// What the real app would send next, with what it holds, once someone else has tried.
			const again = await token(LOCAL_REALM, {
				...body,
				client_id: clientId,
				...('code_challenge' in extra ? { code_verifier: verifier } : {}),
				...(clientId === CONFIDENTIAL_CLIENT ? { client_secret: CLIENT_SECRET } : {})
			});
			return {
				status: tried.status,
				error: tried.json.error ?? null,
				description: tried.json.error_description ?? null,
				gotTokens: 'access_token' in tried.json,
				theRealAppAfterwards: {
					status: again.status,
					description: again.json.error_description ?? null
				}
			};
		};
		const secret = { client_secret: CLIENT_SECRET };
		answers.interceptedCode = {
			publicWithoutPkce: await attempt(PUBLIC_CLIENT, {}, {}),
			publicWithPkceNoVerifier: await attempt(PUBLIC_CLIENT, pkce, {}),
			publicWithPkceWrongVerifier: await attempt(PUBLIC_CLIENT, pkce, {
				code_verifier: random() + random()
			}),
			publicWithPkceRightVerifier: await attempt(PUBLIC_CLIENT, pkce, { code_verifier: verifier }),
			confidentialNoPkceNoSecret: await attempt(CONFIDENTIAL_CLIENT, {}, {}),
			confidentialWithPkceSecretButNoVerifier: await attempt(CONFIDENTIAL_CLIENT, pkce, secret),
			confidentialWithPkceSecretButWrongVerifier: await attempt(CONFIDENTIAL_CLIENT, pkce, {
				...secret,
				code_verifier: random() + random()
			})
		};
	}

	// A wrong redirect URI, which is the most-viewed Keycloak question there is.
	{
		const bad = await fetch(
			`${KEYCLOAK}/realms/${LOCAL_REALM}/protocol/openid-connect/auth?${new URLSearchParams({
				response_type: 'code',
				client_id: CONFIDENTIAL_CLIENT,
				redirect_uri: `${APP}/wrong`,
				state: random()
			})}`,
			{ redirect: 'manual' }
		);
		const text = await bad.text();
		answers.wrongRedirectUri = {
			status: bad.status,
			location: bad.headers.get('location'),
			message: text.match(/Invalid parameter[^<]*/)?.[0] ?? null
		};
	}

	// What a default client gives without openid, which the OpenID Connect switch has to get right.
	{
		const { code } = await codeFor(browser, demo, LOCAL_REALM, CONFIDENTIAL_CLIENT);
		const result = await token(LOCAL_REALM, confidentialBody(code));
		const claims = JSON.parse(
			Buffer.from(result.json.access_token.split('.')[1], 'base64url').toString()
		);
		answers.withoutOpenid = {
			hasIdToken: 'id_token' in result.json,
			accessTokenAudience: claims.aud,
			accessTokenNamesTheUser: 'preferred_username' in claims,
			responseFields: Object.keys(result.json).sort(),
			userinfo: await statusOf(
				`${KEYCLOAK}/realms/${LOCAL_REALM}/protocol/openid-connect/userinfo`,
				{ authorization: `Bearer ${result.json.access_token}` }
			)
		};
	}

	Object.assign(answers, await behindTheBrokeringNotes(browser, demo, admin));
	return answers;
}

export async function questionsWithApiV2(browser: Browser, demo: Demo, admin: Admin) {
	const { proof, accessToken, tokenType } = await dpopBoundBrokeredToken(browser, demo, admin);
	const post = async (headers: Record<string, string>) =>
		outcome(
			await fetch(brokerTokenUrl, {
				method: 'POST',
				headers: {
					'content-type': 'application/x-www-form-urlencoded',
					accept: 'application/json',
					...headers
				},
				body: new URLSearchParams({
					client_id: CONFIDENTIAL_CLIENT,
					client_secret: CLIENT_SECRET,
					token: accessToken
				}).toString()
			})
		);

	// Whether this client may ask at all is a setting of the client.
	const asked = async () => {
		await admin.forgetBrokeredUsers();
		const { code } = await codeFor(browser, demo, BROKERED_REALM, CONFIDENTIAL_CLIENT);
		const result = await token(BROKERED_REALM, confidentialBody(code));
		const answer = await fetch(brokerTokenUrl, {
			method: 'POST',
			headers: {
				'content-type': 'application/x-www-form-urlencoded',
				accept: 'application/json'
			},
			body: new URLSearchParams({
				client_id: CONFIDENTIAL_CLIENT,
				client_secret: CLIENT_SECRET,
				token: result.json.access_token
			}).toString()
		});
		return outcome(answer);
	};
	const allowed = await asked();
	await admin.setClientAttributes(BROKERED_REALM, CONFIDENTIAL_CLIENT, {
		'external.token.enabled': 'false'
	});
	const notAllowed = await asked();
	await admin.setClientAttributes(BROKERED_REALM, CONFIDENTIAL_CLIENT, {
		'external.token.enabled': 'true'
	});

	return {
		allowExternalTokens: {
			before: { status: allowed.status },
			after: { status: notAllowed.status, says: notAllowed.body }
		},
		apiV2WithDpopToken: {
			tokenType,
			withoutProof: await post({}),
			withProof: await post({
				dpop: proof('POST', brokerTokenUrl, { ath: sha256(accessToken) })
			})
		},
		// The docs do not say whether enabling V2 turns V1 off.
		apiV1WhenV2IsEnabled: await statusOf(brokerTokenUrl, {
			authorization: `Bearer ${accessToken}`
		})
	};
}
