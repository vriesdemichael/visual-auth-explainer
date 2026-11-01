import type { FlowDef, Step } from '#lib/flow/model.ts';
import { presets, type Preset } from '#lib/flow/index.ts';
import {
	defaultSettings,
	normalize,
	settingDefs,
	settingIds,
	type KeycloakFlag,
	type Settings
} from '#lib/flow/settings.ts';
import type { RecordingIndex } from '#lib/recordings/format.ts';
import recorded from '#lib/recordings/recorded.json' with { type: 'json' };
import { sources, type SourceId } from '#lib/sources/sources.ts';

export const recordedIndex: RecordingIndex = recorded;

export const settingsOf = (preset: Preset) =>
	normalize({ ...defaultSettings, ...preset.settings }).settings;

const distance = (preset: Preset, settings: Settings) =>
	settingIds.filter((id) => settingsOf(preset)[id] !== settings[id]).length;

/** The one real run for exactly these settings, if there is one. A recording is never adapted. */
export function recordingFor(settings: Settings): Preset | null {
	return presets.find((preset) => distance(preset, settings) === 0) ?? null;
}

/** What to look at instead, when these settings have no recording. */
export function nearestRecordings(settings: Settings, count = 2): Preset[] {
	return [...presets].sort((a, b) => distance(a, settings) - distance(b, settings)).slice(0, count);
}

const FLAG_WORDS: Readonly<Record<string, string>> = {
	DEFAULT: 'supported, on by default',
	DISABLED_BY_DEFAULT: 'supported, off by default',
	PREVIEW: 'preview, off by default',
	EXPERIMENTAL: 'experimental, off by default',
	DEPRECATED: 'deprecated, off by default'
};

/** In the words of Keycloak's own docs, with what a real server reported. */
export function flagStatus(flag: KeycloakFlag): string {
	const status = recordedIndex.flags[flag.name];
	const words = FLAG_WORDS[status?.type] ?? 'status not recorded';
	return flag.docs ? `${words}. ${flag.docs}` : words;
}

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
