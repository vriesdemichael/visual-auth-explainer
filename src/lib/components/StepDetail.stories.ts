import type { Meta, StoryObj } from '@storybook/sveltekit';
import StepDetail from '#lib/components/StepDetail.svelte';
import { authorizationCode as flow } from '#lib/flow/authorization-code.ts';
import { authorizationCodeSetup as setup } from '#lib/flow/authorization-code-setup.ts';
import { diffViews, evaluate } from '#lib/flow/model.ts';
import { defaultSettings, type Settings } from '#lib/flow/settings.ts';

const view = (settings: Partial<Settings> = {}) =>
	evaluate(flow, { ...defaultSettings, ...settings });
const stepIn = (id: string, settings: Partial<Settings> = {}) => {
	const step = view(settings).steps.find((candidate) => candidate.id === id);
	if (!step) throw new Error(`No step ${id}`);
	return step;
};

const meta = {
	title: 'StepDetail',
	component: StepDetail,
	args: { step: stepIn('authorize'), lifelines: view().lifelines }
} satisfies Meta<typeof StepDetail>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Request: Story = {};

export const WithFieldsFromSettings: Story = {
	args: { step: stepIn('authorize', { oidc: true, binding: 'dpop' }) }
};

export const NoFields: Story = {
	args: { step: stepIn('open-app') }
};

export const Internal: Story = {
	args: { step: stepIn('validate-id-token', { oidc: true }) }
};

export const PeopleNotHttp: Story = {
	args: {
		step: evaluate(setup, defaultSettings).steps[0],
		lifelines: evaluate(setup, defaultSettings).lifelines
	}
};

export const Simple: Story = {
	args: { mode: 'simple', step: stepIn('token-response', { oidc: true }) }
};

export const SimpleOnTheFirstStep: Story = {
	args: { mode: 'simple', step: stepIn('open-app'), intro: flow.intro }
};

export const SimpleWithAPitfall: Story = {
	args: { mode: 'simple' }
};

export const AfterAChangeSayingWhy: Story = {
	args: { mode: 'simple', change: diffViews(view(), view({ oidc: true })), changed: 'oidc' }
};

export const WithALinkToTheOtherDiagram: Story = {
	args: { links: [{ text: 'See where the redirect URI was registered', href: '#' }] }
};

export const ASettingThatOnlyChangesTheOtherDiagram: Story = {
	args: { elsewhere: { text: 'It changes the user flow.', href: '#' } }
};

export const OnlyBecauseOfASetting: Story = {
	args: {
		step: stepIn('upstream-authorize', { broker: true }),
		lifelines: view({ broker: true }).lifelines
	}
};

export const AfterAChange: Story = {
	args: { change: diffViews(view(), view({ oidc: true })) }
};

export const AfterAChangeThatResetAnother: Story = {
	args: {
		change: diffViews(
			view({ broker: true, upstreamTokens: 'v2' }),
			view({ broker: true, clientType: 'public' })
		),
		resets: [
			{
				setting: 'upstreamTokens',
				because: 'API V2 only works with a confidential client and a Bearer token.'
			}
		]
	}
};
