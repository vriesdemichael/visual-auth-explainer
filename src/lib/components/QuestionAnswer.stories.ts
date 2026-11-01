import type { Meta, StoryObj } from '@storybook/sveltekit';
import QuestionAnswer from '#lib/components/QuestionAnswer.svelte';

const meta = {
	title: 'QuestionAnswer',
	component: QuestionAnswer,
	args: {
		answer:
			'OAuth alone only gives the app access, and does not tell it who logged in. OpenID Connect adds an ID token that does, made for the app to read.'
	}
} satisfies Meta<typeof QuestionAnswer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AtTheStart: Story = {};

export const PartWayThrough: Story = {
	args: { onrewind: () => {} }
};
