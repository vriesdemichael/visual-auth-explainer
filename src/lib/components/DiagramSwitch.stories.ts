import type { Meta, StoryObj } from '@storybook/sveltekit';
import DiagramSwitch from '#lib/components/DiagramSwitch.svelte';

const meta = {
	title: 'DiagramSwitch',
	component: DiagramSwitch,
	args: {
		caption: 'What happens when a user arrives.',
		current: 'flow',
		hrefs: { flow: '#flow', setup: '#setup' }
	}
} satisfies Meta<typeof DiagramSwitch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OnTheUserFlow: Story = {};

export const OnSetup: Story = {
	args: { current: 'setup' }
};
