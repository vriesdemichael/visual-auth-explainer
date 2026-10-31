import type { Meta, StoryObj } from '@storybook/sveltekit';
import Workspace from '#lib/components/Workspace.svelte';
import { authorizationCode as flow } from '#lib/flow/authorization-code.ts';
import { parseState } from '#lib/flow/state.ts';

const meta = {
	title: 'Workspace',
	component: Workspace,
	parameters: { layout: 'fullscreen' },
	args: {
		flow,
		state: parseState(flow, ''),
		animate: false,
		homeHref: '#',
		onnavigate: () => {}
	}
} satisfies Meta<typeof Workspace>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AtAStepWithFields: Story = {
	args: { state: parseState(flow, 'oidc=1&step=token-response') }
};
