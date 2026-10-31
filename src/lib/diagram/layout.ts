import type { FlowView, StepKind } from '#lib/flow/model.ts';
import {
	artifacts,
	type ArtifactId,
	type Channel,
	type LifelineIcon,
	type Mode
} from '#lib/flow/vocabulary.ts';

export const WIDTH = 880;
const LANE_MARGIN = 90;
const FIRST_ROW_Y = 36;
const ROW_HEIGHT = 46;
const ROW_TOP = 26;
const ROW_BAND = 38;
const CHIP_LINE_HEIGHT = 22;
const GROUP_TOP = 36;
const GROUP_BOTTOM = 10;
const GROUP_SIDE = 62;
const CHIP_CHAR_WIDTH = 6.6;
const CHIP_PADDING = 12;
const CHIP_GAP = 6;
const SELF_LOOP_WIDTH = 34;
const SELF_LABEL_ROOM = 240;

const HELD_TOP = 58;
const HELD_LINE_HEIGHT = 19;
const HELD_CHAR_WIDTH = 5.6;
const HELD_PADDING = 12;
const HELD_GAP = 4;
const HELD_LINE_WIDTH = 150;
const HELD_LINES = 2;

/** Height of the heads, which always keep room for what the lifelines have seen. */
export const HEAD_HEIGHT = HELD_TOP + HELD_LINES * HELD_LINE_HEIGHT + 2;

export interface LaneLayout {
	id: string;
	x: number;
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
	y: number
): ChipLayout[] {
	const texts = fields.map((field) =>
		field.artifact ? artifacts[field.artifact].label : field.name
	);
	const widths = texts.map((text) => text.length * CHIP_CHAR_WIDTH + CHIP_PADDING);
	const total = widths.reduce((sum, width) => sum + width + CHIP_GAP, -CHIP_GAP);
	let x = clamp(center - total / 2, 6, Math.max(6, WIDTH - total - 6));
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

/** A pure function of the view, so the prerendered page and every test see the same geometry. */
export function layoutDiagram(view: FlowView, mode: Mode = 'simple'): DiagramLayout {
	const simple = mode === 'simple';
	const spacing = (WIDTH - LANE_MARGIN * 2) / Math.max(1, view.lifelines.length - 1);
	const lanes: LaneLayout[] = view.lifelines.map((line, i) => ({
		id: line.id,
		x: LANE_MARGIN + i * spacing,
		name: simple ? line.plainName : line.name,
		role: simple ? line.plainRole : line.role,
		icon: line.icon
	}));
	const laneX = new Map(lanes.map((lane) => [lane.id, lane.x]));
	const nameOf = (id: string) => lanes.find((lane) => lane.id === id)?.name ?? id;

	let cursor = FIRST_ROW_Y;
	const rows: RowLayout[] = [];
	const chips: ChipLayout[] = [];
	const groups: GroupLayout[] = [];
	const steps = view.steps;

	for (let i = 0; i < steps.length; i++) {
		const step = steps[i];
		const previous = steps[i - 1];
		const next = steps[i + 1];
		const self = step.from === step.to;
		const x1 = laneX.get(step.from) ?? 0;
		const x2 = laneX.get(step.to) ?? 0;
		const selfSide = x1 > WIDTH - SELF_LABEL_ROOM ? -1 : 1;

		if (step.group && previous?.group !== step.group) cursor += GROUP_TOP;
		const y = cursor;
		// A setting's change and a credential or token go on the message. The rest is in the detail.
		const onMessage: { name: string; artifact?: ArtifactId; mark?: boolean }[] = step.fields.filter(
			(field) => field.changed || field.artifact
		);
		// Something a real server did not do should not look the same as what it did.
		if (step.specOnly) onMessage.push({ name: 'spec only', mark: true });
		const chipLines = onMessage.length ? CHIP_LINE_HEIGHT : 0;
		rows.push({
			id: step.id,
			number: i + 1,
			from: step.from,
			to: step.to,
			y,
			band: ROW_BAND + chipLines + (self ? 4 : 0),
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
		chips.push(...layChips(step.id, shown, center, y + (self ? 22 : 8)));
		cursor += ROW_HEIGHT + chipLines;

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

	return { width: WIDTH, height: cursor, lanes, rows, chips, groups };
}

/** What a lifeline has seen, as chips under its name, relative to the middle of the lane. */
export function layHeld(held: readonly ArtifactId[]): HeldChip[] {
	const lines: { artifact: ArtifactId; width: number; text: string }[][] = [[]];
	let used = 0;
	for (const artifact of held) {
		const text = artifacts[artifact].short;
		const width = text.length * HELD_CHAR_WIDTH + HELD_PADDING;
		if (used && used + HELD_GAP + width > HELD_LINE_WIDTH) {
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
