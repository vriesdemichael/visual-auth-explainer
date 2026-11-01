// What scripts/break-on-purpose.mjs tries. Only what the unit tests can see, because each one runs them
// again and the click-through takes minutes. See the end of ADR-006.
const AC = 'src/lib/flow/authorization-code.ts';
const NOTES = 'src/lib/keycloak/notes.ts';
const SHAPE = 'src/lib/recordings/shape.ts';
const CHECK = 'src/lib/recordings/check.ts';
const NODES = 'src/lib/map/nodes.ts';
const LAYOUT = 'src/lib/diagram/layout.ts';
const STATE = 'src/lib/flow/state.ts';
const MODEL = 'src/lib/flow/model.ts';

export const breakages = [
	// The attacker, in the words simple mode uses.
	{
		name: 'attacker: says they get the tokens with PKCE on',
		file: AC,
		from: "{ when: stoppedByPkce, text: 'Refused: they have no verifier' },",
		to: "{ when: stoppedByPkce, text: 'They get the tokens' },"
	},
	{
		name: 'attacker: says they get the tokens against a secret',
		file: AC,
		from: "{ text: 'Refused: they have no secret' }",
		to: "{ text: 'They get the tokens' }"
	},
	{
		name: 'attacker: their request without the verifier reads as the real app',
		file: AC,
		from: "text: 'They send the code to the identity provider, as the real app would, but without the verifier, which they never saw.'",
		to: "text: 'They send the code to the identity provider, exactly as the real app would, and nothing marks this request.'"
	},
	{
		name: 'attacker: says the real app can be used against PKCE',
		file: AC,
		from: 'gets them nothing, because the verifier does not match, though it uses up the code.',
		to: 'works, which is what PKCE stops.'
	},

	// DPoP, which has been wrong twice.
	{
		name: 'dpop: a gateway is said to check the proof',
		file: AC,
		from: 'An ordinary JWT library or gateway checks the token and ignores the proof',
		to: 'A library or a gateway does this'
	},
	{
		name: 'dpop: a stolen token is useless at any API',
		file: AC,
		from: 'so at an API that checks the proof a stolen token is useless without the key.',
		to: 'so a stolen token is useless without the key.'
	},
	{
		name: 'dpop: whoever has the code gets the tokens, though the login named the key',
		file: AC,
		from: 'so the identity provider refuses the code with no proof, or with a proof from any other key.',
		to: 'so whoever intercepted the code gets the tokens.'
	},
	{
		name: 'dpop: bearer words on a dpop token',
		file: AC,
		from: "text: 'The app sends the token and a new proof, which shows it holds the key the token is tied to.'",
		to: "text: 'The app sends the access token. Whoever holds a bearer token can use it.'"
	},

	// Words.
	{
		name: 'words: a sentence with no space after it',
		file: AC,
		from: 'so the app gets nothing and the user sees an error. The specs',
		to: 'so the app gets nothing and the user sees an error.The specs'
	},
	{
		name: 'words: a line about libraries names none',
		file: AC,
		from: "example('springSecurity', true, 'compares state without being asked'),",
		to: ''
	},

	// Notes.
	{
		name: 'notes: nothing behind a note',
		file: NOTES,
		from: "question: 'implicitFlow',\n\t\t\tshows: { serverLists: true, before: { allowed: false }, after: { allowed: true } }",
		to: "question: 'implicitFlow',\n\t\t\tshows: {}"
	},
	{
		name: 'notes: a status nobody saw',
		file: NOTES,
		from: 'Anything else gets a 400, and the page says',
		to: 'Anything else gets a 500, and the page says'
	},
	{
		name: 'notes: moved off its step',
		file: NOTES,
		from: "id: 'implicit-flow',\n\t\tsteps: ['redirect-with-code'],",
		to: "id: 'implicit-flow',\n\t\tsteps: ['authorize'],"
	},
	{
		name: 'notes: for the wrong client type',
		file: NOTES,
		from: 'server standing in for one, which needs nothing here.",\n\t\twhen: not(confidential),',
		to: 'server standing in for one, which needs nothing here.",\n\t\twhen: confidential,'
	},
	{
		name: 'notes: words swapped between PKCE on and off',
		file: NOTES,
		from: "when: all(pkce, not(confidential)),\n\t\t\t\ttext: 'Someone with only the code",
		to: "when: all(not(pkce), not(confidential)),\n\t\t\t\ttext: 'Someone with only the code"
	},
	{
		name: 'notes: a console path nobody looked for',
		file: NOTES,
		from: "'Client scopes',\n\t\t\t\t'your client-dedicated',\n\t\t\t\t'Configure a new mapper',\n\t\t\t\t'Audience'",
		to: "'Client scopes',\n\t\t\t\t'your client-dedicated',\n\t\t\t\t'Configure a new mapper',\n\t\t\t\t'Audience thing'"
	},

	// The weekly check itself.
	{
		name: 'check: order stops mattering',
		file: SHAPE,
		from: 'const [a, b] = [lines(before), lines(after)];',
		to: 'const [a, b] = [lines(before).sort(), lines(after).sort()];'
	},
	{
		name: 'check: an error is only a type',
		file: SHAPE,
		from: "const STATED = new Set(['error', 'error_description', 'token_type']);",
		to: "const STATED = new Set(['error_description', 'token_type']);"
	},
	{
		name: 'check: a token type is only a type',
		file: SHAPE,
		from: "const STATED = new Set(['error', 'error_description', 'token_type']);",
		to: "const STATED = new Set(['error', 'error_description']);"
	},
	{
		name: 'check: status left out',
		file: SHAPE,
		from: 'status: message.status,',
		to: ''
	},
	{
		name: 'check: query left out',
		file: SHAPE,
		from: 'query: message.url ? queryNames(message.url) : undefined,',
		to: ''
	},
	{
		name: 'check: headers left out',
		file: SHAPE,
		from: 'headers: Object.keys(message.headers).sort(),',
		to: ''
	},
	{
		name: 'check: claims left out',
		file: SHAPE,
		from: 'STATED.has(key) ? value : (claimNames(value) ?? typeof value)',
		to: 'STATED.has(key) ? value : typeof value'
	},
	{
		name: 'check: the console is not looked at',
		file: CHECK,
		from: '(label) => `${note.id}: the admin console no longer shows "${label}"`',
		to: '() => ""'
	},
	{
		name: 'check: flags are not compared',
		file: CHECK,
		from: 'JSON.stringify(flags.committed) === JSON.stringify(flags.now)',
		to: 'true'
	},
	{
		name: 'check: evidence is not compared',
		file: CHECK,
		from: '...evidenceDifferences(answers)\n',
		to: '\n'
	},

	// The map.
	{
		name: 'map: the next question skips one',
		file: NODES,
		from: 'mapNodes[mapNodes.indexOf(of) + 1] ?? null;',
		to: 'mapNodes[mapNodes.indexOf(of) + 2] ?? null;'
	},
	{
		name: 'map: a question ignores the diagram',
		file: NODES,
		from: 'state.flow === of.flow &&\n\tstate.diagram === of.diagram &&\n\tsameSettings(nodeSettings(of), state.settings);',
		to: 'state.flow === of.flow &&\n\tsameSettings(nodeSettings(of), state.settings);'
	},

	// The diagram and the state.
	{
		name: 'layout: chips can run out of the diagram',
		file: LAYOUT,
		from: 'let x = clamp(center - total / 2, 6, Math.max(6, WIDTH - total - 6));',
		to: 'let x = center - total / 2;'
	},
	{
		name: 'state: an explanation does not survive a link',
		file: STATE,
		from: "if (state.explained) params.set('explain', `${state.explained.kind}.${state.explained.id}`);",
		to: ''
	},
	{
		name: 'model: a field leaves out what brought it',
		file: MODEL,
		from: 'causes: causes(field.when, settings),',
		to: 'causes: [],'
	}
];
