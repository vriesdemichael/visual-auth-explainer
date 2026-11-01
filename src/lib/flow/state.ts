import {
	evaluate,
	type BaseFlow,
	type DiagramId,
	type DiagramDef,
	type DiagramView
} from '#lib/flow/model.ts';
import {
	change,
	defaultSettings,
	normalize,
	settingDefs,
	settingIds,
	type Reset,
	type SettingDef,
	type SettingId,
	type Settings
} from '#lib/flow/settings.ts';
import { artifacts, type ArtifactId, type Mode } from '#lib/flow/vocabulary.ts';
import { isVendorSource, sources, type SourceId, type SourceRef } from '#lib/sources/sources.ts';

/** A source someone opened from a setting, which is what says what it means here. */
export interface OpenSource {
	id: SourceId;
	setting: SettingId;
	section: string | null;
}

/** What someone asked to have explained, by clicking it. */
export type Explained =
	| { kind: 'lifeline'; id: string }
	| { kind: 'artifact'; id: ArtifactId }
	| { kind: 'setting'; id: SettingId };

export interface AppState {
	flow: string;
	diagram: DiagramId;
	mode: Mode;
	settings: Settings;
	step: string;
	source: OpenSource | null;
	explained: Explained | null;
	/** Whether to show what is specific to the server this was recorded from (ADR-015). */
	serverNotes: boolean;
	/** The settings put out of the way, to give the diagram the room, such as on a projector. */
	settingsHidden: boolean;
}

const diagramIds: readonly DiagramId[] = ['flow', 'setup'];
const SERVER_NOTES_PARAM = 'keycloak';
const SETTINGS_PANEL_PARAM = 'settings';

const diagramOf = (base: BaseFlow, state: AppState) => base.diagrams[state.diagram];
const viewOf = (base: BaseFlow, state: AppState) =>
	evaluate(diagramOf(base, state), state.settings);

/** The requested step if it is on screen, otherwise the nearest earlier one that is (ADR-003). */
export function resolveStep(flow: DiagramDef, view: DiagramView, requested: string | null): string {
	const visible = new Set(view.steps.map((step) => step.id));
	const index = flow.steps.findIndex((step) => step.id === requested);
	for (let i = index; i >= 0; i--) {
		if (visible.has(flow.steps[i].id)) return flow.steps[i].id;
	}
	return view.steps[0].id;
}

function parseValue(def: SettingDef, raw: string | null): boolean | string {
	if (raw === null) return def.default;
	if (def.kind === 'toggle') return raw === '1';
	return def.options.some((option) => option.value === raw) ? raw : def.default;
}

/** A step belongs to one diagram, wherever the link was pointing. `setup=1` is what older links say. */
function diagramFor(base: BaseFlow, onPath: DiagramId, params: URLSearchParams): DiagramId {
	const step = params.get('step');
	const holder = diagramIds.find((id) => base.diagrams[id].steps.some((s) => s.id === step));
	if (holder) return holder;
	return params.get('setup') === '1' ? 'setup' : onPath;
}

/** A link naming something that does not exist opens nothing, as other unknown values do. */
function parseSource(params: URLSearchParams): OpenSource | null {
	const setting = settingIds.find((id) => settingDefs[id].param === params.get('for'));
	if (!setting) return null;
	const ref = settingDefs[setting].sources.find((r) => r.source === params.get('source'));
	if (!ref) return null;
	if (isVendorSource(ref.source) && params.get(SERVER_NOTES_PARAM) === 'off') return null;
	const section = sources[ref.source].textFile ? params.get('section') : null;
	return { id: ref.source, setting, section };
}

function parseExplained(base: BaseFlow, diagram: DiagramId, raw: string | null): Explained | null {
	const [kind, id] = (raw ?? '').split('.');
	if (kind === 'lifeline' && base.diagrams[diagram].lifelines.some((line) => line.id === id)) {
		return { kind, id };
	}
	if (kind === 'artifact' && Object.hasOwn(artifacts, id)) return { kind, id: id as ArtifactId };
	if (kind === 'setting' && settingIds.includes(id as SettingId)) {
		return { kind, id: id as SettingId };
	}
	return null;
}

export function parseState(base: BaseFlow, onPath: DiagramId, search: string): AppState {
	const params = new URLSearchParams(search);
	// A link can only ask for what this flow has, so the rest stay on their defaults.
	const requested = Object.fromEntries(
		base.settings.map((id) => [id, parseValue(settingDefs[id], params.get(settingDefs[id].param))])
	);
	const { settings } = normalize({ ...defaultSettings, ...requested });
	const diagram = diagramFor(base, onPath, params);
	const flow = base.diagrams[diagram];
	return {
		flow: base.id,
		diagram,
		mode: params.get('mode') === 'advanced' ? 'advanced' : 'simple',
		settings,
		step: resolveStep(flow, evaluate(flow, settings), params.get('step')),
		source: parseSource(params),
		explained: parseExplained(base, diagram, params.get('explain')),
		serverNotes: params.get(SERVER_NOTES_PARAM) !== 'off',
		settingsHidden: params.get(SETTINGS_PANEL_PARAM) === 'off'
	};
}

