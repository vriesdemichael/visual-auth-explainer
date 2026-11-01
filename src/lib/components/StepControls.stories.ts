import type { Meta, StoryObj } from '@storybook/sveltekit';
import StepControls from '#lib/components/StepControls.svelte';

const meta = {
	title: 'StepControls',
	component: StepControls,
	args: {
		position: 3,
		total: 12,
		canGoBack: true,
		onback: () => {},
		onnext: () => {},
		parts: [
			{ label: 'Ask', why: 'Why asking.', steps: ['a', 'b', 'c', 'd'] },
			{ label: 'Log in', why: 'Why logging in.', steps: ['e', 'f', 'g'] },
			{ label: 'Trade', why: 'Why trading.', steps: ['h', 'i', 'j', 'k', 'l'] }
		],
		current: 'c',
		onjump: () => {}
	}
} satisfies Meta<typeof StepControls>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Middle: Story = {};

export const AtTheVeryStart: Story = {
	args: { position: 1, canGoBack: false, current: 'a' }
};

export const Playing: Story = {
	args: { playing: true }
};

export const WhereExecuteAddsSomething: Story = {
	args: { position: 8, answerAt: 9 }
};

export const AtTheEnd: Story = {
	args: { position: 12 }
};

export const AtTheEndWithAQuestionToGoOnTo: Story = {
	args: { position: 12, onwardHref: '#next' }
};

export const AtTheEndWithNowhereToGo: Story = {
	args: { position: 12 }
};
