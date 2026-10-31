import type { FlowDef, Step } from '#lib/flow/model.ts';
import { defaultSettings, settingDefs, settingIds, type Settings } from '#lib/flow/settings.ts';
import type { RecordingIndex } from '#lib/recordings/format.ts';
import recorded from '#lib/recordings/recorded.json' with { type: 'json' };
import { sources, type SourceId } from '#lib/sources/sources.ts';

export const recordedIndex: RecordingIndex = recorded;

export type Known =
	| { kind: 'recorded'; keycloak: string; date: string }
	| { kind: 'spec'; source: string }
	| { kind: 'unchecked' };

/** How we know a message looks the way it does. Steps with nothing on the wire have nothing to check. */
export function knownFrom(step: Step): Known | null {
	if (step.channel !== 'front' && step.channel !== 'back') return null;
	if (step.specOnly) return { kind: 'spec', source: step.specOnly };
	if (recordedIndex.steps.includes(step.id)) {
		return { kind: 'recorded', keycloak: recordedIndex.keycloak, date: recordedIndex.recordedAt };
	}
	return { kind: 'unchecked' };
}

const isSpec = (id: SourceId) => !id.startsWith('keycloak');

/** The specs behind what is on screen, and which real server it was checked against, and when. */
export function provenance(flow: FlowDef, settings: Settings) {
	const fromSettings = settingIds
		.filter((id) => settings[id] !== defaultSettings[id])
		.flatMap((id) => settingDefs[id].sources.map((ref) => ref.source));
	const specs = [...new Set([...flow.specs, ...fromSettings])].filter(isSpec);
	return {
		specs: specs.map((id) => sources[id].label),
		keycloak: recordedIndex.keycloak,
		date: recordedIndex.recordedAt
	};
}
