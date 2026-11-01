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
/** A message that does not fit over its arrow takes another line, and the arrow stays where it is. */
const LINE_HEIGHT = 21;
const LABEL_ABOVE_ARROW = 8;
const LABEL_BESIDE_LOOP = 7;
const LABEL_TO_CHIP = 8;
const CHIP_BASELINE = 13;
const GROUP_TOP = 36;
const GROUP_BOTTOM = 10;
const GROUP_SIDE = 62;
const CHIP_CHAR_WIDTH = 6.2;
/** Parameter names are in a fixed-width font. */
const NAME_CHAR_WIDTH = 6.9;
const CHIP_PADDING = 12;
const CHIP_GAP = 6;
const SELF_LOOP_WIDTH = 34;
const SELF_LABEL_ROOM = 240;
// The current row's label is the widest, in bold. It only has to be enough, because a line that is
// narrower than this is still centred, and the words stay next to their chips.
export const LABEL_CHAR_WIDTH = 6.5;
const LABEL_EDGE = 4;
const NUMBER_ROOM = 14;

const HELD_TOP = 58;
const HELD_LINE_HEIGHT = 19;
const HELD_CHAR_WIDTH = 6.1;
const HELD_PADDING = 12;
const HELD_GAP = 4;
const HELD_LINE_WIDTH = 174;

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

/** A line of what a message says, which is a line of words, placed for its row. */
export interface LabelLine {
	text: string;
	x: number;
	y: number;
	anchor: 'start' | 'middle' | 'end';
}

