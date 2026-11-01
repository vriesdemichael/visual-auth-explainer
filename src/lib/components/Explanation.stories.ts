import type { Meta, StoryObj } from '@storybook/sveltekit';
import Explanation from '#lib/components/Explanation.svelte';
import { settingDefs } from '#lib/flow/settings.ts';
import { artifacts } from '#lib/flow/vocabulary.ts';

const meta = {
	title: 'Explanation',
	component: Explanation,
	args: {
		title: 'Identity provider',
		text: 'The identity provider, or IdP, logs users in and issues tokens.',
		onclose: () => {}
	}
} satisfies Meta<typeof Explanation>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ALifelineThatHasSeenThings: Story = {
	args: { seen: ['secret', 'password', 'code'], onseeonly: () => {} }
};

export const ALifelineWhoseViewIsShown: Story = {
	args: { seen: ['secret', 'password', 'code'], onseeonly: () => {}, seeingOnly: true }
};

export const ALifelineThatHasSeenNothing: Story = {
	args: { seen: [] }
};

export const AToken: Story = {
	args: {
		title: artifacts.code.label,
		text: artifacts.code.explains,
		seenBy: ["User's browser", 'Identity provider']
	}
};

export const ATokenNobodyHasYet: Story = {
	args: {
		title: artifacts['access-token'].label,
		text: artifacts['access-token'].explains,
		seenBy: []
	}
};

export const ASetting: Story = {
	args: {
		title: settingDefs.oidc.label,
		text: settingDefs.oidc.why,
		sources: settingDefs.oidc.sources
	}
};
