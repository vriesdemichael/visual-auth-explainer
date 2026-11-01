import type { Meta, StoryObj } from '@storybook/sveltekit';
import LivingDiagram from '#lib/components/LivingDiagram.svelte';
import { mapNodes } from '#lib/map/nodes.ts';

const node = (id: string) => mapNodes.find((candidate) => candidate.id === id)!;

const meta = {
	title: 'LivingDiagram',
	component: LivingDiagram,
	parameters: { layout: 'fullscreen' },
	args: { node: node('how-access-works'), step: 'token-response', href: '#' }
} satisfies Meta<typeof LivingDiagram>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BeforeItMoves: Story = {};

export const AfterItMoved: Story = { args: { node: node('who-logged-in'), step: null } };

export const OnSetup: Story = {
	args: { node: node('getting-to-know-each-other'), step: null }
};
