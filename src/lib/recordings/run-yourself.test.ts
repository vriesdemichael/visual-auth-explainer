import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { defaultSettings } from '#lib/flow/settings.ts';
import type { Recording } from '#lib/recordings/format.ts';
import { recordedIndex } from '#lib/recordings/known.ts';
import {
	CHALLENGE,
	CLIENT_SECRET,
	CONFIDENTIAL_CLIENT,
	REDIRECT_URI,
	realmFor,
	runYourself,
	USERNAME,
	VERIFIER,
	type AtHome
} from '#lib/recordings/run-yourself.ts';

const commands = (settings: Partial<AtHome> = {}) =>
	runYourself({ ...defaultSettings, ...settings }, recordedIndex.keycloak);
const oauth = JSON.parse(
	readFileSync('static/recordings/authorization-code/oauth.json', 'utf8')
) as Recording;
const sent = (step: string) => oauth.messages.find((message) => message.step === step)!;

describe('what someone can run at home', () => {
	it('is the server the recordings came from', () => {
		expect(commands().start).toContain(`quay.io/keycloak/keycloak:${recordedIndex.keycloak}`);
		expect(oauth.keycloak).toBe(recordedIndex.keycloak);
	});

	it('uses the names and addresses the recording does', () => {
		const url = new URL(sent('authorize').url!);
		const login = new URL(commands().login);
		expect(login.origin + login.pathname).toBe(url.origin + url.pathname);
		expect(login.searchParams.get('client_id')).toBe(url.searchParams.get('client_id'));
		expect(login.searchParams.get('redirect_uri')).toBe(url.searchParams.get('redirect_uri'));
		expect(url.searchParams.get('redirect_uri')).toBe(REDIRECT_URI);
	});

	it('uses the secret the recording does', () => {
		const basic = sent('token-request').headers.authorization.split(' ')[1];
		expect(atob(basic)).toBe(`${CONFIDENTIAL_CLIENT}:${CLIENT_SECRET}`);
		expect(commands().trade).toContain(`-u '${CONFIDENTIAL_CLIENT}:${CLIENT_SECRET}'`);
		expect(commands().trade.split('?')[0]).toContain(sent('token-request').url);
	});

	it('logs in as the user the recording does', () => {
		expect(sent('submit-credentials').body).toMatchObject({ username: USERNAME });
		expect(realmFor(defaultSettings).users[0].username).toBe(USERNAME);
	});

	it('writes valid realm JSON into the command', () => {
		const inside = commands().start.split(`<<'EOF'\n`)[1].split('\nEOF')[0];
		expect(JSON.parse(inside)).toEqual(realmFor(defaultSettings));
	});
});

describe('the settings on screen', () => {
	it('take the secret away from an app that has none', () => {
		const { trade } = commands({ clientType: 'public' });
		expect(trade).not.toContain('-u ');
		expect(trade).toContain(`client_id=${CONFIDENTIAL_CLIENT}`);
		const [client] = realmFor({ ...defaultSettings, clientType: 'public' }).clients;
		expect(client).toMatchObject({ publicClient: true });
		expect(client).not.toHaveProperty('secret');
	});

	it('add the challenge and the verifier for PKCE', () => {
		const { login, trade } = commands({ pkce: true });
		expect(new URL(login).searchParams.get('code_challenge')).toBe(CHALLENGE);
		expect(trade).toContain(`code_verifier=${VERIFIER}`);
		expect(commands().login).not.toContain('code_challenge');
		expect(commands().trade).not.toContain('code_verifier');
	});

	it('use the pair from the spec, whose challenge really is that verifier', async () => {
		const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(VERIFIER));
		const made = btoa(String.fromCharCode(...new Uint8Array(digest)))
			.replaceAll('+', '-')
			.replaceAll('/', '_')
			.replaceAll('=', '');
		expect(made).toBe(CHALLENGE);
	});

	it('ask who logged in only with OpenID Connect', () => {
		expect(commands().who).toBeNull();
		expect(new URL(commands().login).searchParams.has('scope')).toBe(false);
		expect(commands({ oidc: true }).who).toContain('/userinfo');
		expect(new URL(commands({ oidc: true }).login).searchParams.get('scope')).toBe('openid');
	});

	it('ask the user to agree when that is on', () => {
		const [client] = realmFor({ ...defaultSettings, consent: true }).clients;
		expect(client).toMatchObject({ consentRequired: true });
		expect(realmFor(defaultSettings).clients[0]).not.toHaveProperty('consentRequired');
	});
});
