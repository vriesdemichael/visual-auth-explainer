import { holdingsAt, type DiagramView, type StepKind } from '#lib/flow/model.ts';
import {
	artifacts,
	type ArtifactId,
	type Channel,
	type LifelineIcon,
	type Mode
} from '#lib/flow/vocabulary.ts';

/** The width with nothing to go on, which is the prerendered page and the small ones on the map. */
export const WIDTH = 880;
/**
 * The diagram is laid out for the room it has, at a fixed text size, and not scaled. Beyond this a
 * wider window only adds empty space, because long arrows are harder to follow.
 */
const MAX_WIDTH = 1240;
const MIN_WIDTH = 640;
const LANE_MARGIN = 90;
const TIGHT_MARGIN = 62;
/** Below this a head has no room for its name, so the diagram scales down instead of going under it. */
const MIN_LANE_SPACING = 116;
const HEAD_WIDTH = 144;
/** Narrower than this, a head leaves out its icon. */
export const FULL_HEAD_WIDTH = 140;
const FIRST_ROW_Y = 36;
/** Used with no height to go on. With one, rows take what is there, between these two. */
const ROW_HEIGHT = 46;
const TIGHT_ROW_HEIGHT = 36;
const LOOSE_ROW_HEIGHT = 56;
const ROW_TOP = 26;
const ROW_BAND = 36;
const CHIP_LINE_HEIGHT = 22;
const GROUP_TOP = 36;
const GROUP_BOTTOM = 10;
const GROUP_SIDE = 62;
const CHIP_CHAR_WIDTH = 6.9;
const CHIP_PADDING = 12;
const CHIP_GAP = 6;
const SELF_LOOP_WIDTH = 34;
const SELF_LABEL_ROOM = 240;
// The current row's label is the widest, in bold and a little larger.
const LABEL_CHAR_WIDTH = 7.3;
const LABEL_EDGE = 4;
const NUMBER_ROOM = 14;

const HELD_TOP = 58;
const HELD_LINE_HEIGHT = 19;
const HELD_CHAR_WIDTH = 6.1;
const HELD_PADDING = 12;
const HELD_GAP = 4;
const HELD_LINE_WIDTH = 174;
const HELD_LINES = 2;

/** What the diagram has to fit in, in pixels on screen. */
export interface Room {
	width: number;
	height: number;
}

export interface LaneLayout {
	id: string;
	x: number;
	headWidth: number;
	name: string;
	role: string;
	icon: LifelineIcon;
}

export interface RowLayout {
	id: string;
	number: number;
	from: string;
	to: string;
	y: number;
	/** Height of the highlight and of the area to click, which includes the chips. */
	band: number;
	x1: number;
	x2: number;
	self: boolean;
	/** Which way a message to itself loops, so its label stays inside the diagram. */
	selfSide: 1 | -1;
	kind: StepKind;
	channel: Channel;
	label: string;
	/** For a screen reader, which cannot follow an arrow. */
	route: string;
}

export interface ChipLayout {
	id: string;
	step: string;
	x: number;
	y: number;
	width: number;
	text: string;
	artifact?: ArtifactId;
}

export interface GroupLayout {
	id: string;
	x: number;
	y: number;
	width: number;
	height: number;
	label: string;
}

export interface DiagramLayout {
	width: number;
	height: number;
	/** What it was laid out for, because a change of room should jump and a change of settings move. */
	roomKey: string;
	/** How wide what a lifeline has seen can get, before it wraps. */
	heldWidth: number;
	/** Keeps room for all they will have seen by the end, so stepping moves nothing. */
	headHeight: number;
	lanes: LaneLayout[];
	rows: RowLayout[];
	chips: ChipLayout[];
	groups: GroupLayout[];
}

export interface HeldChip {
	artifact: ArtifactId;
	x: number;
	y: number;
	width: number;
	text: string;
}

const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value));

function layChips(
	id: string,
	fields: readonly { name: string; artifact?: ArtifactId }[],
	center: number,
	y: number,
	width: number
): ChipLayout[] {
	const texts = fields.map((field) =>
		field.artifact ? artifacts[field.artifact].label : field.name
	);
	const widths = texts.map((text) => text.length * CHIP_CHAR_WIDTH + CHIP_PADDING);
	const total = widths.reduce((sum, width) => sum + width + CHIP_GAP, -CHIP_GAP);
	let x = clamp(center - total / 2, 6, Math.max(6, width - total - 6));
	return fields.map((field, i) => {
		const chip = {
			id: `${id}:${field.name}`,
			step: id,
			x,
			y,
			width: widths[i],
			text: texts[i],
			artifact: field.artifact
		};
		x += widths[i] + CHIP_GAP;
		return chip;
	});
}

