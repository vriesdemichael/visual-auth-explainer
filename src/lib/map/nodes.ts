import { flows, presets } from '#lib/flow/index.ts';
import { evaluate, type DiagramId, type FlowDef } from '#lib/flow/model.ts';
import { defaultSettings, normalize, settingIds, type Settings } from '#lib/flow/settings.ts';
import { resolveStep, serializeState, type AppState } from '#lib/flow/state.ts';
import type { Mode } from '#lib/flow/vocabulary.ts';

/**
 * A node is a question someone brings, and the exact state that answers it. It has an address of its
 * own so it can be found and prerendered, but a state on the one application screen is all it is
 * (ADR-003). Settings come from a named state, so every node in advanced mode has a recording.
 */
export interface MapNode {
	id: string;
	title: string;
	summary: string;
	flow: string;
	diagram: DiagramId;
	mode: Mode;
	preset: string;
	/** Where to start, when that is not the first step. */
	step?: string;
}

export interface MapTrack {
	id: string;
	title: string;
	lead: string;
	/** Each chain builds from left to right. */
	chains: readonly (readonly MapNode[])[];
}

const FLOW = 'authorization-code';
const node = (fields: Omit<MapNode, 'flow' | 'diagram' | 'mode'> & Partial<MapNode>): MapNode => ({
	flow: FLOW,
	diagram: 'flow',
	mode: 'simple',
	...fields
});

export const mapTracks: readonly MapTrack[] = [
	{
		id: 'start',
		title: 'Start here',
		lead: 'What everything else builds on, in plain words.',
		chains: [
			[
				node({
					id: 'how-access-works',
					title: 'How does an app get access?',
					summary: 'An app acts for a user, without ever seeing their password.',
					preset: 'oauth'
				}),
				node({
					id: 'who-logged-in',
					title: 'How does an app know who logged in?',
					summary: 'Access is not identity, which is what OpenID Connect adds.',
					preset: 'oidc'
				}),
				node({
					id: 'getting-to-know-each-other',
					title: 'How do an app and a provider get to know each other?',
					summary: 'What people have to do before anyone can log in.',
					diagram: 'setup',
					preset: 'oauth'
				})
			]
		]
	},
	{
		id: 'safe',
		title: 'Keeping it safe',
		lead: 'What can go wrong, and what stops it.',
		chains: [
			[
				node({
					id: 'stolen-code',
					title: 'What if someone steals the code?',
					summary: 'An app with no secret, and a code that crosses the browser.',
					preset: 'public',
					step: 'token-request'
				}),
				node({
					id: 'pkce',
					title: 'How does PKCE stop that?',
					summary: 'The app proves it started this login, with a value that never crossed.',
					preset: 'public-pkce',
					step: 'make-verifier'
				}),
				node({
					id: 'pkce-with-a-secret',
					title: 'Does an app with a secret need it too?',
					summary: 'Why current advice says yes, even when a stolen code is not enough alone.',
					preset: 'pkce',
					step: 'token-request'
				})
			],
			[
				node({
					id: 'stolen-token',
					title: 'What if someone steals the token?',
					summary: 'DPoP ties a token to a key that never leaves the app.',
					preset: 'dpop',
					step: 'api-request'
				}),
				node({
					id: 'dpop-nonce',
					title: 'How can a proof be stopped from being used later?',
					summary: 'A nonce from the server. The spec allows it, and Keycloak did not ask.',
					preset: 'dpop-nonce',
					step: 'nonce-challenge'
				})
			]
		]
	},
	{
		id: 'elsewhere',
		title: 'Logging in somewhere else',
		lead: 'When the identity provider hands the login to another one.',
		chains: [
			[
				node({
					id: 'another-provider',
					title: 'How do you log in with another provider?',
					summary: 'The app does not notice, and that is the point.',
					preset: 'broker'
				}),
				node({
					id: 'calling-the-other-provider',
					title: "How does the app call the other provider's API?",
					summary: 'The identity provider kept its tokens, and hands them over.',
					mode: 'advanced',
					preset: 'upstream-v1',
					step: 'retrieve-upstream-token'
				}),
				node({
					id: 'token-api-v2',
					title: 'What changes with API V2?',
					summary: 'Only the access token, and the client has to be allowed to ask.',
					mode: 'advanced',
					preset: 'upstream-v2',
					step: 'retrieve-upstream-token'
				})
			]
		]
	},
	{
		id: 'real',
		title: 'Setting up a real app',
		lead: 'The combinations people use, with what is really sent.',
		chains: [
			[
				node({
					id: 'web-app',
					title: 'A web app, set up the way it should be',
					summary: 'On a server that can keep a secret, with OpenID Connect and PKCE.',
					mode: 'advanced',
					preset: 'oidc-pkce',
					step: 'authorize'
				}),
				node({
					id: 'browser-app',
					title: 'An app that runs in the browser',
					summary: 'No secret to keep, so PKCE does the work.',
					mode: 'advanced',
					preset: 'browser-app',
					step: 'token-request'
				})
			]
		]
	},
	{
		id: 'under-the-hood',
		title: 'Under the hood',
		lead: 'For when you are looking at the real thing and something is off.',
		chains: [
			[
				node({
					id: 'on-the-wire',
					title: 'What really goes over the wire?',
					summary: 'The raw request and answer, from one real run.',
					mode: 'advanced',
					preset: 'oauth',
					step: 'token-request'
				}),
				node({
					id: 'redirect-uri-error',
					title: 'Why do I get Invalid parameter: redirect_uri?',
					summary: 'Where the address is checked, and where it was registered.',
					mode: 'advanced',
					preset: 'oauth',
					step: 'authorize'
				}),
				node({
					id: 'what-is-in-my-token',
					title: 'Why does my access token say that?',
					summary: 'Open it, and see which setting put each thing there.',
					mode: 'advanced',
					preset: 'oauth',
					step: 'token-response'
				}),
				node({
					id: 'everything',
					title: 'What does it all look like at once?',
					summary: 'Every setting on, to see how far one diagram stretches.',
					mode: 'advanced',
					preset: 'everything'
				})
			]
		]
	}
];

