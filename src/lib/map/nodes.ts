import { flows } from '#lib/flow/index.ts';
import { evaluate, type DiagramId, type DiagramDef } from '#lib/flow/model.ts';
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
					id: 'when-do-i-get-asked',
					title: 'When does the user get asked?',
					summary: 'What a scope is, and why you may never have seen the question.',
					preset: 'consent',
					step: 'consent-page'
				}),
				node({
					id: 'getting-to-know-each-other',
					title: 'How do an app and a provider get to know each other?',
					summary: 'What people have to do before anyone can log in.',
					diagram: 'setup',
					preset: 'oauth'
				})
			],
			[
				node({
					id: 'adding-login',
					title: 'I have to add login to an app. What do I do?',
					summary:
						'The part you do once, which part of your code is left, and what a library does.',
					diagram: 'setup',
					preset: 'oidc'
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
					id: 'no-secret',
					title: 'What is different about an app with no secret?',
					summary: 'An app in a browser or on a phone cannot keep one, so what proves who it is?',
					preset: 'public',
					step: 'token-request'
				}),
				node({
					id: 'stolen-code',
					title: 'What if someone steals the code?',
					summary: 'Watch them take it as it crosses the browser, and get the tokens.',
					preset: 'attack-public',
					step: 'attacker-steals-code'
				}),
				node({
					id: 'pkce',
					title: 'How does PKCE work?',
					summary:
						'The app proves it started this login, with a value that was never in a redirect.',
					preset: 'public-pkce',
					step: 'make-verifier'
				}),
				node({
					id: 'pkce-stops-it',
					title: 'What does PKCE do to the attacker?',
					summary: 'The same attempt, a different answer, and a cost that remains.',
					preset: 'attack-public-pkce',
					step: 'attacker-token-response'
				})
			],
			[
				node({
					id: 'stolen-from-a-secret',
					title: 'Can a code be stolen from an app with a secret?',
					summary: 'They get the code, but cannot trade it. That is not the end of it.',
					preset: 'attack-confidential',
					step: 'attacker-token-response'
				}),
				node({
					id: 'pkce-with-a-secret',
					title: 'Does an app with a secret need PKCE too?',
					summary: 'Why current advice says yes, even when a stolen code is not enough alone.',
					preset: 'pkce',
					step: 'token-request'
				}),
				node({
					id: 'both-protections',
					title: 'What does an attacker get against both?',
					summary: 'A secret and PKCE together, against the same attempt.',
					preset: 'attack-confidential-pkce',
					step: 'attacker-token-response'
				})
			],
			[
				node({
					id: 'stolen-token',
					title: 'How does DPoP stop a stolen token being used?',
					summary:
						'It ties a token to a key that never leaves the app. The theft itself is not drawn.',
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
					title: 'What changes with API V2 for stored tokens?',
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
					title: 'A web app on a server',
					summary:
						'It can keep a secret. With OpenID Connect to know who logged in, and PKCE on top.',
					mode: 'advanced',
					preset: 'oidc-pkce'
				}),
				node({
					id: 'browser-app',
					title: 'An app that runs in the browser',
					summary:
						'No secret to keep, so PKCE protects the code. The tokens then live in the page, which is the harder problem.',
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
					summary: 'As much as fits together, to see how far one diagram stretches.',
					mode: 'advanced',
					preset: 'everything'
				})
			]
		]
	}
];

export const mapNodes: readonly MapNode[] = mapTracks.flatMap((track) => track.chains.flat());

export function nodeSettings(of: MapNode): Settings {
	const preset = flows[of.flow].presets.find((candidate) => candidate.id === of.preset);
	if (!preset) throw new Error(`No named state ${of.preset}`);
	return normalize({ ...defaultSettings, ...preset.settings }).settings;
}

const diagramOf = (of: MapNode): DiagramDef => flows[of.flow].diagrams[of.diagram];

export function nodeState(of: MapNode): AppState {
	const settings = nodeSettings(of);
	const flow = diagramOf(of);
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

export const nodeView = (of: MapNode) => evaluate(diagramOf(of), nodeSettings(of));

/** The same diagram with nothing switched on, which is what a node's diagram adds to. */
export const nodeBaseView = (of: MapNode) => evaluate(diagramOf(of), defaultSettings);

/** The question to go on to, in the order the map lays them out. */
export const nextQuestion = (of: MapNode): MapNode | null =>
	mapNodes[mapNodes.indexOf(of) + 1] ?? null;

/** The state as a query, which a query on the address itself adds to. */
export function nodeSearch(of: MapNode, added = ''): string {
	const search = new URLSearchParams(serializeState(flows[of.flow], nodeState(of)));
	for (const [name, value] of new URLSearchParams(added)) search.set(name, value);
	return search.toString();
}

const sameSettings = (a: Settings, b: Settings) => settingIds.every((id) => a[id] === b[id]);

/** Whether what is on screen still answers this question, wherever someone has stepped to. */
export const stillAnswers = (of: MapNode, state: AppState) =>
	state.flow === of.flow &&
	state.diagram === of.diagram &&
	sameSettings(nodeSettings(of), state.settings);

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