/**
 * Over the middle of its arrow, unless it is wider than that leaves room for. Then it moves away from
 * the step's number, which is at the start of the arrow, even if it runs on past the tip.
 */
export function labelCentre(x1: number, x2: number, label: string, width = WIDTH): number {
	const half = (label.length * LABEL_CHAR_WIDTH) / 2;
	const room = Math.abs(x2 - x1) / 2 - half;
	const away = Math.sign(x2 - x1) * Math.max(0, NUMBER_ROOM - room);
	return clamp((x1 + x2) / 2 + away, half + LABEL_EDGE, width - half - LABEL_EDGE);
}

/** How wide to be, and how to share that out between the lanes. */
function fitLanes(count: number, room?: Room) {
	const gaps = Math.max(1, count - 1);
	const wanted = clamp(room?.width ?? WIDTH, MIN_WIDTH, MAX_WIDTH);
	const width = Math.max(wanted, TIGHT_MARGIN * 2 + gaps * MIN_LANE_SPACING);
	const roomy = (width - LANE_MARGIN * 2) / gaps >= HEAD_WIDTH + 6;
	const headFor = (margin: number) => Math.min(HEAD_WIDTH, (width - margin * 2) / gaps - 6);
	// The margin has to hold half a head, and the head depends on what the margin leaves.
	const margin = roomy ? LANE_MARGIN : Math.max(TIGHT_MARGIN, headFor(TIGHT_MARGIN) / 2 + 4);
	return { width, margin, spacing: (width - margin * 2) / gaps, headWidth: headFor(margin) };
}

/** A pure function of the view and the room, so every test sees the same geometry as the page. */
export function layoutDiagram(
	view: DiagramView,
	mode: Mode = 'simple',
	room?: Room
): DiagramLayout {
	const simple = mode === 'simple';
	const { width, margin, spacing, headWidth } = fitLanes(view.lifelines.length, room);
	const heldWidth = Math.min(HELD_LINE_WIDTH, spacing - 6);
	const headHeight = headHeightOf(view, heldWidth);
	const lanes: LaneLayout[] = view.lifelines.map((line, i) => ({
		id: line.id,
		x: margin + i * spacing,
		headWidth,
		name: simple ? line.plainName : line.name,
		role: simple ? line.plainRole : line.role,
		icon: line.icon
	}));
	const laneX = new Map(lanes.map((lane) => [lane.id, lane.x]));
	const nameOf = (id: string) => lanes.find((lane) => lane.id === id)?.name ?? id;

	const steps = view.steps;
	const rowHeight = rowHeightFor(steps, room && room.height - headHeight);
	const band = Math.max(ROW_BAND, rowHeight - 8);

	let cursor = FIRST_ROW_Y;
	const rows: RowLayout[] = [];
	const chips: ChipLayout[] = [];
	const groups: GroupLayout[] = [];

	for (let i = 0; i < steps.length; i++) {
		const step = steps[i];
		const previous = steps[i - 1];
		const next = steps[i + 1];
		const self = step.from === step.to;
		const x1 = laneX.get(step.from) ?? 0;
		const x2 = laneX.get(step.to) ?? 0;
		const selfSide = x1 > width - SELF_LABEL_ROOM ? -1 : 1;

		if (step.group && previous?.group !== step.group) cursor += GROUP_TOP;
		const y = cursor;
		// A setting's change and a credential or token go on the message. The rest is in the detail.
		const onMessage = chipsOn(step);
		const chipLines = onMessage.length ? CHIP_LINE_HEIGHT : 0;
		rows.push({
			id: step.id,
			number: i + 1,
			from: step.from,
			to: step.to,
			y,
			band: band + chipLines + (self ? 4 : 0),
			x1,
			x2,
			self,
			selfSide,
			kind: step.kind,
			channel: step.channel,
			label: simple ? step.plain : step.label,
			route: self
				? `${nameOf(step.from)}, internally`
				: `${nameOf(step.from)} to ${nameOf(step.to)}`
		});

		const center = self ? x1 + selfSide * (SELF_LOOP_WIDTH + 90) : (x1 + x2) / 2;
		// Simple mode leaves out parameter names, but keeps their room, so a mode switch moves no row.
		const shown = simple ? onMessage.filter((field) => field.artifact || field.mark) : onMessage;
		chips.push(...layChips(step.id, shown, center, y + (self ? 22 : 8), width));
		cursor += rowHeight + chipLines;

		if (step.group && next?.group !== step.group) {
			const members = rows.filter(
				(row) => steps.find((s) => s.id === row.id)?.group === step.group
			);
			const xs = members.flatMap((row) => [row.x1, row.x2]);
			const top = members[0].y - GROUP_TOP - 8;
			groups.push({
				id: step.group,
				x: Math.min(...xs) - GROUP_SIDE,
				y: top,
				width: Math.max(...xs) - Math.min(...xs) + GROUP_SIDE * 2,
				height: cursor - top - GROUP_BOTTOM,
				label: (() => {
					const group = view.groups.find((candidate) => candidate.id === step.group);
					return (simple ? group?.plain : group?.label) ?? step.group;
				})()
			});
			cursor += GROUP_BOTTOM;
		}
	}

	return {
		width,
		height: cursor,
		roomKey: room ? `${room.width}x${room.height}` : '',
		heldWidth,
		headHeight,
		lanes,
		rows,
		chips,
		groups
	};
}

