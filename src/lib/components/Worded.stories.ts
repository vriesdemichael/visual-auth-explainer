import type { Meta, StoryObj } from '@storybook/sveltekit';
import Worded from '#lib/components/Worded.svelte';
import { markTerms } from '#lib/flow/glossary.ts';

const [segments] = markTerms([
	'The identity provider checks the redirect URI, and sends back the code through a redirect.'
]);

const meta = {
	title: 'Worded',
	component: Worded,
	args: { segments, onterm: () => {} }
} satisfies Meta<typeof Worded>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithTerms: Story = {};

export const NothingToSelect: Story = {
	args: { onterm: undefined }
};
