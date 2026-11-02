import type { Meta, StoryObj } from '@storybook/sveltekit';
import LeftToYouPanel from '#lib/components/LeftToYouPanel.svelte';
import { authorizationCodeBase as base, clientCredentialsBase } from '#lib/flow/index.ts';
import { leftToYou } from '#lib/flow/left-to-you.ts';
import { defaultSettings } from '#lib/flow/settings.ts';
import { sayer } from '#lib/flow/wording.ts';

const meta = {
	title: 'LeftToYouPanel',
	component: LeftToYouPanel,
	args: {
		list: leftToYou(base, { ...defaultSettings, oidc: true }, sayer('plain')),
		onclose: () => {}
	}
} satisfies Meta<typeof LeftToYouPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AddingLogin: Story = {};

export const InTheSpecsWords: Story = {
	args: { list: leftToYou(base, { ...defaultSettings, oidc: true }, sayer('specs')) }
};

export const WithNoLogin: Story = {
	args: { list: leftToYou(base, defaultSettings, sayer('plain')) }
};

export const WithNoUser: Story = {
	args: { list: leftToYou(clientCredentialsBase, defaultSettings, sayer('plain')) }
};
