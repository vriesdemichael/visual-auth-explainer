import type { Meta, StoryObj } from '@storybook/sveltekit';
import Workspace from '#lib/components/Workspace.svelte';
import { authorizationCodeBase as base } from '#lib/flow/index.ts';
import { parseState } from '#lib/flow/state.ts';

const meta = {
	title: 'Workspace',
	component: Workspace,
	parameters: { layout: 'fullscreen' },
	args: {
		base,
		state: parseState(base, 'flow', ''),
		animate: false,
		homeHref: '#',
		hrefFor: () => '#',
		onnavigate: () => {}
	}
} satisfies Meta<typeof Workspace>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AtAStepWithFields: Story = {
	args: { state: parseState(base, 'flow', 'oidc=1&step=token-response') }
};

export const Setup: Story = {
	args: { state: parseState(base, 'setup', '') }
};

export const SetupWithAnExternalIdP: Story = {
	args: { state: parseState(base, 'setup', 'broker=1&upstream=v2&step=enable-token-storage') }
};
