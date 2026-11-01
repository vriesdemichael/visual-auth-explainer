/** The things that get passed around, drawn as objects because that is what they are. */
export type ArtifactId =
	'password' | 'code' | 'secret' | 'access-token' | 'id-token' | 'proof' | 'upstream-token';

export const artifacts: Readonly<Record<ArtifactId, { label: string; short: string }>> = {
	password: { label: 'password', short: 'password' },
	code: { label: 'code', short: 'code' },
	secret: { label: 'client secret', short: 'secret' },
	'access-token': { label: 'access token', short: 'access' },
	'id-token': { label: 'ID token', short: 'ID' },
	proof: { label: 'key proof', short: 'proof' },
	'upstream-token': { label: 'upstream token', short: 'upstream' }
};

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
