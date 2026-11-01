import type { Meta, StoryObj } from '@storybook/sveltekit';
import Timeline from '#lib/components/Timeline.svelte';

const part = (label: string, steps: string[]) => ({ label, why: `Why ${label}.`, steps });
const few = [
	part('Ask', ['a1', 'a2', 'a3']),
	part('Log in', ['b1', 'b2']),
	part('Trade', ['c1', 'c2', 'c3']),
	part('Use', ['d1', 'd2'])
];
const many = [
	...few,
	part(
		'Renew',
		Array.from({ length: 11 }, (_, i) => `e${i}`)
	),
	part(
		'Second app',
		Array.from({ length: 9 }, (_, i) => `f${i}`)
	),
	part(
		'Log out',
		Array.from({ length: 17 }, (_, i) => `g${i}`)
	),
	part('Stored token', ['h1', 'h2', 'h3'])
];

const meta = {
	title: 'Timeline',
	component: Timeline,
	args: { parts: few, current: 'b1', onjump: () => {} }
} satisfies Meta<typeof Timeline>;

export default meta;
type Story = StoryObj<typeof meta>;

export const InTheMiddle: Story = {};

export const AtTheStart: Story = { args: { current: 'a1' } };

export const AtTheEnd: Story = { args: { current: 'd2' } };

export const EverythingOn: Story = { args: { parts: many, current: 'f3' } };