/** A setting's change and a credential or token go on the message. The rest is in the detail. */
function chipsOn(step: DiagramView['steps'][number]) {
	const onMessage: { name: string; artifact?: ArtifactId; mark?: boolean }[] = step.fields.filter(
		(field) => field.changed || field.artifact
	);
	// Something a real server did not do should not look the same as what it did.
	if (step.specOnly) onMessage.push({ name: 'spec only', mark: true });
	return onMessage;
}

/** Rows take what height there is, so a tall window shows them looser and a short one shows more. */
function rowHeightFor(steps: DiagramView['steps'], height?: number): number {
	if (height === undefined) return ROW_HEIGHT;
	const chipLines = steps.filter((step) => chipsOn(step).length).length * CHIP_LINE_HEIGHT;
	const groups = new Set(steps.flatMap((step) => step.group ?? [])).size;
	const fixed = FIRST_ROW_Y + chipLines + groups * (GROUP_TOP + GROUP_BOTTOM);
	return clamp((height - fixed) / Math.max(1, steps.length), TIGHT_ROW_HEIGHT, LOOSE_ROW_HEIGHT);
}

function headHeightOf(view: DiagramView, heldWidth: number): number {
	const last = view.steps.at(-1);
	const held = Object.values(last ? holdingsAt(view, last.id) : {});
	const lines = held.map((seen) => new Set(layHeld(seen, heldWidth).map((chip) => chip.y)).size);
	return HELD_TOP + Math.max(HELD_LINES, ...lines) * HELD_LINE_HEIGHT + 2;
}

/** What a lifeline has seen, as chips under its name, relative to the middle of the lane. */
export function layHeld(held: readonly ArtifactId[], lineWidth = HELD_LINE_WIDTH): HeldChip[] {
	const lines: { artifact: ArtifactId; width: number; text: string }[][] = [[]];
	let used = 0;
	for (const artifact of held) {
		const text = artifacts[artifact].short;
		const width = text.length * HELD_CHAR_WIDTH + HELD_PADDING;
		if (used && used + HELD_GAP + width > lineWidth) {
			lines.push([]);
			used = 0;
		}
		lines[lines.length - 1].push({ artifact, width, text });
		used += (used ? HELD_GAP : 0) + width;
	}
	return lines.flatMap((line, row) => {
		const total = line.reduce((sum, chip) => sum + chip.width + HELD_GAP, -HELD_GAP);
		let x = -total / 2;
		return line.map((chip) => {
			const placed = { ...chip, x, y: HELD_TOP + row * HELD_LINE_HEIGHT };
			x += chip.width + HELD_GAP;
			return placed;
		});
	});
}

export const SELF_LOOP = { width: SELF_LOOP_WIDTH, height: 18 };
export const ROW_OFFSET = ROW_TOP;
