import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { authorizationCodeBase as base, presets } from '#lib/flow/index.ts';
import { evaluate, type Field, type FlowView, type Step } from '#lib/flow/model.ts';
import { allValidSettings, defaultSettings, normalize } from '#lib/flow/settings.ts';
import type { ArtifactId } from '#lib/flow/vocabulary.ts';
import type { RecordedMessage, Recording } from '#lib/recordings/format.ts';
import { knownFrom, provenance, recordedIndex } from '#lib/recordings/known.ts';
import { shapeDifferences, shapeOf } from '#lib/recordings/shape.ts';

const FOLDER = 'static/recordings/authorization-code';

function read(preset: string): Recording {
	return JSON.parse(readFileSync(`${FOLDER}/${preset}.json`, 'utf8'));
}

const recordings = presets.map((preset) => read(preset.id));
const asCases = recordings.map((recording) => [recording.preset, recording] as const);

function viewsOf(recording: Recording): FlowView[] {
	return [base.diagrams.setup, base.diagrams.flow].map((flow) =>
		evaluate(flow, recording.settings)
	);
}

function stepsOf(recording: Recording): Step[] {
	return viewsOf(recording).flatMap((view) => view.steps);
}

const onTheWire = (step: Step) => step.channel === 'front' || step.channel === 'back';

/** The names a message carries, wherever in the message they are. */
function carried(message: RecordedMessage) {
	const target = message.url ?? message.headers.location;
	const query = target ? new URL(target).searchParams : new URLSearchParams();
	const body: Record<string, unknown> =
		message.body && typeof message.body === 'object'
			? (message.body as Record<string, unknown>)
			: {};
	return { query, body };
}

function fieldIsThere(field: Field, message: RecordedMessage): boolean {
	const { query, body } = carried(message);
	const [name, value] = field.name.split('=');
	switch (field.place) {
		case 'path':
			return (message.url ?? '').includes(field.name);
		case 'query':
			if (value === undefined) return query.has(name);
			return (query.get(name) ?? '').split(' ').includes(value);
		case 'body':
			if (field.name === 'username and password') return 'username' in body && 'password' in body;
			if (value === undefined) return name in body;
			return String(body[name]).split(' ').includes(value);
		case 'header':
			if (field.name.startsWith('Authorization: ')) {
				return (message.headers.authorization ?? '').startsWith(field.name.slice(15));
			}
			return field.name.toLowerCase() in message.headers;
		default:
			return true;
	}
}

// What Keycloak adds that is its own business, which the protocol layer rightly does not show.
const KEYCLOAK_ONLY = new Set([
	'session_state',
	'refresh_expires_in',
	'not-before-policy',
	'credentialId',
	'session_code',
	'execution',
	'tab_id',
	'client_data',
	'accessTokenExpiration'
]);

// Answers whose whole point is what is in them, where the fields name the ones the diagram relies
// on. And redirects, which carry what the next request sends, and the diagram shows it there.
const OPEN_ENDED = new Set([
	'discovery-document',
	'userinfo-response',
	'api-response',
	'redirect-to-idp',
	'redirect-to-upstream'
]);

// The address of a login form is Keycloak's own business. What matters is what the form sends.
const SIGN_IN = new Set(['submit-credentials', 'upstream-sign-in']);

function namesInMessage(message: RecordedMessage): string[] {
	const { query, body } = carried(message);
	const inQuery = SIGN_IN.has(message.step ?? '') ? [] : query.keys();
	return [...new Set([...inQuery, ...Object.keys(body)])];
}

function namesInStep(step: Step): Set<string> {
	return new Set(
		step.fields.flatMap((field) =>
			field.name === 'username and password' ? ['username', 'password'] : field.name.split('=')[0]
		)
	);
}

