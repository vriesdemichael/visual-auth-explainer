import type { Meta, StoryObj } from '@storybook/sveltekit';
import EyesSwitch from '#lib/components/EyesSwitch.svelte';

const meta = {
	title: 'EyesSwitch',
	component: EyesSwitch,
	args: {
		parties: [
			{ id: 'browser', name: "User's browser" },
			{ id: 'app', name: 'App' },
			{ id: 'idp', name: 'Identity provider' },
			{ id: 'api', name: 'API' }
		],
		current: null,
		onchange: () => {}
	}
} satisfies Meta<typeof EyesSwitch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Everyone: Story = {};

export const OneParty: Story = { args: { current: 'browser' } };
