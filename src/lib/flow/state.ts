import { evaluate, type FlowDef, type FlowView, type Step } from '#lib/flow/model.ts';
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

const SETUP_PHASE = 'setup';

export interface AppState {
	flow: string;
	settings: Settings;
	step: string;
	setupOpen: boolean;
}

export function visibleSteps(view: FlowView, setupOpen: boolean): Step[] {
	return view.steps.filter((step) => setupOpen || step.phase !== SETUP_PHASE);
}

/** The requested step if it is on screen, otherwise the nearest earlier one that is (ADR-003). */
export function resolveStep(
	flow: FlowDef,
	view: FlowView,
	setupOpen: boolean,
	requested: string | null
): string {
	const visible = new Set(visibleSteps(view, setupOpen).map((step) => step.id));
	const index = flow.steps.findIndex((step) => step.id === requested);
	for (let i = index; i >= 0; i--) {
		if (visible.has(flow.steps[i].id)) return flow.steps[i].id;
	}
	return visibleSteps(view, setupOpen)[0].id;
}

function parseValue(def: SettingDef, raw: string | null): boolean | string {
	if (raw === null) return def.default;
	if (def.kind === 'toggle') return raw === '1';
	return def.options.some((option) => option.value === raw) ? raw : def.default;
}

export function parseState(flow: FlowDef, search: string): AppState {
	const params = new URLSearchParams(search);
	const requested = Object.fromEntries(
		settingIds.map((id) => [id, parseValue(settingDefs[id], params.get(settingDefs[id].param))])
	) as unknown as Settings;
	const { settings } = normalize(requested);
	const stepParam = params.get('step');
	const inSetup = flow.steps.some((step) => step.id === stepParam && step.phase === SETUP_PHASE);
	const setupOpen = params.get('setup') === '1' || inSetup;
	return {
		flow: flow.id,
		settings,
		setupOpen,
		step: resolveStep(flow, evaluate(flow, settings), setupOpen, stepParam)
	};
}

/** Only what differs from the defaults goes in the URL, so links stay short. */
export function serializeState(flow: FlowDef, state: AppState): string {
	const params = new URLSearchParams();
	for (const id of settingIds) {
		const value = state.settings[id];
		if (value === defaultSettings[id]) continue;
		params.set(settingDefs[id].param, typeof value === 'boolean' ? (value ? '1' : '0') : value);
	}
	if (state.setupOpen) params.set('setup', '1');
	const first = visibleSteps(evaluate(flow, state.settings), state.setupOpen)[0].id;
	if (state.step !== first) params.set('step', state.step);
	return params.toString();
}

export function presetSearch(flow: FlowDef, settings: Partial<Settings>): string {
	const merged = normalize({ ...defaultSettings, ...settings }).settings;
	const view = evaluate(flow, merged);
	return serializeState(flow, {
		flow: flow.id,
		settings: merged,
		setupOpen: false,
		step: resolveStep(flow, view, false, null)
	});
}

export function withSetting<K extends SettingId>(
	flow: FlowDef,
	state: AppState,
	id: K,
	value: Settings[K]
): { state: AppState; resets: Reset[] } {
	const { settings, resets } = change(state.settings, id, value);
	const step = resolveStep(flow, evaluate(flow, settings), state.setupOpen, state.step);
	return { state: { ...state, settings, step }, resets };
}

export function withSetupOpen(flow: FlowDef, state: AppState, setupOpen: boolean): AppState {
	const step = resolveStep(flow, evaluate(flow, state.settings), setupOpen, state.step);
	return { ...state, setupOpen, step };
}

export function nextStep(flow: FlowDef, state: AppState): AppState | null {
	const steps = visibleSteps(evaluate(flow, state.settings), state.setupOpen);
	const index = steps.findIndex((step) => step.id === state.step);
	return index < steps.length - 1 ? { ...state, step: steps[index + 1].id } : null;
}

/** Going back from the first login step opens setup, because that is what happened before it. */
export function previousStep(flow: FlowDef, state: AppState): AppState | null {
	const view = evaluate(flow, state.settings);
	const steps = visibleSteps(view, state.setupOpen);
	const index = steps.findIndex((step) => step.id === state.step);
	if (index > 0) return { ...state, step: steps[index - 1].id };
	if (state.setupOpen) return null;
	const setup = view.steps.filter((step) => step.phase === SETUP_PHASE);
	return setup.length ? { ...state, setupOpen: true, step: setup[setup.length - 1].id } : null;
}
