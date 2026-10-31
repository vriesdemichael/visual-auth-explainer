import {
	defaultSettings,
	holds,
	settingsIn,
	type Condition,
	type SettingId,
	type Settings
} from '#lib/flow/settings.ts';

/** Text that varies with the settings. The first case that holds wins. */
export type Text = string | readonly { when?: Condition; text: string }[];

export interface LifelineDef {
	id: string;
	name: string;
	role: Text;
	concept: string;
	when?: Condition;
}

export interface PhaseDef {
	id: string;
	label: string;
}

export interface GroupDef {
	id: string;
	label: string;
	when?: Condition;
}

export type StepKind = 'request' | 'response' | 'internal' | 'human';

export interface FieldDef {
	name: string;
	place: 'query' | 'header' | 'body' | 'token' | 'setting' | 'path';
	note?: string;
	when?: Condition;
}

export interface StepDef {
	id: string;
	phase: string;
	from: string;
	to: string;
	kind: StepKind;
	label: Text;
	concept: Text;
	group?: string;
	fields?: readonly FieldDef[];
	when?: Condition;
}

/** Steps are one ordered list, so a toggle can only add, remove or reword, never reorder. */
export interface FlowDef {
	id: string;
	title: string;
	summary: string;
	lifelines: readonly LifelineDef[];
	phases: readonly PhaseDef[];
	groups: readonly GroupDef[];
	steps: readonly StepDef[];
}

export interface Lifeline {
	id: string;
	name: string;
	role: string;
	concept: string;
	causes: SettingId[];
}

export interface Field {
	name: string;
	place: FieldDef['place'];
	note?: string;
	causes: SettingId[];
	/** Differs from the base flow, so the diagram shows it on the message itself. */
	changed: boolean;
}

export interface Step {
	id: string;
	phase: string;
	from: string;
	to: string;
	kind: StepKind;
	label: string;
	concept: string;
	group?: string;
	fields: Field[];
	causes: SettingId[];
}

export interface FlowView {
	flow: string;
	lifelines: Lifeline[];
	steps: Step[];
	groups: GroupDef[];
	phases: readonly PhaseDef[];
}

function resolve(text: Text, settings: Settings): string {
	if (typeof text === 'string') return text;
	const match = text.find((c) => !c.when || holds(c.when, settings));
	if (!match) throw new Error(`No text case holds: ${JSON.stringify(text)}`);
	return match.text;
}

const present = (when: Condition | undefined, settings: Settings) => !when || holds(when, settings);
const causes = (when: Condition | undefined) => (when ? settingsIn(when) : []);

export function evaluate(flow: FlowDef, settings: Settings): FlowView {
	const steps: Step[] = flow.steps
		.filter((step) => present(step.when, settings))
		.map((step) => ({
			id: step.id,
			phase: step.phase,
			from: step.from,
			to: step.to,
			kind: step.kind,
			label: resolve(step.label, settings),
			concept: resolve(step.concept, settings),
			group: step.group,
			causes: causes(step.when),
			fields: (step.fields ?? [])
				.filter((field) => present(field.when, settings))
				.map((field) => ({
					name: field.name,
					place: field.place,
					note: field.note,
					causes: causes(field.when),
					changed: !present(field.when, defaultSettings)
				}))
		}));

	return {
		flow: flow.id,
		lifelines: flow.lifelines
			.filter((lifeline) => present(lifeline.when, settings))
			.map((lifeline) => ({
				id: lifeline.id,
				name: lifeline.name,
				role: resolve(lifeline.role, settings),
				concept: lifeline.concept,
				causes: causes(lifeline.when)
			})),
		steps,
		groups: flow.groups.filter((group) => present(group.when, settings)),
		phases: flow.phases
	};
}

export interface ViewDiff {
	addedSteps: string[];
	removedSteps: string[];
	addedLifelines: string[];
	removedLifelines: string[];
	renamedLifelines: string[];
	addedFields: { step: string; field: string }[];
	removedFields: { step: string; field: string }[];
	rewordedSteps: string[];
}

/** What a change of settings did to the diagram, which is what the transition has to show. */
export function diffViews(before: FlowView, after: FlowView): ViewDiff {
	const beforeSteps = new Map(before.steps.map((step) => [step.id, step]));
	const afterSteps = new Map(after.steps.map((step) => [step.id, step]));
	const beforeLines = new Map(before.lifelines.map((line) => [line.id, line]));
	const afterLines = new Map(after.lifelines.map((line) => [line.id, line]));
	const kept = after.steps.filter((step) => beforeSteps.has(step.id));
	const fieldsNotIn = (a: Step, b: Step) =>
		a.fields
			.filter((field) => !b.fields.some((other) => other.name === field.name))
			.map((field) => ({ step: a.id, field: field.name }));

	return {
		addedSteps: after.steps.filter((s) => !beforeSteps.has(s.id)).map((s) => s.id),
		removedSteps: before.steps.filter((s) => !afterSteps.has(s.id)).map((s) => s.id),
		addedLifelines: after.lifelines.filter((l) => !beforeLines.has(l.id)).map((l) => l.id),
		removedLifelines: before.lifelines.filter((l) => !afterLines.has(l.id)).map((l) => l.id),
		renamedLifelines: after.lifelines
			.filter((l) => beforeLines.has(l.id) && beforeLines.get(l.id)?.role !== l.role)
			.map((l) => l.id),
		addedFields: kept.flatMap((step) => fieldsNotIn(step, beforeSteps.get(step.id)!)),
		removedFields: kept.flatMap((step) => fieldsNotIn(beforeSteps.get(step.id)!, step)),
		rewordedSteps: kept.filter((s) => beforeSteps.get(s.id)?.label !== s.label).map((s) => s.id)
	};
}

export function isEmptyDiff(diff: ViewDiff): boolean {
	return Object.values(diff).every((part) => part.length === 0);
}
