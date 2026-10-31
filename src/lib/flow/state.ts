import {
	evaluate,
	type BaseFlow,
	type DiagramId,
	type FlowDef,
	type FlowView
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

export interface AppState {
	flow: string;
	diagram: DiagramId;
	settings: Settings;
	step: string;
}

const diagramIds: readonly DiagramId[] = ['flow', 'setup'];

const flowOf = (base: BaseFlow, state: AppState) => base.diagrams[state.diagram];
const viewOf = (base: BaseFlow, state: AppState) => evaluate(flowOf(base, state), state.settings);

/** The requested step if it is on screen, otherwise the nearest earlier one that is (ADR-003). */
export function resolveStep(flow: FlowDef, view: FlowView, requested: string | null): string {
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

export function parseState(base: BaseFlow, onPath: DiagramId, search: string): AppState {
	const params = new URLSearchParams(search);
	const requested = Object.fromEntries(
		settingIds.map((id) => [id, parseValue(settingDefs[id], params.get(settingDefs[id].param))])
	) as unknown as Settings;
	const { settings } = normalize(requested);
	const diagram = diagramFor(base, onPath, params);
	const flow = base.diagrams[diagram];
	return {
		flow: base.id,
		diagram,
		settings,
		step: resolveStep(flow, evaluate(flow, settings), params.get('step'))
	};
}

/** Only what differs from the defaults goes in the URL, so links stay short. */
export function serializeState(base: BaseFlow, state: AppState): string {
	const params = new URLSearchParams();
	for (const id of settingIds) {
		const value = state.settings[id];
		if (value === defaultSettings[id]) continue;
		params.set(settingDefs[id].param, typeof value === 'boolean' ? (value ? '1' : '0') : value);
	}
	if (state.step !== viewOf(base, state).steps[0].id) params.set('step', state.step);
	return params.toString();
}

export function presetSearch(base: BaseFlow, settings: Partial<Settings>): string {
	const merged = normalize({ ...defaultSettings, ...settings }).settings;
	const flow = base.diagrams.flow;
	return serializeState(base, {
		flow: base.id,
		diagram: 'flow',
		settings: merged,
		step: resolveStep(flow, evaluate(flow, merged), null)
	});
}

export function withSetting<K extends SettingId>(
	base: BaseFlow,
	state: AppState,
	id: K,
	value: Settings[K]
): { state: AppState; resets: Reset[] } {
	const { settings, resets } = change(state.settings, id, value);
	const flow = flowOf(base, state);
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
	return { ...state, diagram, step: resolveStep(flow, evaluate(flow, state.settings), step) };
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
