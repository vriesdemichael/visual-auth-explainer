import type { Meta, StoryObj } from '@storybook/sveltekit';
import CopyBlock from '#lib/components/CopyBlock.svelte';

const meta = {
	title: 'CopyBlock',
	component: CopyBlock,
	args: { label: 'the command', text: "curl -i -X POST 'http://localhost:18080/token'" }
} satisfies Meta<typeof CopyBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OneLine: Story = {};

export const LongEnoughToScroll: Story = {
	args: { text: Array.from({ length: 40 }, (_, i) => `line ${i + 1} of a realm file`).join('\n') }
};