export const mapNodes: readonly MapNode[] = mapTracks.flatMap((track) => track.chains.flat());

export function nodeSettings(of: MapNode): Settings {
	const preset = presets.find((candidate) => candidate.id === of.preset);
	if (!preset) throw new Error(`No named state ${of.preset}`);
	return normalize({ ...defaultSettings, ...preset.settings }).settings;
}

const flowOf = (of: MapNode): FlowDef => flows[of.flow].diagrams[of.diagram];

export function nodeState(of: MapNode): AppState {
	const settings = nodeSettings(of);
	const flow = flowOf(of);
	return {
		flow: of.flow,
		diagram: of.diagram,
		mode: of.mode,
		settings,
		step: resolveStep(flow, evaluate(flow, settings), of.step ?? null),
		source: null,
		explained: null,
		serverNotes: true
	};
}

export const nodeView = (of: MapNode) => evaluate(flowOf(of), nodeSettings(of));

/** The state as a query, which a query on the address itself adds to. */
export function nodeSearch(of: MapNode, added = ''): string {
	const search = new URLSearchParams(serializeState(flows[of.flow], nodeState(of)));
	for (const [name, value] of new URLSearchParams(added)) search.set(name, value);
	return search.toString();
}

const sameSettings = (a: Settings, b: Settings) => settingIds.every((id) => a[id] === b[id]);

/** The node someone is at, going by what is on screen. Stepping through it is still being at it. */
export function nodeMatching(state: AppState): MapNode | null {
	const same = mapNodes.filter(
		(candidate) =>
			candidate.flow === state.flow &&
			candidate.diagram === state.diagram &&
			sameSettings(nodeSettings(candidate), state.settings)
	);
	const exact = same.find((candidate) => nodeState(candidate).step === state.step);
	const inThisMode = same.find((candidate) => candidate.mode === state.mode);
	return exact ?? inThisMode ?? same[0] ?? null;
}
