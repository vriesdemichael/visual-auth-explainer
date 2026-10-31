import type { Meta, StoryObj } from '@storybook/sveltekit';
import SourcePanel from '#lib/components/SourcePanel.svelte';
import { sources } from '#lib/sources/sources.ts';

// A stand-in, because a story should not depend on where the real files are served.
const shortRfc = `Request for Comments: 0000

Table of Contents

   1. First .......................................................... 1
   2. Second ......................................................... 2

1.  First

   The first section, which is short.

2.  Second

2.1.  A subsection

   The second section is short as well.
`;

const meta = {
	title: 'SourcePanel',
	component: SourcePanel,
	args: {
		source: sources.rfc9449,
		why: 'This is the DPoP option: the app also has to prove it holds the key.',
		loadText: () => Promise.resolve(shortRfc),
		onsection: () => {},
		onclose: () => {}
	}
} satisfies Meta<typeof SourcePanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AnRfc: Story = {};

export const AnRfcOpenAtASection: Story = {
	args: { section: '2.1' }
};

export const AnRfcStillLoading: Story = {
	args: { loadText: () => new Promise(() => {}) }
};

export const AnRfcThatFailedToLoad: Story = {
	args: { loadText: () => Promise.reject(new Error('Offline')) }
};

export const NotAnRfc: Story = {
	args: {
		source: sources['oidc-core'],
		why: 'This switch adds what it defines on top of OAuth: the openid scope, the ID token and UserInfo.'
	}
};

export const KeycloakDocs: Story = {
	args: {
		source: sources['keycloak-stored-tokens'],
		why: 'The two API options here are the two versions this page describes.'
	}
};
