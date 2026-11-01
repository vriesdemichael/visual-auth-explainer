import type { Meta, StoryObj } from '@storybook/sveltekit';
import SearchDialog from '#lib/components/SearchDialog.svelte';
import { searchState } from '#lib/search/open.svelte.ts';

const meta = {
	title: 'SearchDialog',
	component: SearchDialog,
	args: { hrefOf: () => '#', mapHref: '#' },
	beforeEach: () => {
		searchState.open = true;
		return () => {
			searchState.open = false;
		};
	}
} satisfies Meta<typeof SearchDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {};
