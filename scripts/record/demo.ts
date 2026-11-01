// A real little app and API, doing what the diagram says an app and an API do, and writing down
// everything that crosses the wire while they do it.
import {
	createHash,
	createPublicKey,
	generateKeyPairSync,
	randomBytes,
	sign,
	verify,
	type KeyObject
} from 'node:crypto';
import { createServer, type IncomingMessage, type Server } from 'node:http';
import type { Settings } from '#lib/flow/settings.ts';
import type { RecordedMessage } from '#lib/recordings/format.ts';
import {
	API,
	APP,
	CLIENT_SECRET,
	CONFIDENTIAL_CLIENT,
	KEYCLOAK,
	PROXY_PORT,
	REDIRECT_URI,
	UPSTREAM_REALM
} from './keycloak.ts';

/** The browser reports what it did a moment later, so what follows has to wait to stay in order. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 250));

const random = () => randomBytes(16).toString('base64url');
const b64 = (value: string | Buffer) => Buffer.from(value).toString('base64url');
const sha256 = (value: string) => createHash('sha256').update(value).digest('base64url');

const KEPT_REQUEST_HEADERS = ['authorization', 'content-type', 'dpop', 'accept'];
const KEPT_RESPONSE_HEADERS = ['location', 'content-type', 'www-authenticate', 'dpop-nonce'];

function kept(headers: Headers | Record<string, string>, names: string[]) {
	const get = (name: string) =>
		headers instanceof Headers ? headers.get(name) : (headers[name] ?? null);
	return Object.fromEntries(
		names.flatMap((name) => {
			const value = get(name);
			return value ? [[name, value]] : [];
		})
	);
}

export function parseBody(contentType: string | null, text: string): Partial<RecordedMessage> {
	// The browser does not hand over a page it navigated to, and what is on it is not the protocol.
	if (contentType?.includes('html')) return { bodyNote: 'An HTML page' };
	if (!text) return {};
	if (contentType?.includes('json')) return { body: JSON.parse(text) };
	if (contentType?.includes('x-www-form-urlencoded')) {
		return { body: Object.fromEntries(new URLSearchParams(text)) };
	}
	return { body: text };
}

export function requestMessage(
	step: string | null,
	method: string,
	url: string,
	headers: Headers | Record<string, string>,
	body = ''
): RecordedMessage {
	const shown = kept(headers, KEPT_REQUEST_HEADERS);
	// A browser that follows a redirect after a form still reports the form's type on the next GET.
	if (!body) delete shown['content-type'];
	return {
		step,
		direction: 'request',
		method,
		url,
		headers: shown,
		...parseBody(shown['content-type'] ?? null, body)
	};
}

export function responseMessage(
	step: string | null,
	status: number,
	headers: Headers | Record<string, string>,
	body = ''
): RecordedMessage {
	const shown = kept(headers, KEPT_RESPONSE_HEADERS);
	return {
		step,
		direction: 'response',
		status,
		headers: shown,
		...parseBody(shown['content-type'] ?? null, body)
	};
}

export interface Run {
	settings: Settings;
	realm: string;
	clientId: string;
	clientSecret: string | null;
	messages: RecordedMessage[];
}

/** The app's DPoP key, made once per run, which is the "Generate a key pair" step. */
class ProofKey {
	#privateKey: KeyObject;
	readonly jwk: Record<string, string>;
	readonly thumbprint: string;

	constructor() {
		const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
		this.#privateKey = privateKey;
		const { kty, crv, x, y } = publicKey.export({ format: 'jwk' }) as Record<string, string>;
		this.jwk = { crv, kty, x, y };
		this.thumbprint = sha256(JSON.stringify(this.jwk));
	}

	proof(method: string, url: string, extra: Record<string, string> = {}) {
		const header = { typ: 'dpop+jwt', alg: 'ES256', jwk: this.jwk };
		const payload = {
			jti: random(),
			htm: method,
			htu: url.split('?')[0],
			iat: Math.floor(Date.now() / 1000),
			...extra
		};
		const signing = `${b64(JSON.stringify(header))}.${b64(JSON.stringify(payload))}`;
		const signature = sign('sha256', Buffer.from(signing), {
			key: this.#privateKey,
			dsaEncoding: 'ieee-p1363'
		});
		return `${signing}.${signature.toString('base64url')}`;
	}
}

const listen = (server: Server, url: string) =>
	new Promise<void>((resolve) => server.listen(Number(new URL(url).port), '0.0.0.0', resolve));

function readBody(request: IncomingMessage) {
	return new Promise<string>((resolve) => {
		const chunks: Buffer[] = [];
		request.on('data', (chunk) => chunks.push(chunk));
		request.on('end', () => resolve(Buffer.concat(chunks).toString()));
	});
}

