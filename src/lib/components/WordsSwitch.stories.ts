import type { Meta, StoryObj } from '@storybook/sveltekit';
import WordsSwitch from '#lib/components/WordsSwitch.svelte';

const meta = {
	title: 'WordsSwitch',
	component: WordsSwitch,
	args: { current: 'plain', serverNotes: true, onchange: () => {} }
} satisfies Meta<typeof WordsSwitch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PlainWords: Story = {};

export const TheSpecs: Story = { args: { current: 'specs' } };

export const WithoutTheServer: Story = { args: { serverNotes: false } };
