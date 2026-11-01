import { diagramParts, READING, terms, type Term, type TermPlace } from '#lib/flow/glossary.ts';
import type { ArtifactId } from '#lib/flow/vocabulary.ts';
import { evaluate, type BaseFlow, type DiagramView } from '#lib/flow/model.ts';
import { normalize, settingDefs } from '#lib/flow/settings.ts';
import type { AppState } from '#lib/flow/state.ts';
import { artifacts } from '#lib/flow/vocabulary.ts';
import { isVendorSource, type SourceRef } from '#lib/sources/sources.ts';

/** What the panel says about something someone clicked, in the words of the mode they are in. */
export interface Explaining {
	title: string;
	text: string;
	seen?: readonly ArtifactId[];
	seenBy?: readonly string[];
	sources?: readonly SourceRef[];
	/** What else it is called, because docs and tools use all of them. */
	alsoCalled?: readonly string[];
	/** The parts of the diagram to choose from, for how to read it. */
	parts?: readonly Term[];
	/** It is about one server, which someone can have left out. */
	aboutTheServer?: boolean;
}

export function explanationOf(
	state: AppState,
	view: DiagramView,
	holdings: Readonly<Record<string, readonly ArtifactId[]>>
): Explaining | null {
	const simple = state.mode === 'simple';
	const explained = state.explained;
	if (explained?.kind === 'lifeline') {
		const line = view.lifelines.find((candidate) => candidate.id === explained.id);
		if (!line) return null;
		return {
			title: simple ? line.plainName : line.name,
			text: line.concept,
			seen: holdings[line.id] ?? []
		};
	}
	if (explained?.kind === 'artifact') {
		return {
			title: artifacts[explained.id].label,
			text: artifacts[explained.id].explains,
			seenBy: view.lifelines
				.filter((line) => holdings[line.id]?.includes(explained.id))
				.map((line) => (simple ? line.plainName : line.name))
		};
	}
	if (explained?.kind === 'term') {
		const term = terms[explained.id];
		if (term.vendor && !state.serverNotes) return null;
		const source = term.setting ? settingDefs[term.setting] : null;
		const reading = term === READING || term.part;
		return {
			title: term.name,
			text: term.artifact ? artifacts[term.artifact].explains : source ? source.why : term.explains,
			alsoCalled: term.alsoCalled,
			seenBy: term.artifact
				? view.lifelines
						.filter((line) => holdings[line.id]?.includes(term.artifact!))
						.map((line) => (simple ? line.plainName : line.name))
				: undefined,
			parts: reading ? diagramParts : undefined,
			aboutTheServer: term.id === 'keycloak'
		};
	}
	if (explained?.kind === 'setting') {
		const def = settingDefs[explained.id];
		return {
			title: simple ? (def.simple?.label ?? def.label) : def.label,
			text: `${simple ? (def.simple?.summary ?? def.summary) : def.summary} ${def.why}`,
			sources: def.sources.filter((ref) => state.serverNotes || !isVendorSource(ref.source))
		};
	}
	return null;
}

/** What to light up on the diagram for what is being explained, when it is on screen. */
export interface Lit {
	step?: string;
	lifeline?: string;
	part?: string;
}

const placeOf = (explained: AppState['explained']): TermPlace | undefined =>
	explained?.kind === 'term' ? terms[explained.id].at : undefined;

const isThere = (place: TermPlace, view: DiagramView) =>
	(!place.step || view.steps.some((step) => step.id === place.step)) &&
	(!place.lifeline || view.lifelines.some((line) => line.id === place.lifeline));

export function litBy(state: AppState, view: DiagramView): Lit | null {
	if (state.explained?.kind !== 'term') return null;
	const term = terms[state.explained.id];
	if (term.part) return { part: term.id };
	const place = placeOf(state.explained);
	if (!place || place.diagram !== state.diagram || !isThere(place, view)) return null;
	return { step: place.step, lifeline: place.lifeline };
}

/** The state where a term can be seen, when it is not on screen as things stand. */
export function stateShowing(base: BaseFlow, state: AppState): AppState | null {
	const place = placeOf(state.explained);
	if (!place) return null;
	const diagram = base.diagrams[place.diagram];
	const here = place.diagram === state.diagram && isThere(place, evaluate(diagram, state.settings));
	if (here) return null;
	const settings = normalize({ ...state.settings, ...place.settings }).settings;
	const view = evaluate(diagram, settings);
	if (!isThere(place, view)) return null;
	return {
		...state,
		diagram: place.diagram,
		settings,
		step: place.step ?? state.step
	};
}
