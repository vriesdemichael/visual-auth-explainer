import type {
	ChipLayout,
	DiagramLayout,
	GroupLayout,
	LaneLayout,
	RowLayout
} from '#lib/diagram/layout.ts';

export const TRANSITION_MS = 900;

/** Fades, and for an arrow how far it has drawn, on top of the layout's geometry. */
interface Visibility {
	opacity: number;
	draw: number;
	leaving: boolean;
}

export type FrameLane = LaneLayout & Visibility;
export type FrameRow = RowLayout & Visibility;
export type FrameChip = ChipLayout & Visibility;
export type FrameGroup = GroupLayout & Visibility;

export interface Frame {
	width: number;
	height: number;
	lanes: FrameLane[];
	rows: FrameRow[];
	chips: FrameChip[];
	groups: FrameGroup[];
}

const settled = <T>(item: T) => ({ ...item, opacity: 1, draw: 1, leaving: false });

export function toFrame(layout: DiagramLayout): Frame {
	return {
		width: layout.width,
		height: layout.height,
		lanes: layout.lanes.map(settled),
		rows: layout.rows.map(settled),
		chips: layout.chips.map(settled),
		groups: layout.groups.map(settled)
	};
}

const easeInOut = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2);
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

/** Progress through part of the transition, so leaving, moving and arriving overlap but stay in order. */
const within = (t: number, start: number, end: number) =>
	easeInOut(Math.max(0, Math.min(1, (t - start) / (end - start))));

const leaveAt = (t: number) => within(t, 0, 0.3);
const moveAt = (t: number) => within(t, 0.15, 0.7);
const arriveAt = (t: number) => within(t, 0.55, 1);

function blend<T extends Visibility & { id: string }>(
	from: readonly T[],
	to: readonly T[],
	t: number,
	move: (a: T, b: T, p: number) => T
): T[] {
	const before = new Map(from.map((item) => [item.id, item]));
	const after = new Set(to.map((item) => item.id));
	const staying = to.map((item) => {
		const previous = before.get(item.id);
		if (previous) {
			const moved = move(previous, item, moveAt(t));
			return { ...moved, opacity: lerp(previous.opacity, 1, moveAt(t)), draw: 1, leaving: false };
		}
		const arrived = arriveAt(t);
		return { ...item, opacity: arrived, draw: arrived, leaving: false };
	});
	const leaving = from
		.filter((item) => !after.has(item.id))
		.map((item) => ({ ...item, opacity: item.opacity * (1 - leaveAt(t)), leaving: true }));
	return [...staying, ...leaving];
}

/**
 * The diagram at time t between two frames. A pure function, so any moment of a transition can be
 * tested, and a toggle flipped mid-transition starts from wherever the diagram is.
 */
export function interpolate(from: Frame, to: Frame, t: number): Frame {
	if (t >= 1) return to;
	return {
		width: to.width,
		height: lerp(from.height, to.height, moveAt(t)),
		lanes: blend(from.lanes, to.lanes, t, (a, b, p) => ({
			...b,
			x: lerp(a.x, b.x, p),
			role: p < 0.5 ? a.role : b.role
		})),
		rows: blend(from.rows, to.rows, t, (a, b, p) => ({
			...b,
			y: lerp(a.y, b.y, p),
			band: lerp(a.band, b.band, p),
			x1: lerp(a.x1, b.x1, p),
			x2: lerp(a.x2, b.x2, p),
			label: p < 0.5 ? a.label : b.label
		})),
		chips: blend(from.chips, to.chips, t, (a, b, p) => ({
			...b,
			x: lerp(a.x, b.x, p),
			y: lerp(a.y, b.y, p)
		})),
		groups: blend(from.groups, to.groups, t, (a, b, p) => ({
			...b,
			x: lerp(a.x, b.x, p),
			y: lerp(a.y, b.y, p),
			width: lerp(a.width, b.width, p),
			height: lerp(a.height, b.height, p)
		}))
	};
}
