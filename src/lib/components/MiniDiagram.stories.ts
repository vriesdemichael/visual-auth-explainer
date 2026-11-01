import type { Meta, StoryObj } from '@storybook/sveltekit';
import MiniDiagram from '#lib/components/MiniDiagram.svelte';
import { authorizationCode as flow } from '#lib/flow/authorization-code.ts';
import { authorizationCodeSetup as setup } from '#lib/flow/authorization-code-setup.ts';
import { evaluate } from '#lib/flow/model.ts';
import { defaultSettings } from '#lib/flow/settings.ts';

const meta = {
	title: 'MiniDiagram',
	component: MiniDiagram,
	args: { view: evaluate(flow, defaultSettings) },
	parameters: { layout: 'padded' }
} satisfies Meta<typeof MiniDiagram>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TheBasicFlow: Story = {};

export const WithPeople: Story = { args: { view: evaluate(setup, defaultSettings) } };

export const WithEverythingOn: Story = {
	args: {
		view: evaluate(flow, {
			...defaultSettings,
			oidc: true,
			pkce: true,
			binding: 'dpop',
			dpopNonce: true,
			broker: true,
			upstreamTokens: 'v1'
		})
	}
};

export const WhatASettingAdds: Story = {
	args: {
		view: evaluate(flow, { ...defaultSettings, oidc: true }),
		base: evaluate(flow, defaultSettings)
	}
};

export const AboutOneMessage: Story = {
	args: { about: 'token-request', base: evaluate(flow, defaultSettings) }
};
