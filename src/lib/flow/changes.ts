import {
	changesInPlainWords,
	diffViews,
	evaluate,
	isEmptyDiff,
	settingsUsedBy,
	type BaseFlow,
	type DiagramDef,
	type DiagramId,
	type ViewDiff
} from '#lib/flow/model.ts';
import {
	change as changeSetting,
	defaultSettings,
	settingDefs,
	simpleSettingIds,
	type Reset,
	type SettingId,
	type Settings
} from '#lib/flow/settings.ts';

/** What the last change of settings did. Stays until the visitor moves on, so it can be read. */
export interface LastChange {
	diff: ViewDiff | null;
	resets: Reset[];
	/** It changed nothing in this diagram, and something in the other one. */
	elsewhere: boolean;
	/** The setting someone just flipped, which is what the words about why are about. */
	setting: SettingId | null;
}

export const NOTHING_CHANGED: LastChange = {
	diff: null,
	resets: [],
	elsewhere: false,
	setting: null
};

/** What flipping a setting has to say, which is known before the screen has moved. */
export function afterFlip(
	last: LastChange,
	id: SettingId,
	here: DiagramDef,
	other: DiagramDef,
	before: Settings,
	after: Settings,
	resets: Reset[]
): LastChange {
	const elsewhere =
		isEmptyDiff(diffViews(evaluate(here, before), evaluate(here, after))) &&
		!isEmptyDiff(diffViews(evaluate(other, before), evaluate(other, after)));
	return { diff: elsewhere ? null : last.diff, resets, elsewhere, setting: id };
}

export interface Move {
	diff: ViewDiff;
	stepChanged: boolean;
	diagramChanged: boolean;
	/** Whether the page has started. Opening a link also moves from the prerendered default state. */
	ready: boolean;
	/** Whether someone flipping a setting caused this, and not Back or a link. */
	byFlip: boolean;
}

/**
 * What to say once the state has moved, whatever moved it. Only a flip knows which setting did it and
 * what it reset. After Back or a link there is still a difference to name, and no more than that,
 * because the words about why would be about something else.
 */
export function afterMove(last: LastChange, move: Move): LastChange {
	const nothing = isEmptyDiff(move.diff);
	if (move.diagramChanged || (nothing && move.stepChanged)) return NOTHING_CHANGED;
	if (nothing || !move.ready) return last;
	return move.byFlip ? { ...last, diff: move.diff } : { ...NOTHING_CHANGED, diff: move.diff };
}

const otherValues = (id: SettingId, settings: Settings): Settings[SettingId][] => {
	const def = settingDefs[id];
	if (def.kind === 'toggle') return [!settings[id]];
	return def.options.map((option) => option.value).filter((value) => value !== settings[id]);
};

/**
 * The settings simple mode leaves out on this diagram. A switch that visibly does nothing here,
 * because it is about the other diagram, reads as broken, so someone new is only offered the ones
 * that do something, along with any they have left on.
 */
export function settingsNotHere(
	base: BaseFlow,
	diagram: DiagramId,
	settings: Settings
): SettingId[] {
	const here = base.diagrams[diagram];
	const other = base.diagrams[diagram === 'flow' ? 'setup' : 'flow'];
	return simpleSettingIds.filter((id) => {
		if (settings[id] !== defaultSettings[id]) return false;
		const flips = otherValues(id, settings).map(
			(value) => changeSetting(settings, id, value as never).settings
		);
		// One that cannot be turned on just now only says why where it could do something.
		const possible = flips.filter((flipped) => flipped[id] !== settings[id]);
		if (!possible.length) return !settingsUsedBy(here).has(id);
		return (
			!possible.some((flipped) => changesInPlainWords(here, settings, flipped)) &&
			possible.some((flipped) => changesInPlainWords(other, settings, flipped))
		);
	});
}
