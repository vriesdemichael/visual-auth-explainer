/** The things that get passed around, drawn as objects because that is what they are. */
export type ArtifactId =
	| 'password'
	| 'code'
	| 'secret'
	| 'verifier'
	| 'challenge'
	| 'access-token'
	| 'id-token'
	| 'proof'
	| 'upstream-token';

export const artifacts: Readonly<
	Record<ArtifactId, { label: string; short: string; explains: string }>
> = {
	password: {
		label: 'password',
		short: 'password',
		explains:
			'How the user proves who they are. It only ever goes to whoever does the login, and the app never sees it, which is the point of all this.'
	},
	code: {
		label: 'code',
		short: 'code',
		explains:
			'A one-time ticket. It travels through the browser, where it can be seen, so on its own it has to be worth little. The app trades it for tokens on a direct call.'
	},
	secret: {
		label: 'client secret',
		short: 'secret',
		explains:
			'Like a password, but for the app. It is agreed during setup, and shows that this really is the registered app when it trades a code for tokens. An app running on someone else’s device cannot keep one.'
	},
	verifier: {
		label: 'code verifier',
		short: 'verifier',
		explains:
			'A random value the app makes up for this one login and keeps to itself. It is sent once, directly, when the app trades the code, and never through the browser. So someone who saw the code still does not have it.'
	},
	challenge: {
		label: 'code challenge',
		short: 'challenge',
		explains:
			'A fingerprint of the verifier. It can be worked out from the verifier but not the other way round, so it is safe to send through the browser. The identity provider keeps it with the code, and compares it with the verifier later.'
	},
	'access-token': {
		label: 'access token',
		short: 'access',
		explains:
			'What the app shows an API to be let in. It stands for the access that was granted. It is meant for the API to read, and the app should just carry it.'
	},
	'id-token': {
		label: 'ID token',
		short: 'ID',
		explains:
			'Tells the app who logged in, when and where. Unlike the access token, it is made for the app to read, after checking it. It does not get you into an API.'
	},
	proof: {
		label: 'key proof',
		short: 'proof',
		explains:
			'A short signed note showing that the sender holds a private key. A new one goes with each request, so a stolen token is no use without the key.'
	},
	'upstream-token': {
		label: 'upstream token',
		short: 'upstream',
		explains:
			'A token the other provider issued, for calling that provider’s own APIs. It is not the token the app got from its own identity provider.'
	}
};

/** How much the application exposes. A mode never changes the flow (ADR-004). */
export type Mode = 'simple' | 'advanced';

/** How a message travels. The split between the first two is the security idea of a redirect flow. */
export type Channel = 'front' | 'back' | 'people' | 'internal';

export const channels: Readonly<Record<Channel, { label: string; explains: string }>> = {
	front: {
		label: 'Through the browser',
		explains:
			'The user, and software in their browser, can see this. Also called the front channel.'
	},
	back: {
		label: 'Direct',
		explains:
			'One system calls another, with no redirect through the browser. Also called the back channel.'
	},
	people: {
		label: 'People, not HTTP',
		explains: 'Someone passes this on by hand, so nothing is sent between systems.'
	},
	internal: {
		label: 'Inside one system',
		explains: 'Nothing is sent.'
	}
};

export type LifelineIcon = 'browser' | 'app' | 'idp' | 'upstream' | 'api' | 'people';
