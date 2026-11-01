import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { sees } from '#lib/flow/eyes.ts';
import { authorizationCodeBase as base } from '#lib/flow/index.ts';
import { evaluate, holdingsAt, type DiagramId } from '#lib/flow/model.ts';
import { allValidSettings, defaultSettings, type Settings } from '#lib/flow/settings.ts';
import { parseState, serializeState, withDiagram, withEyes, withSetting } from '#lib/flow/state.ts';
import type { ArtifactId } from '#lib/flow/vocabulary.ts';
import { nodeState, mapNodes, stillAnswers } from '#lib/map/nodes.ts';
import type { Recording } from '#lib/recordings/format.ts';
import { lineText, rawLines, redactedLines, traceRun, valuesSeen } from '#lib/recordings/wire.ts';

const diagrams: DiagramId[] = ['flow', 'setup'];
const stateWith = (search: string) => parseState(base, 'flow', search);

describe('what a party saw', () => {
	it.each(diagrams)('is all it holds, in every combination of %s', (diagram) => {
		for (const settings of allValidSettings()) {
			const view = evaluate(base.diagrams[diagram], settings);
			for (const line of view.lifelines) {
				const fromWhatItSaw = new Set<ArtifactId>(line.startsWith);
				for (const step of view.steps) {
					const carried = step.fields.flatMap((field) => field.artifact ?? []);
					if (sees(step, line.id)) for (const artifact of carried) fromWhatItSaw.add(artifact);
					for (const artifact of holdingsAt(view, step.id)[line.id]) {
						expect(fromWhatItSaw, `${line.id} at ${step.id}`).toContain(artifact);
					}
				}
			}
		}
	});

	it.each(diagrams)('includes everything on a message it was part of, in %s', (diagram) => {
		for (const settings of allValidSettings()) {
			const view = evaluate(base.diagrams[diagram], settings);
			for (const step of view.steps) {
				if (step.ends.length) continue;
				for (const line of view.lifelines.filter((candidate) => sees(step, candidate.id))) {
					for (const { artifact } of step.fields) {
						if (artifact) expect(holdingsAt(view, step.id)[line.id]).toContain(artifact);
					}
				}
			}
		}
	});

	it('leaves the browser without the tokens, and the app without the password', () => {
		const view = evaluate(base.diagrams.flow, defaultSettings);
		const last = view.steps[view.steps.length - 1].id;
		const held = holdingsAt(view, last);
		expect(held.browser).not.toContain('access-token');
		expect(held.browser).toContain('code');
		expect(held.app).not.toContain('password');
		expect(held.app).toContain('access-token');
	});

	it('has time go by for everyone', () => {
		const view = evaluate(base.diagrams.flow, { ...defaultSettings, refresh: true });
		const time = view.steps.find((step) => step.kind === 'time')!;
		for (const line of view.lifelines) expect(sees(time, line.id)).toBe(true);
	});
});

describe('the attacker as a party', () => {
	const held = (settings: Partial<Settings>) => {
		const view = evaluate(base.diagrams.flow, { ...defaultSettings, attacker: true, ...settings });
		return holdingsAt(view, view.steps[view.steps.length - 1].id).attacker;
	};

	it('gets the tokens from an app with no secret and no PKCE', () => {
		expect(held({ clientType: 'public' })).toContain('access-token');
	});

	it('gets only the code when PKCE or a secret stops it', () => {
		expect(held({ clientType: 'public', pkce: true })).toEqual(['code']);
		expect(held({})).toEqual(['code']);
	});
});

