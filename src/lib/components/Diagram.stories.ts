import type { Meta, StoryObj } from '@storybook/sveltekit';
import Diagram from '#lib/components/Diagram.svelte';
import { freshIds } from '#lib/diagram/fresh.ts';
import { layoutDiagram } from '#lib/diagram/layout.ts';
import { authorizationCode as flow } from '#lib/flow/authorization-code.ts';
import { authorizationCodeSetup as setup } from '#lib/flow/authorization-code-setup.ts';
import { diffViews, evaluate, holdingsAt } from '#lib/flow/model.ts';
import { defaultSettings, type Settings } from '#lib/flow/settings.ts';

const layoutFor = (settings: Partial<Settings> = {}) =>
	layoutDiagram(evaluate(flow, { ...defaultSettings, ...settings }));
const setupFor = (settings: Partial<Settings> = {}) =>
	layoutDiagram(evaluate(setup, { ...defaultSettings, ...settings }));

const meta = {
	title: 'Diagram',
	component: Diagram,
	args: { layout: layoutFor(), currentStep: 'authorize', animate: false }
} satisfies Meta<typeof Diagram>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OAuth: Story = {};

export const OpenIdConnect: Story = {
	args: {
		layout: layoutFor({ oidc: true }),
		currentStep: 'token-response',
		holdings: holdingsAt(evaluate(flow, { ...defaultSettings, oidc: true }), 'token-response')
	}
};

export const OpenIdConnectJustChanged: Story = {
	args: {
		layout: layoutFor({ oidc: true }),
		currentStep: 'token-response',
		fresh: freshIds(
			diffViews(evaluate(flow, defaultSettings), evaluate(flow, { ...defaultSettings, oidc: true }))
		)
	}
};

export const DPoP: Story = {
	args: { layout: layoutFor({ binding: 'dpop' }), currentStep: 'token-request' }
};

export const DPoPWithNonceRetry: Story = {
	args: { layout: layoutFor({ binding: 'dpop', dpopNonce: true }), currentStep: 'nonce-challenge' }
};

export const Brokered: Story = {
	args: { layout: layoutFor({ broker: true }), currentStep: 'upstream-authorize' }
};

export const StoredUpstreamTokens: Story = {
	args: {
		layout: layoutFor({ broker: true, upstreamTokens: 'v2' }),
		currentStep: 'retrieve-upstream-token'
	}
};

export const EverythingOn: Story = {
	args: {
		layout: layoutFor({
			oidc: true,
			binding: 'dpop',
			dpopNonce: true,
			broker: true,
			upstreamTokens: 'v2'
		}),
		currentStep: 'token-request'
	}
};

export const Setup: Story = {
	args: { layout: setupFor(), currentStep: 'register-client' }
};

export const SetupAtAnHttpMessage: Story = {
	args: { layout: setupFor(), currentStep: 'discover' }
};

export const SetupWithAnExternalIdP: Story = {
	args: {
		layout: setupFor({ broker: true, upstreamTokens: 'v2' }),
		currentStep: 'register-with-upstream'
	}
};
