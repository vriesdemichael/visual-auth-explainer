import { describe, expect, it } from 'vitest';
import { authorizationCodeBase as base, clientCredentialsBase } from '#lib/flow/index.ts';
import { leftToYou } from '#lib/flow/left-to-you.ts';
import { evaluate } from '#lib/flow/model.ts';
import { allValidSettings, defaultSettings, normalize } from '#lib/flow/settings.ts';
import { parseState, serializeState, withList } from '#lib/flow/state.ts';
import { sayer } from '#lib/flow/wording.ts';

const plain = sayer('plain');
const withOidc = normalize({ ...defaultSettings, oidc: true }).settings;
const list = (settings = withOidc) => leftToYou(base, settings, plain);
const group = (id: string, settings = withOidc) =>
	list(settings).groups.find((candidate) => candidate.id === id);

describe('what is left to you', () => {
	it('comes from the steps, with nothing written for it, in every combination', () => {
		for (const settings of allValidSettings()) {
			const { groups, larger } = leftToYou(base, settings, plain);
			const steps = [base.diagrams.setup, base.diagrams.flow].flatMap(
				(diagram) => evaluate(diagram, settings).steps
			);
			for (const { items, id } of groups) {
				for (const item of items) {
					const step = steps.find((candidate) => candidate.id === item.step)!;
					const from = id === 'wrong' ? step.pitfall?.text : step.inPractice;
					expect(from, item.step).toContain(item.text);
				}
			}
			if (larger) expect(steps.some((step) => step.inPractice?.includes(larger))).toBe(true);
		}
	});

	it('has everything the steps say, once', () => {
		const items = list().groups.flatMap(({ items }) => items);
		for (const diagram of [base.diagrams.setup, base.diagrams.flow]) {
			for (const step of evaluate(diagram, withOidc).steps) {
				const here = items.filter((item) => item.step === step.id);
				const expected = (step.inPractice ? 1 : 0) + (step.pitfall ? 1 : 0);
				expect(here, step.id).toHaveLength(expected);
			}
		}
	});

	it('is grouped by whose job it is', () => {
		const ids = (id: string) => group(id)?.items.map(({ step }) => step);
		expect(ids('before')).toEqual([
			'register-client',
			'hand-over-credentials',
			'configure-app',
			'configure-api'
		]);
		expect(ids('app')).toContain('token-request');
		expect(ids('app')).toContain('discover');
		expect(ids('app')).toContain('api-request');
		expect(ids('app')).not.toContain('api-check-token');
		expect(ids('api')).toEqual(['api-check-token', 'api-response']);
		expect(ids('wrong')).toContain('authorize');
	});

	it('says what can go wrong in full, because that is half of what someone came for', () => {
		const wrong = group('wrong')?.items.find(({ step }) => step === 'authorize');
		expect(wrong?.title).toBe('What if the address does not match?');
		expect(wrong?.text.length).toBeGreaterThan(40);
	});

	it('says plainly what is bigger than anything on the diagram, and not twice', () => {
		const { larger, groups } = list();
		expect(larger).toContain('own session');
		expect(larger).toContain('logging out');
		const validate = groups
			.flatMap(({ items }) => items)
			.find(({ step, title }) => step === 'validate-id-token' && !title.startsWith('What'));
		expect(validate?.text).not.toContain('own session');
		const onStep = evaluate(base.diagrams.flow, withOidc).steps.find(
			({ id }) => id === 'validate-id-token'
		);
		expect(onStep?.inPractice).toContain('own session');
	});

	it('follows the settings', () => {
		const ids = (settings: typeof withOidc) =>
			leftToYou(base, settings, plain).groups.flatMap(({ items }) => items.map((i) => i.step));
		const off = normalize({ ...defaultSettings }).settings;
		expect(ids(off)).not.toContain('validate-id-token');
		expect(ids(withOidc)).toContain('validate-id-token');
	});

	it('is in the words chosen', () => {
		const items = leftToYou(base, withOidc, sayer('specs')).groups.flatMap(({ items }) => items);
		expect(items.map(({ title }) => title)).toContain('The client trades the code for tokens');
	});

	it('works for a flow with no user as well', () => {
		const ids = leftToYou(clientCredentialsBase, defaultSettings, plain).groups.map(({ id }) => id);
		expect(ids).toEqual(['before', 'app', 'api', 'wrong']);
	});

	it('has an address, which a reload keeps', () => {
		const state = withList(parseState(base, 'flow', 'oidc=1'), true);
		expect(serializeState(base, state)).toContain('list=1');
		expect(parseState(base, 'flow', serializeState(base, state)).list).toBe(true);
		expect(parseState(base, 'flow', 'oidc=1').list).toBe(false);
	});

	it('takes the place of a source that was open', () => {
		const state = parseState(base, 'flow', 'source=rfc6749&section=1.1');
		expect(withList(state, true).source).toBeNull();
	});
});