describe('the state', () => {
	it('round-trips through the address', () => {
		const state = stateWith('eyes=browser&step=token-request');
		expect(state.eyes).toBe('browser');
		expect(parseState(base, 'flow', serializeState(base, state))).toEqual(state);
	});

	it('is left out of the address when it is everyone', () => {
		expect(serializeState(base, stateWith(''))).not.toContain('eyes');
	});

	it('ignores a party that is not on this diagram', () => {
		expect(stateWith('eyes=nobody').eyes).toBeNull();
		expect(stateWith('eyes=attacker').eyes).toBeNull();
		expect(stateWith('attacker=1&eyes=attacker').eyes).toBe('attacker');
	});

	it('changes nothing about the flow', () => {
		const state = stateWith('oidc=1&step=token-request');
		const seen = withEyes(state, 'browser');
		expect({ ...seen, eyes: null }).toEqual(state);
	});

	it('lets go of a party a setting has taken off the diagram', () => {
		const state = stateWith('attacker=1&eyes=attacker');
		expect(withSetting(base, state, 'attacker', false).state.eyes).toBeNull();
		expect(withSetting(base, state, 'pkce', true).state.eyes).toBe('attacker');
	});

	it('lets go of a party the other diagram does not have', () => {
		expect(withDiagram(base, stateWith('eyes=browser'), 'setup').eyes).toBeNull();
		expect(withDiagram(base, stateWith('eyes=app'), 'setup').eyes).toBe('app');
	});
});

describe('the question it answers', () => {
	const node = mapNodes.find(({ id }) => id === 'what-the-browser-sees')!;

	it('opens as the browser, on a step the browser did not see', () => {
		const state = nodeState(node);
		expect(state.eyes).toBe('browser');
		const step = evaluate(base.diagrams.flow, state.settings).steps.find(
			({ id }) => id === state.step
		)!;
		expect(sees(step, 'browser')).toBe(false);
	});

	it('says what the browser really holds', () => {
		const view = evaluate(base.diagrams.flow, nodeState(node).settings);
		const held = holdingsAt(view, view.steps[view.steps.length - 1].id).browser;
		expect([...held].sort()).toEqual(['code', 'password', 'session']);
		expect(node.answer).toMatch(/password/);
		expect(node.answer).toMatch(/code/);
		expect(node.answer).toMatch(/session/);
	});

	it('is left once someone sees it as anyone else', () => {
		expect(stillAnswers(node, nodeState(node))).toBe(true);
		expect(stillAnswers(node, withEyes(nodeState(node), null))).toBe(false);
		expect(stillAnswers(node, withEyes(nodeState(node), 'app'))).toBe(false);
	});
});

describe('a recorded message someone was not part of', () => {
	const folder = 'static/recordings/authorization-code';
	const recordings = readdirSync(folder)
		.filter((file) => file.endsWith('.json') && file !== 'questions.json')
		.map((file) => JSON.parse(readFileSync(`${folder}/${file}`, 'utf8')) as Recording)
		.filter((recording) => Array.isArray(recording.messages));

	it('keeps none of what the run made up', () => {
		expect(recordings.length).toBeGreaterThan(3);
		for (const recording of recordings) {
			const values = traceRun(recording).map(({ value }) => value);
			for (const message of recording.messages) {
				const left = redactedLines(rawLines(message)).map(lineText).join('\n');
				for (const value of values) expect(left).not.toContain(value);
			}
		}
	});

	it('still says what kind of thing was there, and how long', () => {
		const recording = recordings.find(({ preset }) => preset === 'oauth')!;
		const answer = recording.messages.find(({ step }) => step === 'token-response')!;
		const lines = redactedLines(rawLines(answer));
		const token = lines.find((line) => line.before.includes('access_token'))!;
		expect(token.hidden).toBeGreaterThan(40);
		expect(token.value).toBeUndefined();
	});

	it('leaves the values someone saw out of what they are told the run has', () => {
		const recording = recordings.find(({ preset }) => preset === 'oauth')!;
		const trace = traceRun(recording);
		const view = evaluate(base.diagrams.flow, defaultSettings);
		const seenBy = (party: string) => (id: string) =>
			view.steps.some((step) => step.id === id && sees(step, party));
		const everything = () => true;
		const names = (party: string) =>
			valuesSeen(recording, trace, seenBy(party), everything).map(({ name }) => name);
		expect(names('browser')).toContain('code');
		expect(names('browser')).not.toContain('access_token');
		expect(names('app')).toContain('access_token');
		expect(names('api')).toContain('access_token');
		expect(names('api')).not.toContain('code');
	});

	it('counts only what has happened so far', () => {
		const recording = recordings.find(({ preset }) => preset === 'oauth')!;
		const trace = traceRun(recording);
		const names = valuesSeen(
			recording,
			trace,
			() => true,
			(id) => id === 'open-app'
		).map(({ name }) => name);
		expect(names).not.toContain('access_token');
	});
});
