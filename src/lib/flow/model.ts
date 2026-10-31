import {
	defaultSettings,
	holds,
	settingsIn,
	type Condition,
	type SettingId,
	type Settings
} from '#lib/flow/settings.ts';
import type { ArtifactId, Channel, LifelineIcon } from '#lib/flow/vocabulary.ts';
import type { SourceId } from '#lib/sources/sources.ts';

/** Text that varies with the settings. The first case that holds wins. */
export type Text = string | readonly { when?: Condition; text: string }[];

export interface LifelineDef {
	id: string;
	/** What simple mode calls it, in words that need no explaining first. */
	plainName: string;
	plainRole: string;
	name: string;
	role: Text;
	concept: string;
	icon: LifelineIcon;
	/** Messages to or from this lifeline travel through the browser. */
	front?: boolean;
	/** What it knows before the diagram starts. */
	startsWith?: readonly { artifact: ArtifactId; when?: Condition }[];
	when?: Condition;
}

export interface GroupDef {
	id: string;
	plain: string;
	label: string;
	when?: Condition;
}

export type StepKind = 'request' | 'response' | 'internal' | 'human';

export interface FieldDef {
	name: string;
	place: 'query' | 'header' | 'body' | 'token' | 'setting' | 'path' | 'memory';
	note?: string;
	/** The credential or token this field carries, which the diagram draws on the message. */
	artifact?: ArtifactId;
	when?: Condition;
}

export type DiagramId = 'flow' | 'setup';

/** A way from a step to a related one in the other diagram. */
export interface StepLink {
	diagram: DiagramId;
	step: string;
	text: string;
}

/** What goes wrong here, for a message people actually run into trouble with. */
export interface PitfallDef {
	title: string;
	text: Text;
	keycloak?: Text;
}

export interface Pitfall {
	title: string;
	text: string;
	keycloak?: string;
}

export interface StepDef {
	id: string;
	from: string;
	to: string;
	kind: StepKind;
	/** What simple mode says, where `label` is what is on the wire. */
	plain: Text;
	label: Text;
	concept: Text;
	group?: string;
	pitfall?: PitfallDef;
	links?: readonly StepLink[];
	fields?: readonly FieldDef[];
	/** Where this comes from, when a real Keycloak did not do it and so it could not be recorded. */
	specOnly?: string;
	when?: Condition;
}

/** Steps are one ordered list, so a toggle can only add, remove or reword, never reorder. */
export interface FlowDef {
	id: string;
	title: string;
	summary: string;
	/** Where someone new starts: what this is for, in their words. */
	intro: string;
	/** The specs this diagram rests on, whatever the settings. */
	specs: readonly SourceId[];
	lifelines: readonly LifelineDef[];
	groups: readonly GroupDef[];
	steps: readonly StepDef[];
}

/** A base flow has two diagrams, because nobody in the user flow does the setup. */
export interface BaseFlow {
	id: string;
	diagrams: Readonly<Record<DiagramId, FlowDef>>;
}

export interface Lifeline {
	id: string;
	plainName: string;
	plainRole: string;
	name: string;
	role: string;
	concept: string;
	icon: LifelineIcon;
	startsWith: ArtifactId[];
	causes: SettingId[];
}

export interface Field {
	name: string;
	place: FieldDef['place'];
	note?: string;
	artifact?: ArtifactId;
	causes: SettingId[];
	/** Differs from the base flow, so the diagram shows it on the message itself. */
	changed: boolean;
}

export interface Step {
	id: string;
	from: string;
	to: string;
	kind: StepKind;
	channel: Channel;
	plain: string;
	label: string;
	concept: string;
	group?: string;
	pitfall?: Pitfall;
	links: readonly StepLink[];
	fields: Field[];
	specOnly?: string;
	causes: SettingId[];
}

export interface FlowView {
	flow: string;
	lifelines: Lifeline[];
	steps: Step[];
	groups: GroupDef[];
}

function resolve(text: Text, settings: Settings): string {
	if (typeof text === 'string') return text;
	const match = text.find((c) => !c.when || holds(c.when, settings));
	if (!match) throw new Error(`No text case holds: ${JSON.stringify(text)}`);
	return match.text;
}

function resolvePitfall(pitfall: PitfallDef, settings: Settings): Pitfall {
	return {
		title: pitfall.title,
		text: resolve(pitfall.text, settings),
		keycloak: pitfall.keycloak && resolve(pitfall.keycloak, settings)
	};
}

const present = (when: Condition | undefined, settings: Settings) => !when || holds(when, settings);
const causes = (when: Condition | undefined) => (when ? settingsIn(when) : []);

function channelOf(flow: FlowDef, step: StepDef): Channel {
	if (step.kind === 'human') return 'people';
	if (step.kind === 'internal') return 'internal';
	const front = flow.lifelines.some((l) => l.front && (l.id === step.from || l.id === step.to));
	return front ? 'front' : 'back';
}

export function evaluate(flow: FlowDef, settings: Settings): FlowView {
	const steps: Step[] = flow.steps
		.filter((step) => present(step.when, settings))
		.map((step) => ({
			id: step.id,
			from: step.from,
			to: step.to,
			kind: step.kind,
			channel: channelOf(flow, step),
			plain: resolve(step.plain, settings),
			label: resolve(step.label, settings),
			concept: resolve(step.concept, settings),
			group: step.group,
			pitfall: step.pitfall && resolvePitfall(step.pitfall, settings),
			links: step.links ?? [],
			specOnly: step.specOnly,
			causes: causes(step.when),
			fields: (step.fields ?? [])
				.filter((field) => present(field.when, settings))
				.map((field) => ({
					name: field.name,
					place: field.place,
					note: field.note,
					artifact: field.artifact,
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
				plainName: lifeline.plainName,
				plainRole: lifeline.plainRole,
				name: lifeline.name,
				role: resolve(lifeline.role, settings),
				concept: lifeline.concept,
				icon: lifeline.icon,
				startsWith: (lifeline.startsWith ?? [])
					.filter((held) => present(held.when, settings))
					.map((held) => held.artifact),
				causes: causes(lifeline.when)
			})),
		steps,
		groups: flow.groups.filter((group) => present(group.when, settings))
	};
}

/** What each lifeline has seen by the end of a step: what it started with, and what passed through it. */
export function holdingsAt(view: FlowView, stepId: string): Record<string, ArtifactId[]> {
	const held = Object.fromEntries(view.lifelines.map((line) => [line.id, [...line.startsWith]]));
	const see = (line: string, artifact: ArtifactId) => {
		if (!held[line].includes(artifact)) held[line].push(artifact);
	};
	for (const step of view.steps) {
		for (const { artifact } of step.fields) {
			if (!artifact) continue;
			see(step.from, artifact);
			see(step.to, artifact);
		}
		if (step.id === stepId) break;
	}
	return held;
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
