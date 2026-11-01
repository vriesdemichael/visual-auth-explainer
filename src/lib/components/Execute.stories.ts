import type { Meta, StoryObj } from '@storybook/sveltekit';
import Execute from '#lib/components/Execute.svelte';

const meta = {
	title: 'Execute',
	component: Execute,
	args: { answerAt: 9, onexecute: () => {} }
} satisfies Meta<typeof Execute>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ready: Story = {};
