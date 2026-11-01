import type { KeycloakFlag } from '#lib/flow/settings.ts';
import { recordedIndex } from '#lib/recordings/known.ts';

const FLAG_WORDS: Readonly<Record<string, string>> = {
	DEFAULT: 'supported, on by default',
	DISABLED_BY_DEFAULT: 'supported, off by default',
	PREVIEW: 'preview, off by default',
	EXPERIMENTAL: 'experimental, off by default',
	DEPRECATED: 'deprecated, off by default'
};

/** In the words of Keycloak's own docs, with what a real server reported. */
export function flagStatus(flag: KeycloakFlag): string {
	const status = recordedIndex.flags[flag.name];
	const words = FLAG_WORDS[status?.type] ?? 'status not recorded';
	return flag.docs ? `${words}. ${flag.docs}` : words;
}
