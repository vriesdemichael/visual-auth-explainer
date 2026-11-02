import type { Meta, StoryObj } from '@storybook/sveltekit';
import FollowPath from '#lib/components/FollowPath.svelte';

const meta = {
	title: 'FollowPath',
	component: FollowPath,
	args: {
		label: 'code',
		stops: [
			{ step: 'redirect-with-code', says: 'First sent here' },
			{ step: 'callback', says: 'Sent here' },
			{ step: 'token-request', says: 'Sent here' }
		],
		current: 'callback',
		numberOf: (step: string) =>
			({ 'redirect-with-code': 6, callback: 7, 'token-request': 8 })[step] ?? null,
		onstep: () => {},
		onstop: () => {}
	}
} satisfies Meta<typeof FollowPath>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OneThing: Story = {};

export const TwoFormsOfOneThing: Story = {
	args: {
		label: 'code verifier',
		stops: [
			{ step: 'make-verifier', says: 'Made here' },
			{ step: 'redirect-to-idp', says: 'Code challenge: sent here' },
			{ step: 'authorize', says: 'Code challenge: sent here' },
			{ step: 'token-request', says: 'Code verifier: sent here' },
			{ step: 'check-verifier', says: 'Checked here' }
		],
		current: 'authorize',
		numberOf: (step: string) =>
			(
				({
					'make-verifier': 2,
					'redirect-to-idp': 3,
					authorize: 4,
					'token-request': 9,
					'check-verifier': 10
				}) as Record<string, number>
			)[step] ?? null
	}
};

export const UsedUp: Story = {
	args: {
		stops: [
			{ step: 'callback', says: 'Sent here' },
			{ step: 'real-app-refused', says: 'Refused here: a real server counted it as used' }
		],
		current: 'real-app-refused',
		numberOf: (step: string) => (step === 'callback' ? 11 : 13)
	}
};