export interface RowLayout {
	id: string;
	number: number;
	from: string;
	to: string;
	y: number;
	/** Top and height of the highlight and of the area to click, which includes all it says. */
	top: number;
	band: number;
	lines: LabelLine[];
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
	/**
	 * What to look at, which is wider than the drawing when the window is, with the drawing in the
	 * middle. So a band across a row reaches both sides, and there is nothing to scale up.
	 */
	viewX: number;
	viewWidth: number;
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

interface Field {
	name: string;
	artifact?: ArtifactId;
	mark?: boolean;
}

const chipText = (field: Field) => (field.artifact ? artifacts[field.artifact].label : field.name);
const chipWidth = (field: Field) =>
	chipText(field).length * (field.artifact ? CHIP_CHAR_WIDTH : NAME_CHAR_WIDTH) + CHIP_PADDING;

/** Words first and then chips, in lines no wider than there is room for. */
interface Flowed {
	text: string;
	textWidth: number;
	width: number;
	chips: Field[];
}

function flow(label: string, chips: readonly Field[], room: number): Flowed[] {
	const lines: Flowed[] = [{ text: '', textWidth: 0, width: 0, chips: [] }];
	for (const word of label.split(' ')) {
		const line = lines[lines.length - 1];
		const wide = word.length * LABEL_CHAR_WIDTH;
		const next = line.text ? line.width + LABEL_CHAR_WIDTH + wide : wide;
		if (line.text && next > room) {
			lines.push({ text: word, textWidth: wide, width: wide, chips: [] });
		} else {
			line.text = line.text ? `${line.text} ${word}` : word;
			line.textWidth = next;
			line.width = next;
		}
	}
	for (const chip of chips) {
		const line = lines[lines.length - 1];
		const gap = line.chips.length ? CHIP_GAP : line.text ? LABEL_TO_CHIP : 0;
		if (line.width && line.width + gap + chipWidth(chip) > room) {
			lines.push({ text: '', textWidth: 0, width: chipWidth(chip), chips: [chip] });
		} else {
			line.chips.push(chip);
			line.width += gap + chipWidth(chip);
		}
	}
	return lines;
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
	const lanesX = [...laneX.values()];

	/** Where a step's words can go, which is over its arrow, or beside the loop to itself. */
	const placeOf = (step: DiagramView['steps'][number]) => {
		const time = step.kind === 'time';
		const self = step.from === step.to && !time;
		const x1 = time ? Math.min(...lanesX) : (laneX.get(step.from) ?? 0);
		const x2 = time ? Math.max(...lanesX) : (laneX.get(step.to) ?? 0);
		const selfSide: 1 | -1 = x1 > width - SELF_LABEL_ROOM ? -1 : 1;
		const beside = x1 + selfSide * (SELF_LOOP_WIDTH + 8);
		const room = self
			? (selfSide === 1 ? width - beside : beside) - LABEL_EDGE
			: Math.abs(x2 - x1) - NUMBER_ROOM * 2;
		return { time, self, x1, x2, selfSide, beside, room: Math.max(room, 1) };
	};

	// Simple mode says less, and a switch of mode moves no row, so each keeps the room of the longer.
	const linesOf = steps.map((step) => {
		const { self, room } = placeOf(step);
		const counts = [true, false].map((plain) => {
			const shown = plain ? chipsOn(step).filter((f) => f.artifact || f.mark) : chipsOn(step);
			const label = plain ? step.plain : step.label;
			return self
				? flow(label, [], room).length + (shown.length ? 1 : 0)
				: flow(label, shown, room).length;
		});
		return Math.max(...counts);
	});
	const rowHeight = rowHeightFor(steps, linesOf, room && room.height - headHeight);
	const band = Math.max(ROW_BAND, rowHeight - 8);

	let cursor = FIRST_ROW_Y;
	const rows: RowLayout[] = [];
	const chips: ChipLayout[] = [];
	const groups: GroupLayout[] = [];

	for (let i = 0; i < steps.length; i++) {
		const step = steps[i];
		const previous = steps[i - 1];
		const next = steps[i + 1];
		const { time, self, x1, x2, selfSide, beside, room: words } = placeOf(step);

		if (step.group && previous?.group !== step.group) cursor += GROUP_TOP;
		// More lines go up from an arrow, and down beside a loop.
		const extra = (linesOf[i] - 1) * LINE_HEIGHT;
		const y = self ? cursor : cursor + extra;
		const onMessage = chipsOn(step);
		const shown = simple ? onMessage.filter((field) => field.artifact || field.mark) : onMessage;
		const label = simple ? step.plain : step.label;
		const lines: LabelLine[] = [];
		const put = (field: Field, x: number, baseline: number) => {
			chips.push({
				id: `${step.id}:${field.name}`,
				step: step.id,
				x,
				y: baseline - CHIP_BASELINE,
				width: chipWidth(field),
				text: chipText(field),
				artifact: field.artifact
			});
		};

		if (time) {
			lines.push({ text: label, x: (x1 + x2) / 2, y: y + 4, anchor: 'middle' });
		} else if (self) {
			const flowed = flow(label, [], words);
			const anchor = selfSide === 1 ? 'start' : 'end';
			flowed.forEach((line, k) => {
				const baseline = y + LABEL_BESIDE_LOOP + k * LINE_HEIGHT;
				lines.push({ text: line.text, x: beside, y: baseline, anchor });
			});
			const total = shown.reduce((sum, field) => sum + chipWidth(field) + CHIP_GAP, -CHIP_GAP);
			let x = selfSide === 1 ? beside : beside - total;
			x = clamp(x, LABEL_EDGE, Math.max(LABEL_EDGE, width - total - LABEL_EDGE));
			const baseline = y + LABEL_BESIDE_LOOP + flowed.length * LINE_HEIGHT;
			for (const field of shown) {
				put(field, x, baseline);
				x += chipWidth(field) + CHIP_GAP;
			}
		} else {
			const middle = (x1 + x2) / 2;
			const flowed = flow(label, shown, words);
			flowed.forEach((line, k) => {
				const baseline = y - LABEL_ABOVE_ARROW - (flowed.length - 1 - k) * LINE_HEIGHT;
				const start = clamp(
					middle - line.width / 2,
					LABEL_EDGE,
					Math.max(LABEL_EDGE, width - line.width - LABEL_EDGE)
				);
				if (line.text) {
					// Next to its chips by the end of the words, because their real width is only estimated.
					lines.push(
						line.chips.length
							? { text: line.text, x: start + line.textWidth, y: baseline, anchor: 'end' }
							: { text: line.text, x: start + line.width / 2, y: baseline, anchor: 'middle' }
					);
				}
				let x = start + line.textWidth + (line.text && line.chips.length ? LABEL_TO_CHIP : 0);
				for (const field of line.chips) {
					put(field, x, baseline);
					x += chipWidth(field) + CHIP_GAP;
				}
			});
		}

		rows.push({
			id: step.id,
			number: i + 1,
			from: step.from,
			to: step.to,
			y,
			top: y - ROW_TOP - (self ? 0 : extra),
			band: band + extra + (self ? 4 : 0),
			lines,
			x1,
			x2,
			self,
			selfSide,
			kind: step.kind,
			channel: step.channel,
			label,
			route: time
				? 'Nothing is sent'
				: self
					? `${nameOf(step.from)}, internally`
					: `${nameOf(step.from)} to ${nameOf(step.to)}`
		});
		cursor = y + rowHeight + (self ? extra : 0);

		if (step.group && next?.group !== step.group) {
			const members = rows.filter(
				(row) => steps.find((s) => s.id === row.id)?.group === step.group
			);
			const xs = members.flatMap((row) => [row.x1, row.x2]);
			const top = members[0].top - GROUP_TOP + ROW_TOP - 8;
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
		viewX: Math.min(0, width - (room?.width ?? width)) / 2,
		viewWidth: Math.max(width, room?.width ?? width),
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
	const onMessage: Field[] = step.fields.filter((field) => field.changed || field.artifact);
	// Something a real server did not do should not look the same as what it did.
	if (step.specOnly) onMessage.push({ name: 'spec only', mark: true });
	return onMessage;
}

/** Rows take what height there is, so a tall window shows them looser and a short one shows more. */
function rowHeightFor(
	steps: DiagramView['steps'],
	lines: readonly number[],
	height?: number
): number {
	if (height === undefined) return ROW_HEIGHT;
	const extra = lines.reduce((sum, count) => sum + count - 1, 0) * LINE_HEIGHT;
	const groups = new Set(steps.flatMap((step) => step.group ?? [])).size;
	const fixed = FIRST_ROW_Y + extra + groups * (GROUP_TOP + GROUP_BOTTOM);
	return clamp((height - fixed) / Math.max(1, steps.length), TIGHT_ROW_HEIGHT, LOOSE_ROW_HEIGHT);
}

function headHeightOf(view: DiagramView, heldWidth: number): number {
	// At its fullest, which is not always the end, because something can stop existing.
	const held = view.steps.flatMap((step) => Object.values(holdingsAt(view, step.id)));
	const lines = held.map((seen) => new Set(layHeld(seen, heldWidth).map((chip) => chip.y)).size);
	return HELD_TOP + Math.max(1, ...lines) * HELD_LINE_HEIGHT + 2;
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
/** How tall the gap in every line is, where time passes. */
export const TIME_GAP = 26;