describe.each(asCases)('the recording of %s', (preset, recording) => {
	const recorded = recording.messages.filter((m) => m.step);

	it('has every message the diagram draws, unless the data says it is from the spec', () => {
		const seen = new Set(recorded.map((m) => m.step));
		const missing = stepsOf(recording)
			.filter(onTheWire)
			.filter((step) => !step.specOnly && !seen.has(step.id))
			.map((step) => step.id);
		expect(missing).toEqual([]);
	});

	it('has no message the diagram does not draw', () => {
		const drawn = new Set(stepsOf(recording).map((step) => step.id));
		expect(recorded.map((m) => m.step).filter((step) => !drawn.has(step!))).toEqual([]);
	});

	it('happened in the order the diagram draws it', () => {
		const order = stepsOf(recording).map((step) => step.id);
		const positions = recorded.map((m) => order.indexOf(m.step!));
		expect(positions).toEqual([...positions].sort((a, b) => a - b));
	});

	it('carries every field the diagram says it does', () => {
		const wrong = recorded.flatMap((message) => {
			const step = stepsOf(recording).find((s) => s.id === message.step)!;
			return step.fields
				.filter((field) => !fieldIsThere(field, message))
				.map((field) => `${step.id}: ${field.name}`);
		});
		expect(wrong).toEqual([]);
	});

	it('carries nothing that the diagram leaves out, apart from what is only Keycloak', () => {
		const wrong = recorded.flatMap((message) => {
			if (OPEN_ENDED.has(message.step!)) return [];
			const step = stepsOf(recording).find((s) => s.id === message.step)!;
			const shown = namesInStep(step);
			return namesInMessage(message)
				.filter((name) => !shown.has(name) && !KEYCLOAK_ONLY.has(name))
				.map((name) => `${step.id}: ${name}`);
		});
		expect(wrong).toEqual([]);
	});

	// The chips under each lifeline are the most prominent claim on the screen, so hold them to it.
	it('shows each credential and token exactly where the diagram says it goes', () => {
		const valueIn = (step: string, name: string) => {
			const message = recorded.find((m) => m.step === step);
			if (!message) return undefined;
			const { query, body } = carried(message);
			return query.get(name) ?? (body[name] as string | undefined);
		};
		const values: Partial<Record<ArtifactId, string | undefined>> = {
			password: 'throwaway-password',
			secret:
				recording.settings.clientType === 'confidential' ? 'throwaway-client-secret' : undefined,
			code: valueIn('redirect-with-code', 'code'),
			'access-token': valueIn('token-response', 'access_token'),
			'id-token': valueIn('token-response', 'id_token'),
			'upstream-token': valueIn('upstream-token-response', 'access_token')
		};

		const wrong = recorded.flatMap((message) => {
			const step = stepsOf(recording).find((s) => s.id === message.step)!;
			const text = JSON.stringify(message);
			return Object.entries(values).flatMap(([artifact, value]) => {
				if (!value) return [];
				const claimed = step.fields.some((field) => field.artifact === artifact);
				const there = text.includes(value);
				return claimed === there
					? []
					: [`${step.id}: ${artifact} ${there ? 'is there' : 'is not there'}`];
			});
		});
		expect(wrong).toEqual([]);
	});

	it('never lets a token through the browser', () => {
		const tokens = ['token-response', 'upstream-token-response'].flatMap((step) => {
			const body = recorded.find((m) => m.step === step)?.body as
				Record<string, string> | undefined;
			return body ? [body.access_token, body.id_token, body.refresh_token].filter(Boolean) : [];
		});
		const views = stepsOf(recording);
		for (const message of recorded) {
			const step = views.find((s) => s.id === message.step)!;
			if (step.channel !== 'front') continue;
			for (const token of tokens) expect(JSON.stringify(message)).not.toContain(token);
		}
	});

	it('holds only throwaway values', () => {
		const text = readFileSync(`${FOLDER}/${preset}.json`, 'utf8');
		expect(text).not.toMatch(/-----BEGIN|ghp_|gho_|github_pat_|AKIA[0-9A-Z]{12}|sk-ant-/);
		const hosts = [...text.matchAll(/https?:\/\/([^/"'\s:?]+)/g)].map((match) => match[1]);
		const allowed = new Set(['localhost', 'host.docker.internal']);
		expect(hosts.filter((host) => !allowed.has(host))).toEqual([]);
		const emails = [...text.matchAll(/[\w.+-]+@[\w-]+\.[\w.]+/g)].map((match) => match[0]);
		expect(emails.filter((email) => !email.endsWith('@example.test'))).toEqual([]);
		expect(text).toContain('"keycloak"');
	});

	it('was made with the settings of its named state', () => {
		const wanted = presets.find((p) => p.id === preset)!;
		expect(recording.settings).toEqual(
			normalize({ ...defaultSettings, ...wanted.settings }).settings
		);
	});
});

describe('the files', () => {
	it('are one per named state, and the answers to the open questions', () => {
		const files = readdirSync(FOLDER).sort();
		expect(files).toEqual([...presets.map((p) => `${p.id}.json`), 'questions.json'].sort());
	});

	it('have an index that agrees with them', () => {
		const steps = new Set(recordings.flatMap((r) => r.messages.flatMap((m) => m.step ?? [])));
		expect(recordedIndex.steps).toEqual([...steps].sort());
		expect(recordedIndex.presets).toEqual(presets.map((p) => p.id));
		for (const recording of recordings) {
			expect(recording.keycloak).toBe(recordedIndex.keycloak);
		}
	});

	it('have a pinned version, the same one the recorder uses', () => {
		const recorder = readFileSync('scripts/record/index.ts', 'utf8');
		expect(recorder).toContain(`PINNED_KEYCLOAK = '${recordedIndex.keycloak}'`);
	});

	it('exist for the file the application will ask for', () => {
		for (const preset of recordedIndex.presets) {
			expect(existsSync(`${FOLDER}/${preset}.json`)).toBe(true);
		}
	});
});

describe('how each message is known', () => {
	it('is recorded or from the spec, for every message of every valid combination', () => {
		const unknown = allValidSettings().flatMap((settings) =>
			[base.diagrams.setup, base.diagrams.flow].flatMap((flow) =>
				evaluate(flow, settings)
					.steps.filter(onTheWire)
					.filter((step) => knownFrom(step)?.kind === 'unchecked')
					.map((step) => step.id)
			)
		);
		expect([...new Set(unknown)]).toEqual([]);
	});

	it('says nothing about steps with nothing on the wire', () => {
		const steps = evaluate(base.diagrams.setup, defaultSettings).steps;
		expect(knownFrom(steps[0])).toBeNull();
	});

	it('names the spec when Keycloak did not do it', () => {
		const step = evaluate(base.diagrams.flow, {
			...defaultSettings,
			binding: 'dpop',
			dpopNonce: true
		}).steps.find((s) => s.id === 'nonce-challenge')!;
		expect(knownFrom(step)).toMatchObject({ kind: 'spec' });
	});
});

describe('what the application says about where it comes from', () => {
	it('names the specs, the version and the date', () => {
		const origin = provenance(base.diagrams.flow, defaultSettings);
		expect(origin.specs).toEqual(['RFC 6749', 'RFC 6750']);
		expect(origin.keycloak).toBe(recordedIndex.keycloak);
		expect(origin.date).toBe(recordedIndex.recordedAt);
	});

	it('adds the specs of the settings that are on, and leaves vendor docs out', () => {
		const origin = provenance(base.diagrams.flow, {
			...defaultSettings,
			oidc: true,
			binding: 'dpop',
			broker: true
		});
		expect(origin.specs).toEqual(['RFC 6749', 'RFC 6750', 'OpenID Connect Core 1.0', 'RFC 9449']);
	});
});

describe('the shape of a recording', () => {
	const [first] = recordings;

	it('leaves out what changes every run', () => {
		const changed: Recording = JSON.parse(
			JSON.stringify(first).replaceAll(/code=[\w.-]+/g, 'code=something-else')
		);
		expect(shapeDifferences(shapeOf(first), shapeOf(changed))).toEqual([]);
	});

	it('notices a step that went missing', () => {
		const changed = { ...first, messages: first.messages.slice(1) };
		expect(shapeDifferences(shapeOf(first), shapeOf(changed)).length).toBeGreaterThan(0);
	});

	it('notices a new field in an answer', () => {
		const changed: Recording = JSON.parse(JSON.stringify(first));
		const answer = changed.messages.find((m) => m.step === 'token-response')!;
		(answer.body as Record<string, unknown>).something_new = 'x';
		const differences = shapeDifferences(shapeOf(first), shapeOf(changed));
		expect(differences.join('\n')).toContain('something_new');
	});
});
