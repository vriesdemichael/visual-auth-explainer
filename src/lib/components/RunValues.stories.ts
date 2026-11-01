import type { Meta, StoryObj } from '@storybook/sveltekit';
import RunValues from '#lib/components/RunValues.svelte';
import type { Recording } from '#lib/recordings/format.ts';
import { traceRun } from '#lib/recordings/wire.ts';
import oauth from '../../../static/recordings/authorization-code/oauth.json';

const trace = traceRun(oauth as Recording);

const meta = {
	title: 'RunValues',
	component: RunValues,
	args: { values: trace, numberOf: () => 7 }
} satisfies Meta<typeof RunValues>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EverythingAtTheEnd: Story = {};

export const JustTheFirstValue: Story = { args: { values: trace.slice(0, 1) } };

export const NothingYet: Story = { args: { values: [] } };
