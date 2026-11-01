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
		from: 'gets them nothing, because the verifier does not match, though on this server it uses up the code.',
		to: 'works, which is what PKCE stops.'
	},

	// Logging out.
	{
		name: 'logout: the session stays',
		file: AC,
		from: "ends: ['session'],",
		to: ''
	},
	{
		name: 'logout: the token is said to stop working everywhere',
		file: AC,
		from: "plain: 'It still works',\n\t\t\tlabel: '200 with the resource',\n\t\t\tconcept:\n\t\t\t\t'Its signature",
		to: "plain: 'It still works',\n\t\t\tlabel: '401 invalid_token',\n\t\t\tconcept:\n\t\t\t\t'Its signature"
	},
	{
		name: 'logout: the API that asks is said to take it',
		file: AC,
		from: "plain: 'The API refuses',\n\t\t\tlabel: '401 invalid_token',",
		to: "plain: 'The API refuses',\n\t\t\tlabel: '200 with the resource',"
	},
	{
		name: 'logout: the note says the other app stays logged in',
		file: NOTES,
		from: 'otherAppNextLoginSawForm: true',
		to: 'otherAppNextLoginSawForm: false'
	},

	// A second app.
	{
		name: 'sso: the app is said to have the session',
		file: AC,
		from: "{ name: 'grant_type=authorization_code', place: 'body' },\n\t\t\t\t{ name: 'code', place: 'body', artifact: 'code' },\n\t\t\t\t{ name: 'redirect_uri', place: 'body' },\n\t\t\t\t{\n\t\t\t\t\tname: 'Authorization: Basic',\n\t\t\t\t\tplace: 'header',\n\t\t\t\t\tnote: 'The client ID and secret',\n\t\t\t\t\tartifact: 'secret'\n\t\t\t\t}",
		to: "{ name: 'grant_type=authorization_code', place: 'body' },\n\t\t\t\t{ name: 'code', place: 'body', artifact: 'code' },\n\t\t\t\t{ name: 'redirect_uri', place: 'body' },\n\t\t\t\t{\n\t\t\t\t\tname: 'Authorization: Basic',\n\t\t\t\t\tplace: 'header',\n\t\t\t\t\tnote: 'The client ID and secret',\n\t\t\t\t\tartifact: 'session'\n\t\t\t\t}"
	},
	{
		name: 'sso: the login comes back without being asked',
		file: AC,
		from: "id: 'second-submit-credentials',\n\t\t\twhen: secondInsists,",
		to: "id: 'second-submit-credentials',\n\t\t\twhen: secondApp,"
	},
	{
		name: 'sso: login_required is said to come with a code',
		file: AC,
		from: "{ when: secondIsFresh, text: '302 error=login_required' },",
		to: "{ when: secondIsFresh, text: '302 back with a code' },"
	},
	{
		name: 'sso: the cookie goes along with no session',
		file: AC,
		from: "note: 'Sent to the identity provider, and nowhere else',\n\t\t\t\t\tartifact: 'session',\n\t\t\t\t\twhen: secondGetsACode",
		to: "note: 'Sent to the identity provider, and nowhere else',\n\t\t\t\t\tartifact: 'session'"
	},

	// A refresh token.
	{
		name: 'refresh: the old one is said to be refused on a default server',
		file: AC,
		from: "{ when: reuseEnds, text: 'Refused: this one has been used' },\n\t\t\t\t{ text: 'It still works' }",
		to: "{ text: 'Refused: this one has been used' }"
	},
	{
		name: 'refresh: the chip on the response is left out',
		file: AC,
		from: "{ name: 'refresh_token', place: 'body', artifact: 'refresh-token' },\n\t\t\t\t{ name: 'scope', place: 'body' }\n\t\t\t]\n\t\t},\n\t\t{\n\t\t\tid: 'api-request-new'",
		to: "{ name: 'refresh_token', place: 'body' },\n\t\t\t\t{ name: 'scope', place: 'body' }\n\t\t\t]\n\t\t},\n\t\t{\n\t\t\tid: 'api-request-new'"
	},
	{
		name: 'refresh: a stolen one from an app with a secret needs nothing else',
		file: AC,
		from: 'From an app with a secret they would need the secret as well, because the request has to carry it.',
		to: 'This request is all they need.'
	},
	{
		name: 'refresh: the note says revoking is on by default',
		file: NOTES,
		from: 'Off by default, so the old refresh token keeps working',
		to: 'On by default, so the old refresh token stops working'
	},

	// An API saying no.
	{
		name: 'api: a 403 is called a 401',
		file: AC,
		from: "{ when: sends('noscope'), text: '403 insufficient_scope' },",
		to: "{ when: sends('noscope'), text: '401 invalid_token' },"
	},
	{
		name: 'api: a refusal has no WWW-Authenticate',
		file: AC,
		from: "note: 'What kind of token it wants, and what was wrong with this one',\n\t\t\t\t\twhen: apiRefuses",
		to: "note: 'What kind of token it wants, and what was wrong with this one',\n\t\t\t\t\twhen: sends('good')"
	},
	{
		name: 'api: an expired token is called changed',
		file: AC,
		from: "{ when: sends('expired'), text: 'The API refuses: the token has expired' },",
		to: "{ when: sends('expired'), text: 'The API refuses: the signature is wrong' },"
	},
	{
		name: 'api: the token is sent even when it says none is',
		file: AC,
		from: "when: all(bearer, not(sends('none')))",
		to: 'when: bearer'
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

	// What the screen says after moving.
	{
		name: 'changes: Back is explained with the setting flipped before it',
		file: 'src/lib/flow/changes.ts',
		from: 'return move.byFlip ? { ...last, diff: move.diff } : { ...NOTHING_CHANGED, diff: move.diff };',
		to: 'return { ...last, diff: move.diff };'
	},
	{
		name: 'changes: what changed stays while stepping',
		file: 'src/lib/flow/changes.ts',
		from: 'if (move.diagramChanged || (nothing && move.stepChanged)) return NOTHING_CHANGED;',
		to: 'if (move.diagramChanged) return NOTHING_CHANGED;'
	},
	{
		name: 'changes: a switch for the other diagram is offered anyway',
		file: 'src/lib/flow/changes.ts',
		from: '!possible.some((flipped) => changesInPlainWords(here, settings, flipped)) &&',
		to: 'false &&'
	},

	// Names every object has.
	{
		name: 'state: an explanation of constructor opens',
		file: STATE,
		from: "if (kind === 'artifact' && Object.hasOwn(artifacts, id)) return { kind, id: id as ArtifactId };",
		to: "if (kind === 'artifact' && id in artifacts) return { kind, id: id as ArtifactId };"
	},

	// Words.
	{
		name: 'words: a word used on screen has no explanation',
		file: 'src/lib/flow/glossary.ts',
		from: "words: ['issuer', 'issuers'],",
		to: 'words: [],'
	},
	{
		name: 'words: every use is marked',
		file: 'src/lib/flow/glossary.ts',
		from: 'if (!term || marked.has(term.id) || (term.vendor && !serverNamed)) continue;',
		to: 'if (!term || (term.vendor && !serverNamed)) continue;'
	},
	{
		name: 'words: one server is named with its notes off',
		file: 'src/lib/flow/glossary.ts',
		from: 'if (!term || marked.has(term.id) || (term.vendor && !serverNamed)) continue;',
		to: 'if (!term || marked.has(term.id)) continue;'
	},
	{
		name: 'words: a term points at something that is not there',
		file: 'src/lib/flow/glossary.ts',
		from: "at: flowAt('consent-page', { consent: true })\n\t},\n\t{\n\t\tid: 'consent',",
		to: "at: flowAt('consent-page')\n\t},\n\t{\n\t\tid: 'consent',"
	},

	// Search.
	{
		name: 'search: an error stops being found in a pasted line',
		file: 'src/lib/search/search.ts',
		from: 'const pasted = errors.filter((error) => phrase.includes(lower(error.title)));',
		to: 'const pasted = errors.filter((error) => phrase === lower(error.title));'
	},
	{
		name: 'search: something not here yet is guessed around',
		file: 'src/lib/search/search.ts',
		from: 'if (missing && !pasted.length) return { results: [], notHereYet: missing };',
		to: ''
	},
	{
		name: 'search: an error opens the wrong step',
		file: 'src/lib/search/errors.ts',
		from: "means: 'A code works once, and this one has been used already.',\n\t\tstep: 'real-app-refused',",
		to: "means: 'A code works once, and this one has been used already.',\n\t\tstep: 'open-app',"
	},

	// Answers.
	{
		name: 'map: a question opens away from its answer, with no reason',
		file: NODES,
		from: "preset: 'broker',\n\t\t\t\t\tstep: 'redirect-to-upstream'",
		to: "preset: 'broker'"
	},
	{
		name: 'map: a question from another mode is where someone is',
		file: NODES,
		from: 'candidate.mode === state.mode &&',
		to: ''
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
		name: 'layout: a head runs off the side',
		file: LAYOUT,
		from: 'Math.max(TIGHT_MARGIN, headFor(TIGHT_MARGIN) / 2 + 4)',
		to: 'TIGHT_MARGIN'
	},
	{
		name: 'layout: scales up past what can be followed',
		file: LAYOUT,
		from: 'clamp(room?.width ?? WIDTH, MIN_WIDTH, MAX_WIDTH)',
		to: 'Math.max(room?.width ?? WIDTH, MIN_WIDTH)'
	},
	{
		name: 'layout: rows ignore the height there is',
		file: LAYOUT,
		from: 'if (height === undefined) return ROW_HEIGHT;',
		to: 'return ROW_HEIGHT;'
	},
	{
		name: 'layout: chips can run out of the diagram',
		file: LAYOUT,
		from: 'let x = clamp(center - total / 2, 6, Math.max(6, width - total - 6));',
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
