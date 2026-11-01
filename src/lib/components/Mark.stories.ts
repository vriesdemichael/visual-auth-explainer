import type { Meta, StoryObj } from '@storybook/sveltekit';
import Mark from '#lib/components/Mark.svelte';

const meta = {
	title: 'Mark',
	component: Mark
} satisfies Meta<typeof Mark>;

export default meta;
type Story = StoryObj<typeof meta>;

export const InTheHeader: Story = {};

export const AsAHeading: Story = {
	args: { size: 32 }
};

export const Large: Story = {
	args: { size: 64 }
};
