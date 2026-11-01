import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { authorizationCode as flow } from '#lib/flow/authorization-code.ts';
import { authorizationCodeSetup as setup } from '#lib/flow/authorization-code-setup.ts';
import { evaluate, type DiagramDef } from '#lib/flow/model.ts';
import {
	allValidSettings,
	defaultSettings,
	settingDefs,
	settingIds,
	type Settings
} from '#lib/flow/settings.ts';
import { artifacts, channels } from '#lib/flow/vocabulary.ts';
import { noteDefs, notesFor } from '#lib/keycloak/notes.ts';
import { isVendorSource } from '#lib/sources/sources.ts';

const answers: Record<string, unknown> = JSON.parse(
	readFileSync('static/recordings/authorization-code/questions.json', 'utf8')
).answers;

const allSteps = [...flow.steps, ...setup.steps].map((step) => step.id);

describe('the protocol layer', () => {
	const inEveryCombination = (diagram: DiagramDef) =>
		allValidSettings().flatMap((settings) => {
			const view = evaluate(diagram, settings);
			return [
				diagram.title,
				diagram.summary,
				diagram.intro,
				...view.lifelines.flatMap((line) => [
					line.name,
					line.role,
					line.plainName,
					line.plainRole,
					line.concept
				]),
				...view.groups.flatMap((group) => [group.label, group.plain]),
				...view.steps.flatMap((step) => [
					step.label,
					step.plain,
					step.concept,
					step.specOnly ?? '',
					step.pitfall?.title ?? '',
					step.pitfall?.text ?? '',
					step.inPractice ?? '',
					...step.links.map((link) => link.text),
					...step.fields.flatMap((field) => [field.name, field.note ?? ''])
				])
			];
		});

	it.each([
		['the user flow', flow],
		['setup', setup]
	] as const)('says nothing about Keycloak in %s', (_, diagram) => {
		const said = [...new Set(inEveryCombination(diagram))];
		expect(said.filter((text) => /keycloak/i.test(text))).toEqual([]);
	});

	it('says nothing about Keycloak in the settings', () => {
		const said = settingIds.flatMap((id) => {
			const def = settingDefs[id];
			return [
				def.label,
				def.summary,
				def.why,
				def.simple?.label ?? '',
				def.simple?.summary ?? '',
				...def.sources.filter((ref) => !isVendorSource(ref.source)).map((ref) => ref.why)
			];
		});
		expect(said.filter((text) => /keycloak/i.test(text))).toEqual([]);
	});

	it('says nothing about Keycloak in what it calls things', () => {
		const said = [...Object.values(artifacts), ...Object.values(channels)].flatMap((entry) =>
			Object.values(entry)
		);
		expect(said.filter((text) => /keycloak/i.test(text))).toEqual([]);
	});
});

describe('the notes', () => {
	it('have unique IDs, on steps that exist', () => {
		const ids = noteDefs.map((note) => note.id);
		expect(new Set(ids).size).toBe(ids.length);
		for (const note of noteDefs) {
			for (const step of note.steps) expect(allSteps, note.id).toContain(step);
		}
	});

	it('cover what the first version promised', () => {
		const titles = noteDefs.map((note) => note.title);
		for (const title of [
			'Valid redirect URIs',
			'Client scopes',
			'Client authentication',
			'Stored tokens readable',
			'Allow retrieve external tokens'
		]) {
			expect(titles).toContain(title);
		}
		expect(noteDefs.map((note) => note.serverOption)).toContain(
			'--features=identity-brokering-api:v2'
		);
	});

	it('all have words, in every combination they appear in', () => {
		for (const settings of allValidSettings()) {
			for (const step of allSteps) {
				for (const note of notesFor('authorization-code', step, settings)) {
					expect(note.text.length, note.id).toBeGreaterThan(20);
				}
			}
		}
	});

	it('follow the settings', () => {
		const ids = (step: string, settings: Partial<Settings>) =>
			notesFor('authorization-code', step, { ...defaultSettings, ...settings }).map(
				(note) => note.id
			);
		expect(ids('token-request', {})).not.toContain('require-dpop');
		expect(ids('token-request', { binding: 'dpop' })).toContain('require-dpop');
		expect(ids('retrieve-upstream-token', { broker: true, upstreamTokens: 'v1' })).toContain(
			'stored-tokens-readable'
		);
		expect(ids('retrieve-upstream-token', { broker: true, upstreamTokens: 'v2' })).toEqual(
			expect.arrayContaining(['allow-external-tokens', 'brokering-api-flags'])
		);
	});

	it('change their words with the settings where they have to', () => {
		const text = (settings: Partial<Settings>) =>
			notesFor('authorization-code', 'token-request', { ...defaultSettings, ...settings }).find(
				(note) => note.id === 'client-authentication'
			)?.text;
		expect(text({})).toMatch(/^On/);
		expect(text({ clientType: 'public' })).toMatch(/^Off/);
	});

	it('say what a real server did about stored tokens on API V2', () => {
		const text = notesFor('authorization-code', 'store-upstream-tokens', {
			...defaultSettings,
			broker: true,
			upstreamTokens: 'v2'
		}).find((note) => note.id === 'store-tokens')?.text;
		expect(text).toContain('Store token in session');
		expect(answers.storeTokensOnApiV2).toEqual({
			neither: 400,
			inSessionOnly: 200,
			inDatabaseOnly: 200,
			both: 200
		});
	});

	it('say what a real server did when Require PKCE is on for a client with a secret', () => {
		expect(answers.requirePkceWithASecret).toMatchObject({ gotCode: false });
	});

	describe.each(noteDefs.map((note) => [note.id, note] as const))('%s', (_, note) => {
		it('is backed by what a real server did', () => {
			expect(answers[note.backedBy.question]).toMatchObject(note.backedBy.shows);
		});

		it('says changing the setting changes the behaviour, and it does', () => {
			const { before, after } = note.backedBy.shows as { before?: unknown; after?: unknown };
			if (before === undefined) return;
			expect(after).toBeDefined();
			expect(JSON.stringify(before)).not.toBe(JSON.stringify(after));
		});

		it('says where it is, and a real admin console has it there', () => {
			if (!note.place) {
				// Two are about what the server does, with nothing in the console to change it.
				expect(
					Boolean(note.serverOption) || ['no-dpop-nonce', 'code-used-twice'].includes(note.id)
				).toBe(true);
				return;
			}
			const seen = (answers.console as Record<string, { missing: string[] }>)[note.id];
			expect(seen, 'never looked for in a real console').toBeDefined();
			expect(seen.missing).toEqual([]);
			expect(note.place.path.length).toBeGreaterThan(1);
		});
	});
});

describe('what a note says about a stolen code', () => {
	const noteFor = (settings: Partial<Settings>) =>
		notesFor('authorization-code', 'attacker-token-response', {
			...defaultSettings,
			attacker: true,
			...settings
		}).find((note) => note.id === 'intercepted-code')?.text;

	it('says what the server did to a public client with PKCE', () => {
		expect(noteFor({ clientType: 'public', pkce: true })).toContain('400 invalid_grant');
	});

	it('says the code survives on a client with a secret, with or without PKCE', () => {
		for (const pkce of [true, false]) {
			const text = noteFor({ clientType: 'confidential', pkce });
			expect(text).toContain('401');
			expect(text).toContain('still good');
			expect(text).not.toContain('400');
		}
	});
});
