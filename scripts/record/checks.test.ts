import { generateKeyPairSync, sign, type KeyObject } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { accessTokenProblem, idTokenProblem, proofProblem, sha256, type Jwk } from './checks.ts';

const ISSUER = 'http://idp.test/realms/demo';
const API = 'http://api.test/resource';
const NOW = 1_800_000_000_000;
const seconds = NOW / 1000;

const b64 = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');

function issuer(kid: string) {
	const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
	const jwk = { ...publicKey.export({ format: 'jwk' }), kid } as Jwk;
	const token = (claims: object, header: object = {}) => {
		const signing = `${b64({ alg: 'RS256', kid, ...header })}.${b64(claims)}`;
		return `${signing}.${sign('sha256', Buffer.from(signing), privateKey).toString('base64url')}`;
	};
	return { jwk, token };
}

function proofKey() {
	const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
	const { crv, kty, x, y } = publicKey.export({ format: 'jwk' }) as Record<string, string>;
	const jwk = { crv, kty, x, y };
	return { thumbprint: sha256(JSON.stringify(jwk)), proof: proofWith(jwk, privateKey) };
}

const proofWith =
	(jwk: object, key: KeyObject) =>
	(claims: object, header: object = {}) => {
		const signing = `${b64({ typ: 'dpop+jwt', alg: 'ES256', jwk, ...header })}.${b64(claims)}`;
		const signature = sign('sha256', Buffer.from(signing), { key, dsaEncoding: 'ieee-p1363' });
		return `${signing}.${signature.toString('base64url')}`;
	};

const server = issuer('one');
const stranger = issuer('two');

describe('what the demo app checks in an ID token', () => {
	const claims = {
		iss: ISSUER,
		aud: 'demo-app',
		exp: seconds + 60,
		nonce: 'this-login'
	};
	const problem = (token: string | undefined) =>
		idTokenProblem(
			token,
			{ issuer: ISSUER, clientId: 'demo-app', nonce: 'this-login', keys: [server.jwk] },
			NOW
		);

	it('takes a good one', () => {
		expect(problem(server.token(claims))).toBeNull();
	});

	it('refuses one that is missing or is not a token', () => {
		expect(problem(undefined)).toBe('not a token');
		expect(problem('nonsense')).toBe('not a token');
	});

	it('refuses one signed by someone else, even with a key id it knows', () => {
		expect(problem(stranger.token(claims))).toBe('signed with a key the issuer does not list');
		expect(problem(stranger.token(claims, { kid: 'one' }))).toBe('bad signature');
	});

	it('refuses one that says the wrong thing', () => {
		expect(problem(server.token({ ...claims, iss: 'http://elsewhere.test' }))).toBe(
			'from another issuer'
		);
		expect(problem(server.token({ ...claims, aud: 'another-app' }))).toBe('not for this app');
		expect(problem(server.token({ ...claims, exp: seconds - 1 }))).toBe('expired');
		expect(problem(server.token({ ...claims, nonce: 'another-login' }))).toBe('from another login');
	});

	it('takes an audience that is one of several', () => {
		expect(problem(server.token({ ...claims, aud: ['another-app', 'demo-app'] }))).toBeNull();
	});
});

describe('what the demo API checks', () => {
	const claims = { iss: ISSUER, aud: 'account', exp: seconds + 60 };
	const trust = () => ({
		issuers: [ISSUER],
		audience: 'account',
		keysOf: async () => [server.jwk],
		seenProofs: new Set<string>()
	});
	const ask = (authorization?: string, dpop?: string, trusted = trust()) =>
		accessTokenProblem({ authorization, dpop, method: 'GET', url: API }, trusted, NOW);

	it('answers a good bearer token', async () => {
		expect(await ask(`Bearer ${server.token(claims)}`)).toBeNull();
	});

	it('refuses no token at all', async () => {
		expect(await ask()).toBe('no token');
		expect(await ask('Bearer nonsense')).toBe('no token');
	});

	it('does not take the word of a token about who issued it', async () => {
		const token = server.token({ ...claims, iss: 'http://elsewhere.test' });
		expect(await ask(`Bearer ${token}`)).toBe('from an issuer this API does not trust');
	});

	it('refuses a token someone else signed', async () => {
		expect(await ask(`Bearer ${stranger.token(claims)}`)).toBe(
			'signed with a key the issuer does not list'
		);
		expect(await ask(`Bearer ${stranger.token(claims, { kid: 'one' })}`)).toBe('bad signature');
	});

	it('refuses an expired token, and one for someone else', async () => {
		expect(await ask(`Bearer ${server.token({ ...claims, exp: seconds - 1 })}`)).toBe('expired');
		expect(await ask(`Bearer ${server.token({ ...claims, aud: 'another-api' })}`)).toBe(
			'not for this API'
		);
	});

	describe('with a token tied to a key', () => {
		const key = proofKey();
		const token = server.token({ ...claims, cnf: { jkt: key.thumbprint } });
		const good = {
			jti: 'one',
			htm: 'GET',
			htu: API,
			iat: seconds,
			ath: sha256(token)
		};

		it('answers it with a good proof', async () => {
			expect(await ask(`DPoP ${token}`, key.proof(good))).toBeNull();
		});

		it('refuses it sent as a plain bearer token, or with no proof', async () => {
			expect(await ask(`Bearer ${token}`)).toBe('tied to a key, and sent without it');
			expect(await ask(`DPoP ${token}`)).toBe('no proof');
		});

		it('refuses a proof from another key', async () => {
			expect(await ask(`DPoP ${token}`, proofKey().proof(good))).toBe('proof from the wrong key');
		});

		it('refuses the right public key with a signature it did not make', async () => {
			const [header] = key.proof(good).split('.');
			const [, payload, signature] = proofKey().proof(good).split('.');
			expect(await ask(`DPoP ${token}`, `${header}.${payload}.${signature}`)).toBe(
				'bad proof signature'
			);
		});

		it('refuses a proof made for something else', async () => {
			expect(await ask(`DPoP ${token}`, key.proof({ ...good, htm: 'POST' }))).toBe(
				'proof for another method'
			);
			expect(await ask(`DPoP ${token}`, key.proof({ ...good, htu: 'http://x.test/' }))).toBe(
				'proof for another address'
			);
			expect(await ask(`DPoP ${token}`, key.proof({ ...good, ath: sha256('other') }))).toBe(
				'proof for another token'
			);
		});

		it('refuses a proof made long ago', async () => {
			expect(await ask(`DPoP ${token}`, key.proof({ ...good, iat: seconds - 3600 }))).toBe(
				'proof at the wrong time'
			);
		});

		it('refuses a proof it has seen before', async () => {
			const trusted = trust();
			const proof = key.proof(good);
			expect(await ask(`DPoP ${token}`, proof, trusted)).toBeNull();
			expect(await ask(`DPoP ${token}`, proof, trusted)).toBe('proof used before');
		});
	});

	it('refuses a token that is not tied to a key, sent as if it were', async () => {
		expect(await ask(`DPoP ${server.token(claims)}`)).toBe('not a DPoP token');
	});
});

describe('a proof on its own', () => {
	it('is refused when its header does not say what it is', () => {
		const key = proofKey();
		const proof = key.proof({}, { typ: 'JWT' });
		expect(
			proofProblem(
				proof,
				{ method: 'GET', url: API, token: 't', thumbprint: key.thumbprint, seen: new Set() },
				NOW
			)
		).toBe('not a proof');
	});
});
