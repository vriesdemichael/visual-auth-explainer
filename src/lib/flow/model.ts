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
	concept: Text;
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
	/** When the step it points at is only there with some settings. */
	when?: Condition;
}

/** What goes wrong here, for a message people actually run into trouble with. */
export interface PitfallDef {
	title: string;
	text: Text;
}

export interface Pitfall {
	title: string;
	text: string;
}

/** This step sends something, and what comes back is used later, so running it adds something. */
export interface ExecuteDef {
	/** The step the answer is on. */
	answer: string;
	when?: Condition;
}

/** A library or gateway someone can look at, and what it does about a step. */
export interface PracticeExample {
	name: string;
	url: string;
	/** Whether it does what the line says, or leaves it to whoever uses it. */
	does: boolean;
	text: string;
	when?: Condition;
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
	/** What this means for someone building an app: who writes this part, and what is left to them. */
	inPractice?: Text;
	/** What is true of real libraries, so that a line about what they do has something behind it. */
	practice?: readonly PracticeExample[];
	links?: readonly StepLink[];
	fields?: readonly FieldDef[];
	execute?: ExecuteDef;
	/** Where this comes from, when a real Keycloak did not do it and so it could not be recorded. */
	specOnly?: string;
	/** How this got here, when it is not a message of its own in the recording. */
	recordedAs?: string;
	when?: Condition;
}

/** Steps are one ordered list, so a toggle can only add, remove or reword, never reorder. */
export interface DiagramDef {
	id: string;
	title: string;
	/** What it is about, in a few words beside the switch between diagrams. */
	caption: string;
	summary: string;
	/** Where someone new starts: what this is for, in their words. */
	intro: string;
	/** The specs this diagram rests on, whatever the settings. */
	specs: readonly SourceId[];
	lifelines: readonly LifelineDef[];
	groups: readonly GroupDef[];
	steps: readonly StepDef[];
}

/** A set of settings that has a recording, which is one real run (ADR-005). */
export interface Preset {
	id: string;
	title: string;
	settings: Partial<Settings>;
}

/**
 * What a visitor picks, such as the authorization code flow. It has two diagrams, because nobody in
 * the user flow does the setup. Its recordings and settings are its own, so one base flow cannot
 * claim what was only ever true of another.
 */
export interface BaseFlow {
	id: string;
	diagrams: Readonly<Record<DiagramId, DiagramDef>>;
	settings: readonly SettingId[];
	presets: readonly Preset[];
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
	inPractice?: string;
	practice: readonly PracticeExample[];
	links: readonly StepLink[];
	fields: Field[];
	/** The step with the answer, when executing this one adds something. */
	execute?: string;
	specOnly?: string;
	recordedAs?: string;
	causes: SettingId[];
}

export interface DiagramView {
	lifelines: Lifeline[];
	steps: Step[];
	groups: GroupDef[];
}

export function resolveText(text: Text, settings: Settings): string {
	if (typeof text === 'string') return text;
	const match = text.find((c) => !c.when || holds(c.when, settings));
	if (!match) throw new Error(`No text case holds: ${JSON.stringify(text)}`);
	return match.text;
}

function resolvePitfall(pitfall: PitfallDef, settings: Settings): Pitfall {
	return { title: pitfall.title, text: resolveText(pitfall.text, settings) };
}

const present = (when: Condition | undefined, settings: Settings) => !when || holds(when, settings);

/** What this is here because of: settings that were changed, and without which it would go. */
function causes(when: Condition | undefined, settings: Settings): SettingId[] {
	if (!when || holds(when, defaultSettings)) return [];
	const changed = settingsIn(when).filter((id) => settings[id] !== defaultSettings[id]);
	const needed = changed.filter((id) => !holds(when, { ...settings, [id]: defaultSettings[id] }));
	return needed.length ? needed : changed;
}

function channelOf(flow: DiagramDef, step: StepDef): Channel {
	if (step.kind === 'human') return 'people';
	if (step.kind === 'internal') return 'internal';
	const front = flow.lifelines.some((l) => l.front && (l.id === step.from || l.id === step.to));
	return front ? 'front' : 'back';
}

export function evaluate(flow: DiagramDef, settings: Settings): DiagramView {
	const steps: Step[] = flow.steps
		.filter((step) => present(step.when, settings))
		.map((step) => ({
			id: step.id,
			from: step.from,
			to: step.to,
			kind: step.kind,
			channel: channelOf(flow, step),
			plain: resolveText(step.plain, settings),
			label: resolveText(step.label, settings),
			concept: resolveText(step.concept, settings),
			group: step.group,
			pitfall: step.pitfall && resolvePitfall(step.pitfall, settings),
			inPractice: step.inPractice && resolveText(step.inPractice, settings),
			practice: (step.practice ?? []).filter((example) => present(example.when, settings)),
			links: (step.links ?? []).filter((link) => present(link.when, settings)),
			execute:
				step.execute && present(step.execute.when, settings) ? step.execute.answer : undefined,
			specOnly: step.specOnly,
			recordedAs: step.recordedAs,
			causes: causes(step.when, settings),
			fields: (step.fields ?? [])
				.filter((field) => present(field.when, settings))
				.map((field) => ({
					name: field.name,
					place: field.place,
					note: field.note,
					artifact: field.artifact,
					causes: causes(field.when, settings),
					changed: !present(field.when, defaultSettings)
				}))
		}));

	return {
		lifelines: flow.lifelines
			.filter((lifeline) => present(lifeline.when, settings))
			.map((lifeline) => ({
				id: lifeline.id,
				plainName: lifeline.plainName,
				plainRole: lifeline.plainRole,
				name: lifeline.name,
				role: resolveText(lifeline.role, settings),
				concept: resolveText(lifeline.concept, settings),
				icon: lifeline.icon,
				startsWith: (lifeline.startsWith ?? [])
					.filter((held) => present(held.when, settings))
					.map((held) => held.artifact)
			})),
		steps,
		groups: flow.groups.filter((group) => present(group.when, settings))
	};
}

/** What each lifeline has seen by the end of a step: what it started with, and what passed through it. */
export function holdingsAt(view: DiagramView, stepId: string): Record<string, ArtifactId[]> {
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
export function diffViews(before: DiagramView, after: DiagramView): ViewDiff {
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

/** Every setting this diagram does anything with, wherever in it that is. */
export function settingsUsedBy(diagram: DiagramDef): Set<string> {
	const used = new Set<string>();
	JSON.stringify(diagram, (key, value) => {
		// What a link depends on is the other diagram, so it does not make a setting do something here.
		if (key === 'links') return undefined;
		if (key === 'setting') used.add(value);
		return value;
	});
	return used;
}

/** What simple mode shows of a diagram: who is on it, what is said, and what gets passed around. */
const plainShape = (view: DiagramView) =>
	JSON.stringify([
		view.lifelines.map((line) => line.id),
		view.steps.map((step) => [
			step.id,
			step.plain,
			step.fields.flatMap((field) => field.artifact ?? [])
		])
	]);

/** Whether someone in simple mode would see anything change on this diagram. */
export function changesInPlainWords(flow: DiagramDef, before: Settings, after: Settings): boolean {
	return plainShape(evaluate(flow, before)) !== plainShape(evaluate(flow, after));
}