/** Only what differs from the defaults goes in the URL, so links stay short. */
export function serializeState(base: BaseFlow, state: AppState): string {
	const params = new URLSearchParams();
	if (state.mode !== 'simple') params.set('mode', state.mode);
	for (const id of settingIds) {
		const value = state.settings[id];
		if (value === defaultSettings[id]) continue;
		params.set(settingDefs[id].param, typeof value === 'boolean' ? (value ? '1' : '0') : value);
	}
	if (state.step !== viewOf(base, state).steps[0].id) params.set('step', state.step);
	if (state.source) {
		params.set('source', state.source.id);
		params.set('for', settingDefs[state.source.setting].param);
		if (state.source.section) params.set('section', state.source.section);
	}
	if (state.explained) params.set('explain', `${state.explained.kind}.${state.explained.id}`);
	if (!state.serverNotes) params.set(SERVER_NOTES_PARAM, 'off');
	if (state.settingsHidden) params.set(SETTINGS_PANEL_PARAM, 'off');
	return params.toString();
}

/** The same, on the address of a node, where what the node starts from would apply otherwise. */
export function serializeOnNode(base: BaseFlow, state: AppState): string {
	const params = new URLSearchParams(serializeState(base, state));
	params.set('mode', state.mode);
	params.set('step', state.step);
	return params.toString();
}

export function presetSearch(base: BaseFlow, settings: Partial<Settings>): string {
	const merged = normalize({ ...defaultSettings, ...settings }).settings;
	const flow = base.diagrams.flow;
	return serializeState(base, {
		flow: base.id,
		diagram: 'flow',
		mode: 'simple',
		settings: merged,
		step: resolveStep(flow, evaluate(flow, merged), null),
		source: null,
		explained: null,
		serverNotes: true,
		settingsHidden: false
	});
}

export function withSetting<K extends SettingId>(
	base: BaseFlow,
	state: AppState,
	id: K,
	value: Settings[K]
): { state: AppState; resets: Reset[] } {
	const { settings, resets } = change(state.settings, id, value);
	const flow = diagramOf(base, state);
	const step = resolveStep(flow, evaluate(flow, settings), state.step);
	return { state: { ...state, settings, step }, resets };
}

/** Switching diagrams keeps the settings. A step only means something in its own diagram. */
export function withDiagram(
	base: BaseFlow,
	state: AppState,
	diagram: DiagramId,
	step: string | null = null
): AppState {
	const flow = base.diagrams[diagram];
	return {
		...state,
		diagram,
		step: resolveStep(flow, evaluate(flow, state.settings), step),
		// A lifeline only means something in its own diagram.
		explained: state.explained?.kind === 'lifeline' ? null : state.explained
	};
}

export function withMode(state: AppState, mode: Mode): AppState {
	return { ...state, mode };
}

/** Leaving them out closes one product's own docs as well, so nothing about it stays on screen. */
export function withServerNotes(state: AppState, serverNotes: boolean): AppState {
	const closes = !serverNotes && state.source && isVendorSource(state.source.id);
	return { ...state, serverNotes, source: closes ? null : state.source };
}

export function withSettingsHidden(state: AppState, settingsHidden: boolean): AppState {
	return { ...state, settingsHidden };
}

export function withExplained(state: AppState, explained: Explained | null): AppState {
	return { ...state, explained };
}

export function withSourceOpen(state: AppState, setting: SettingId, ref: SourceRef): AppState {
	return { ...state, source: { id: ref.source, setting, section: ref.section ?? null } };
}

export function withSourceSection(state: AppState, section: string | null): AppState {
	return state.source ? { ...state, source: { ...state.source, section } } : state;
}

export function withSourceClosed(state: AppState): AppState {
	return { ...state, source: null };
}

export function nextStep(base: BaseFlow, state: AppState): AppState | null {
	const steps = viewOf(base, state).steps;
	const index = steps.findIndex((step) => step.id === state.step);
	return index < steps.length - 1 ? { ...state, step: steps[index + 1].id } : null;
}

export function previousStep(base: BaseFlow, state: AppState): AppState | null {
	const steps = viewOf(base, state).steps;
	const index = steps.findIndex((step) => step.id === state.step);
	return index > 0 ? { ...state, step: steps[index - 1].id } : null;
}
