import type { Settings } from '#lib/flow/settings.ts';

// What the recordings were made with, and what someone gets to run at home, from one place so that the
// two cannot drift. Nothing here is a real credential.
export const KEYCLOAK_PORT = 18080;
export const KEYCLOAK = `http://localhost:${KEYCLOAK_PORT}`;
export const APP = 'http://localhost:9100';
export const LOCAL_REALM = 'demo';
export const CONFIDENTIAL_CLIENT = 'demo-app';
export const CLIENT_SECRET = 'throwaway-client-secret';
export const USERNAME = 'alice';
export const PASSWORD = 'throwaway-password';
export const REDIRECT_URI = `${APP}/callback`;

export const demoUser = {
	username: USERNAME,
	email: 'alice@example.test',
	firstName: 'Alice',
	lastName: 'Example',
	enabled: true,
	emailVerified: true,
	credentials: [{ type: 'password', value: PASSWORD, temporary: false }]
};

export const demoClient = (clientId: string, extra: object) => ({
	clientId,
	enabled: true,
	standardFlowEnabled: true,
	redirectUris: [REDIRECT_URI],
	...extra
});

export const withSecret = {
	publicClient: false,
	clientAuthenticatorType: 'client-secret',
	secret: CLIENT_SECRET
};

/** The example in RFC 7636 appendix B, because a pair that is only ever a demonstration can be fixed. */
export const VERIFIER = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
export const CHALLENGE = 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM';

export const PASTE_CODE = 'PASTE_THE_CODE_HERE';
export const PASTE_TOKEN = 'PASTE_THE_ACCESS_TOKEN_HERE';
const CONTAINER = 'authlines-demo';

/** The settings that change what can be done at home with a browser and a command. */
export type AtHome = Pick<Settings, 'clientType' | 'consent' | 'pkce' | 'oidc'>;

export interface RunYourself {
	/** Writes the realm file, and starts the server with it. */
	start: string;
	/** Where to send a browser to log in. */
	login: string;
	/** Trades the code that comes back. */
	trade: string;
	/** Asks who logged in, with what the trade gave, when OpenID Connect is on. */
	who: string | null;
	container: string;
}

export function realmFor(settings: AtHome) {
	return {
		realm: LOCAL_REALM,
		enabled: true,
		users: [demoUser],
		clients: [
			demoClient(CONFIDENTIAL_CLIENT, {
				...(settings.clientType === 'public' ? { publicClient: true } : withSecret),
				...(settings.consent ? { consentRequired: true, fullScopeAllowed: true } : {})
			})
		]
	};
}

export function runYourself(settings: AtHome, version: string): RunYourself {
	const endpoint = `${KEYCLOAK}/realms/${LOCAL_REALM}/protocol/openid-connect`;
	const query = new URLSearchParams({
		response_type: 'code',
		client_id: CONFIDENTIAL_CLIENT,
		redirect_uri: REDIRECT_URI,
		state: 'any-value-for-now',
		...(settings.oidc ? { scope: 'openid' } : {}),
		...(settings.pkce ? { code_challenge: CHALLENGE, code_challenge_method: 'S256' } : {})
	});
	const start = [
		`cat > demo-realm.json <<'EOF'`,
		JSON.stringify(realmFor(settings), null, 2),
		'EOF',
		[
			`docker run --rm --name ${CONTAINER} -p ${KEYCLOAK_PORT}:8080`,
			'-e KC_BOOTSTRAP_ADMIN_USERNAME=admin',
			'-e KC_BOOTSTRAP_ADMIN_PASSWORD=throwaway-admin',
			'-v "$PWD/demo-realm.json:/opt/keycloak/data/import/demo-realm.json"',
			`quay.io/keycloak/keycloak:${version}`,
			'start-dev --import-realm'
		].join(' \\\n  ')
	].join('\n');
	const trade = [
		`curl -i -X POST '${endpoint}/token'`,
		...(settings.clientType === 'public' ? [] : [`-u '${CONFIDENTIAL_CLIENT}:${CLIENT_SECRET}'`]),
		`--data-urlencode 'grant_type=authorization_code'`,
		`--data-urlencode 'code=${PASTE_CODE}'`,
		`--data-urlencode 'redirect_uri=${REDIRECT_URI}'`,
		...(settings.clientType === 'public'
			? [`--data-urlencode 'client_id=${CONFIDENTIAL_CLIENT}'`]
			: []),
		...(settings.pkce ? [`--data-urlencode 'code_verifier=${VERIFIER}'`] : [])
	].join(' \\\n  ');
	return {
		start,
		login: `${endpoint}/auth?${query}`,
		trade,
		who: settings.oidc
			? `curl -i '${endpoint}/userinfo' \\\n  -H 'Authorization: Bearer ${PASTE_TOKEN}'`
			: null,
		container: CONTAINER
	};
}
