import type { Meta, StoryObj } from '@storybook/sveltekit';
import Workspace from '#lib/components/Workspace.svelte';
import { authorizationCodeBase as base } from '#lib/flow/index.ts';
import { secondFlow } from '#lib/flow/second-flow.fixture.ts';
import { parseState } from '#lib/flow/state.ts';
import type { Recording } from '#lib/recordings/format.ts';
import oidc from '../../../static/recordings/authorization-code/oidc.json';

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
		loadText: () => Promise.resolve('1.  Introduction\n\n   A stand-in for the text of an RFC.\n'),
		loadRecording: () => Promise.resolve(oidc as Recording),
		onnavigate: () => {}
	}
} satisfies Meta<typeof Workspace>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const FollowingTheCode: Story = {
	args: { state: parseState(base, 'flow', 'follow=code&step=callback') }
};

export const SeenAsTheBrowser: Story = {
	args: { state: parseState(base, 'flow', 'eyes=browser&step=token-response') }
};

export const AtAStepWithFields: Story = {
	args: { state: parseState(base, 'flow', 'oidc=1&step=token-response') }
};

export const Setup: Story = {
	args: { state: parseState(base, 'setup', '') }
};

export const SetupWithAnExternalIdP: Story = {
	args: { state: parseState(base, 'setup', 'broker=1&upstream=v2&step=enable-token-storage') }
};

export const Advanced: Story = {
	args: { state: parseState(base, 'flow', 'mode=advanced&oidc=1&step=token-response') }
};

export const WithSomethingExplained: Story = {
	args: { state: parseState(base, 'flow', 'step=callback&explain=artifact.code') }
};

export const WithASourceOpen: Story = {
	args: { state: parseState(base, 'flow', 'binding=dpop&source=rfc9449&for=binding') }
};

export const ASecondBaseFlow: Story = {
	args: { base: secondFlow, state: parseState(secondFlow, 'flow', '') }
};

export const WithTheSettingsOutOfTheWay: Story = {
	args: { state: parseState(base, 'flow', 'settings=off&step=token-request') }
};

export const AnsweringAQuestion: Story = {
	args: {
		question: 'How does an app get access?',
		state: parseState(base, 'flow', 'step=api-response'),
		onward: {
			title: 'How does an app know who logged in?',
			summary: 'Access is not identity, which is what OpenID Connect adds.',
			href: '#next'
		}
	}
};
