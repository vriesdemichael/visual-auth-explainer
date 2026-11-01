import type { Meta, StoryObj } from '@storybook/sveltekit';
import LearningMap from '#lib/components/LearningMap.svelte';
import { mapTracks } from '#lib/map/tracks.ts';

const meta = {
	title: 'LearningMap',
	component: LearningMap,
	parameters: { layout: 'padded' },
	args: { tracks: mapTracks, hrefOf: (node) => `#${node.id}` }
} satisfies Meta<typeof LearningMap>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TheWholeMap: Story = {};

export const ComingBackFromANode: Story = { args: { current: 'pkce' } };

export const WithAQuestionOnShow: Story = { args: { showing: 'who-logged-in' } };

export const OneTrack: Story = { args: { tracks: mapTracks.slice(0, 1) } };
