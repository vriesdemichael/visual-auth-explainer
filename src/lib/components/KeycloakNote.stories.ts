import type { Meta, StoryObj } from '@storybook/sveltekit';
import KeycloakNote from '#lib/components/KeycloakNote.svelte';
import { defaultSettings, type Settings } from '#lib/flow/settings.ts';
import { notesFor } from '#lib/keycloak/notes.ts';

const noteOn = (step: string, id: string, settings: Partial<Settings> = {}) => {
	const note = notesFor('authorization-code', step, { ...defaultSettings, ...settings }).find(
		(n) => n.id === id
	);
	if (!note) throw new Error(`No note ${id} on ${step}`);
	return note;
};

const meta = {
	title: 'KeycloakNote',
	component: KeycloakNote,
	args: { note: noteOn('authorize', 'valid-redirect-uris'), version: '26.8.1' }
} satisfies Meta<typeof KeycloakNote>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AtAPlaceInTheConsole: Story = {};

export const WithAFeatureFlag: Story = {
	args: {
		note: noteOn('retrieve-upstream-token', 'allow-external-tokens', {
			broker: true,
			upstreamTokens: 'v2'
		})
	}
};

export const AServerOption: Story = {
	args: {
		note: noteOn('retrieve-upstream-token', 'brokering-api-flags', {
			broker: true,
			upstreamTokens: 'v1'
		})
	}
};

export const WhatItDidNotDo: Story = {
	args: { note: noteOn('nonce-challenge', 'no-dpop-nonce', { binding: 'dpop', dpopNonce: true }) }
};
