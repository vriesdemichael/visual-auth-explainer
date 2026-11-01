import type { ArtifactId } from '#lib/flow/vocabulary.ts';
import type { DiagramView } from '#lib/flow/model.ts';
import { settingDefs } from '#lib/flow/settings.ts';
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
	if (explained?.kind === 'setting') {
		const def = settingDefs[explained.id];
		return {
			title: simple ? (def.simple?.label ?? def.label) : def.label,
			text: def.why,
			sources: def.sources.filter((ref) => state.serverNotes || !isVendorSource(ref.source))
		};
	}
	return null;
}
