import type { Meta, StoryObj } from '@storybook/sveltekit';
import ChannelLegend from '#lib/components/ChannelLegend.svelte';

const meta = {
	title: 'ChannelLegend',
	component: ChannelLegend,
	args: { present: ['front', 'back', 'internal'] }
} satisfies Meta<typeof ChannelLegend>;

export default meta;
type Story = StoryObj<typeof meta>;

export const UserFlow: Story = {};

export const Setup: Story = {
	args: { present: ['people', 'back'] }
};
