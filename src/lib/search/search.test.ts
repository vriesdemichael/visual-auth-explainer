import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { authorizationCodeBase as base } from '#lib/flow/index.ts';
import { parseState } from '#lib/flow/state.ts';
import { evaluate } from '#lib/flow/model.ts';
import type { Recording } from '#lib/recordings/format.ts';
import { knownErrors } from '#lib/search/errors.ts';
import { search } from '#lib/search/search.ts';

const FOLDER = 'static/recordings/authorization-code';
const files = readdirSync(FOLDER).filter((file) => file !== 'questions.json');
const recordings: Recording[] = files.map((file) =>
	JSON.parse(readFileSync(`${FOLDER}/${file}`, 'utf8'))
);
const questions = readFileSync(`${FOLDER}/questions.json`, 'utf8');

const first = (query: string) => search(query).results[0];

describe('what people bring', () => {
	it.each([
		['SSO', 'word', 'Single sign-on'],
		['single sign-on', 'word', 'Single sign-on'],
		['JWT', 'word', 'JWT'],
		['jwks', 'step', undefined],
		['issuer', 'word', 'Issuer'],
		['PKCE', 'word', 'PKCE'],
		['refresh token', 'word', 'Refresh token'],
		['logout', 'word', 'Logging out'],
		['cookie', 'word', 'Session'],
		['expired', 'step', undefined],
		['401', 'note', undefined],
		['403', 'note', undefined],
		['invalid_grant', 'error', 'invalid_grant'],
		['invalid_client', 'error', undefined],
		['unauthorized_client', 'error', 'unauthorized_client'],
		['Invalid parameter: redirect_uri', 'error', 'Invalid parameter: redirect_uri'],
		['How does PKCE work', 'question', 'How does PKCE work?'],
		['steal the code', 'question', undefined]
	])('%s finds a %s', (query, kind, title) => {
		const results = search(query).results;
		expect(results.length, query).toBeGreaterThan(0);
		const match = results.find((result) => result.kind === kind);
		expect(match, query).toBeDefined();
		if (title) expect(match?.title).toBe(title);
	});

	it.each(['client credentials', 'Device flow', 'What about SAML?', 'token exchange'])(
		'%s is said not to be here yet, and is not guessed around',
		(query) => {
			const found = search(query);
			expect(found.notHereYet).not.toBeNull();
			expect(found.results).toEqual([]);
		}
	);

	it('says nothing about something nobody could mean', () => {
		expect(search('xyzzy plugh').results).toEqual([]);
		expect(search('xyzzy plugh').notHereYet).toBeNull();
		expect(search(' ').results).toEqual([]);
	});
});

describe('a pasted error', () => {
	it('is found in the middle of a line', () => {
		const line =
			'2026-11-01 14:03:22,811 WARN [org.example.auth] (executor-3) id=8f3a2c1e error="invalid_grant" description="Code not valid" client=my-app';
		const results = search(line).results;
		expect(results[0].kind).toBe('error');
		expect(results.map((result) => result.title)).toContain('Code not valid');
	});

	it('finds the longest, so it is not just the short word inside it', () => {
		expect(first('error: PKCE verification failed: Code mismatch').title).toBe(
			'PKCE verification failed: Code mismatch'
		);
	});

	it('finds it in JSON too', () => {
		const pasted = '{"error":"invalid_request","error_description":"DPoP Proof missing"}';
		expect(search(pasted).results.map((result) => result.title)).toContain('DPoP Proof missing');
	});
});

describe('what a real server said', () => {
	const stated = new Set(
		recordings.flatMap((recording) =>
			recording.messages.flatMap((message) => {
				const body = message.body as Record<string, string> | undefined;
				return body && typeof body === 'object'
					? [body.error, body.error_description].filter(Boolean)
					: [];
			})
		)
	);

	it('is found, for every error in every recording', () => {
		expect(stated.size).toBeGreaterThan(2);
		for (const text of stated) {
			expect(first(text)?.kind, text).toBe('error');
			expect(first(text)?.title, text).toBe(text);
		}
	});

	it.each(knownErrors.map((known) => [known.text, known] as const))(
		'%s is something a real server said',
		(text) => {
			expect(questions + JSON.stringify(recordings)).toContain(text);
		}
	);

	it.each(knownErrors.map((known) => [known.text, known] as const))(
		'%s opens the state that shows it',
		(text, known) => {
			const result = first(text);
			const state = parseState(base, 'flow', result.query);
			expect(state.step).toBe(known.step);
			const view = evaluate(base.diagrams.flow, state.settings);
			expect(view.steps.some((step) => step.id === known.step)).toBe(true);
		}
	);

	it('opens the step the error was recorded on, where a recording has it', () => {
		for (const recording of recordings) {
			for (const message of recording.messages) {
				const body = message.body as Record<string, string> | undefined;
				const said = body?.error_description;
				if (!said || !message.step) continue;
				const known = knownErrors.find((candidate) => candidate.text === said);
				expect(known, said).toBeDefined();
				// Each error is recorded on the steps a real server said it on, and it opens one of those.
				const recordedOn = recordings.flatMap((other) =>
					other.messages
						.filter(
							(candidate) =>
								(candidate.body as Record<string, string> | undefined)?.error_description === said
						)
						.map((candidate) => candidate.step)
				);
				expect(recordedOn, said).toContain(known?.step);
			}
		}
	});
});

describe('every result', () => {
	it('opens a real state', () => {
		for (const query of ['token', 'code', 'secret', 'redirect', 'provider', 'browser', 'scope']) {
			for (const result of search(query).results) {
				if (result.kind === 'question') continue;
				const diagram = result.view === 'setup' ? 'setup' : 'flow';
				const state = parseState(base, diagram, result.query);
				const view = evaluate(base.diagrams[diagram], state.settings);
				expect(view.steps.some((step) => step.id === state.step)).toBe(true);
			}
		}
	});

	it('are few enough to read', () => {
		expect(search('token').results.length).toBeLessThanOrEqual(8);
	});
});
