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

export async function questionsWithApiV1(browser: Browser, demo: Demo, admin: Admin) {
	const answers: Record<string, unknown> = {};

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

	return {
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