/** A request the app makes itself, recorded as two messages. */
async function call(
	run: Run,
	steps: [string | null, string | null],
	method: string,
	url: string,
	headers: Record<string, string> = {},
	body?: Record<string, string>
) {
	const payload = body ? new URLSearchParams(body).toString() : '';
	const sent = body ? { ...headers, 'content-type': 'application/x-www-form-urlencoded' } : headers;
	run.messages.push(requestMessage(steps[0], method, url, sent, payload));
	const response = await fetch(url, {
		method,
		headers: sent,
		body: body ? payload : undefined,
		redirect: 'manual'
	});
	const text = await response.text();
	run.messages.push(responseMessage(steps[1], response.status, response.headers, text));
	return { status: response.status, text, headers: response.headers };
}

const jsonOf = <T>(text: string) => JSON.parse(text) as T;

interface Tokens {
	access_token: string;
	id_token?: string;
	token_type: string;
	error?: string;
}

export class Demo {
	current: Run | null = null;
	/** The code from a login that was not part of a run, for trying things out with it. */
	lastCode = '';
	#servers: Server[] = [];
	#state = '';
	#key: ProofKey | null = null;
	#verifier: string | null = null;

	get #run() {
		if (!this.current) throw new Error('No run in progress');
		return this.current;
	}

	#endpoint(path: string) {
		return `${KEYCLOAK}/realms/${this.#run.realm}/protocol/openid-connect/${path}`;
	}

	/** Bearer or DPoP, whichever the setting says. A proof is tied to the token it is sent with. */
	#authorization(method: string, url: string, token: string): Record<string, string> {
		if (!this.#key) return { authorization: `Bearer ${token}` };
		return {
			authorization: `DPoP ${token}`,
			dpop: this.#key.proof(method, url, { ath: sha256(token) })
		};
	}

	async #tokenRequest(
		code: string,
		nonce?: string,
		steps: [string, string] = ['token-request', 'token-response']
	) {
		const run = this.#run;
		const url = this.#endpoint('token');
		const body: Record<string, string> = {
			grant_type: 'authorization_code',
			code,
			redirect_uri: REDIRECT_URI,
			client_id: run.clientId
		};
		if (run.clientSecret) body.client_secret = run.clientSecret;
		if (this.#verifier) body.code_verifier = this.#verifier;
		const headers: Record<string, string> = this.#key
			? { dpop: this.#key.proof('POST', url, nonce ? { nonce } : {}) }
			: {};
		return call(run, steps, 'POST', url, headers, body);
	}

	async #afterLogin(code: string) {
		const run = this.#run;
		const { settings } = run;

		let result = await this.#tokenRequest(code);
		// A server that wants a nonce says so here. If it ever does, this records the retry as well.
		const challenge = result.headers.get('dpop-nonce');
		if (result.status === 400 && challenge) {
			const last = run.messages[run.messages.length - 1];
			last.step = 'nonce-challenge';
			result = await this.#tokenRequest(code, challenge, ['token-request-retry', 'token-response']);
		}
		const tokens = jsonOf<Tokens>(result.text);
		if (!tokens.access_token) throw new Error(`No token: ${result.text}`);

		if (settings.oidc) {
			const url = this.#endpoint('userinfo');
			await call(
				run,
				['userinfo-request', 'userinfo-response'],
				'GET',
				url,
				this.#authorization('GET', url, tokens.access_token)
			);
		}

		const resource = `${API}/resource`;
		await call(
			run,
			['api-request', 'api-response'],
			'GET',
			resource,
			this.#authorization('GET', resource, tokens.access_token)
		);

		if (settings.upstreamTokens !== 'off') await this.#storedToken(tokens.access_token);
	}

	async #storedToken(accessToken: string) {
		const run = this.#run;
		const url = `${KEYCLOAK}/realms/${run.realm}/broker/${UPSTREAM_REALM}/token`;
		const steps: [string, string] = ['retrieve-upstream-token', 'upstream-token'];
		const result =
			run.settings.upstreamTokens === 'v2'
				? await call(
						run,
						steps,
						'POST',
						url,
						{ accept: 'application/json' },
						{
							client_id: CONFIDENTIAL_CLIENT,
							client_secret: CLIENT_SECRET,
							token: accessToken
						}
					)
				: await call(run, steps, 'GET', url, this.#authorization('GET', url, accessToken));
		if (result.status !== 200) return;

		// API V1 answers in whichever form the upstream used, which is JSON from another Keycloak.
		const upstream = jsonOf<{ access_token: string }>(result.text).access_token;
		const userinfo = `${KEYCLOAK}/realms/${UPSTREAM_REALM}/protocol/openid-connect/userinfo`;
		await call(run, ['call-upstream', null], 'GET', userinfo, {
			authorization: `Bearer ${upstream}`
		});
	}

	async start() {
		const app = createServer(async (request, response) => {
			const url = new URL(request.url ?? '/', APP);
			if (url.pathname === '/') {
				const run = this.#run;
				const { settings } = run;
				this.#state = random();
				this.#key = settings.binding === 'dpop' ? new ProofKey() : null;
				this.#verifier = settings.pkce ? random() + random() : null;
				const query = new URLSearchParams({
					response_type: 'code',
					client_id: run.clientId,
					redirect_uri: REDIRECT_URI,
					state: this.#state
				});
				if (settings.oidc) {
					query.set('scope', 'openid');
					query.set('nonce', random());
				}
				if (this.#key) query.set('dpop_jkt', this.#key.thumbprint);
				if (this.#verifier) {
					query.set('code_challenge', sha256(this.#verifier));
					query.set('code_challenge_method', 'S256');
				}
				response.writeHead(302, { location: `${this.#endpoint('auth')}?${query}` });
				response.end();
				return;
			}
			if (url.pathname === '/callback') {
				if (!this.current) {
					this.lastCode = url.searchParams.get('code') ?? '';
					response.writeHead(200, { 'content-type': 'text/html' });
					response.end('<h1>Done</h1>');
					return;
				}
				try {
					await settle();
					await this.#afterLogin(url.searchParams.get('code') ?? '');
					response.writeHead(200, { 'content-type': 'text/html' });
					response.end('<h1>Logged in</h1>');
				} catch (error) {
					response.writeHead(500, { 'content-type': 'text/html' });
					response.end(`<h1>Failed</h1><pre>${String(error)}</pre>`);
				}
				return;
			}
			response.writeHead(404);
			response.end();
		});

		// Checks the token the way a real API would, so a 200 from it means something.
		const api = createServer(async (request, response) => {
			const [scheme, token] = (request.headers.authorization ?? '').split(' ');
			const fail = (status: number, message: string) => {
				response.writeHead(status, {
					'content-type': 'application/json',
					'www-authenticate': `${scheme || 'Bearer'} error="invalid_token"`
				});
				response.end(JSON.stringify({ error: message }));
			};
			try {
				const [header, payload, signature] = token.split('.');
				const { kid } = JSON.parse(Buffer.from(header, 'base64url').toString());
				const claims = JSON.parse(Buffer.from(payload, 'base64url').toString());
				const { keys } = (await (
					await fetch(`${claims.iss}/protocol/openid-connect/certs`)
				).json()) as {
					keys: { kid: string }[];
				};
				const key = createPublicKey({
					key: keys.find((candidate) => candidate.kid === kid) as never,
					format: 'jwk'
				});
				const valid = verify(
					'sha256',
					Buffer.from(`${header}.${payload}`),
					key,
					Buffer.from(signature, 'base64url')
				);
				if (!valid) return fail(401, 'bad signature');
				if (claims.exp * 1000 < Date.now()) return fail(401, 'expired');
				if (claims.cnf?.jkt) {
					const proof = String(request.headers.dpop ?? '');
					const proofHeader = JSON.parse(Buffer.from(proof.split('.')[0], 'base64url').toString());
					const { crv, kty, x, y } = proofHeader.jwk;
					const thumbprint = sha256(JSON.stringify({ crv, kty, x, y }));
					if (thumbprint !== claims.cnf.jkt) return fail(401, 'proof from the wrong key');
				}
				response.writeHead(200, { 'content-type': 'application/json' });
				response.end(JSON.stringify({ resource: 'something only this user may see' }));
			} catch (error) {
				fail(401, String(error));
			}
		});

		// Keycloak's calls to the upstream IdP pass through here on their way to the same Keycloak.
		const proxy = createServer(async (request, response) => {
			const body = await readBody(request);
			const target = `${KEYCLOAK}${request.url}`;
			const isToken = request.url?.endsWith('/token');
			const headers: Record<string, string> = {};
			for (const name of ['authorization', 'content-type', 'accept']) {
				const value = request.headers[name];
				if (typeof value === 'string') headers[name] = value;
			}
			if (isToken && this.current) {
				await settle();
				this.current.messages.push(
					requestMessage('upstream-token-request', request.method ?? 'POST', target, headers, body)
				);
			}
			const answer = await fetch(target, {
				method: request.method,
				headers,
				body: body || undefined
			});
			const text = await answer.text();
			if (isToken && this.current) {
				this.current.messages.push(
					responseMessage('upstream-token-response', answer.status, answer.headers, text)
				);
			}
			response.writeHead(answer.status, {
				'content-type': answer.headers.get('content-type') ?? 'application/json'
			});
			response.end(text);
		});

		await listen(app, APP);
		await listen(api, API);
		await listen(proxy, `http://0.0.0.0:${PROXY_PORT}`);
		this.#servers = [app, api, proxy];
	}

	stop() {
		for (const server of this.#servers) server.close();
	}
}
