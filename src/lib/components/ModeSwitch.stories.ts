import type { Meta, StoryObj } from '@storybook/sveltekit';
import ModeSwitch from '#lib/components/ModeSwitch.svelte';

const meta = {
	title: 'ModeSwitch',
	component: ModeSwitch,
	args: { mode: 'simple', onchange: () => {} }
} satisfies Meta<typeof ModeSwitch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Simple: Story = {};

export const Advanced: Story = {
	args: { mode: 'advanced' }
};
