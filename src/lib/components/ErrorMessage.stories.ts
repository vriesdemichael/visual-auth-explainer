import type { Meta, StoryObj } from '@storybook/sveltekit';
import ErrorMessage from '#lib/components/ErrorMessage.svelte';

const meta = {
	title: 'ErrorMessage',
	component: ErrorMessage,
	args: { status: 404, homeHref: '#' }
} satisfies Meta<typeof ErrorMessage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NoSuchPage: Story = {};

export const DidNotLoad: Story = {
	args: { status: 500, onretry: () => {} }
};
