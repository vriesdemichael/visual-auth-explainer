// A throwaway Keycloak in a container, set up the way someone would through its admin API. Nothing
// here is a real credential: the realms, users and secrets exist only for this run.
import { execFileSync } from 'node:child_process';

export const KEYCLOAK_PORT = 18080;
export const KEYCLOAK = `http://localhost:${KEYCLOAK_PORT}`;
export const APP = 'http://localhost:9100';
export const API = 'http://localhost:9101';
export const PROXY_PORT = 9102;
const PROXY_FROM_CONTAINER = `http://host.docker.internal:${PROXY_PORT}`;

export const LOCAL_REALM = 'demo';
export const BROKERED_REALM = 'demo-brokered';
export const UPSTREAM_REALM = 'upstream';
export const CONFIDENTIAL_CLIENT = 'demo-app';
export const PUBLIC_CLIENT = 'demo-public';
export const PKCE_CLIENT = 'demo-public-pkce';
export const CONSENT_CLIENT = 'demo-consent';
export const CLIENT_SECRET = 'throwaway-client-secret';
export const BROKER_CLIENT = 'demo-broker';
export const BROKER_SECRET = 'throwaway-broker-secret';
export const USERNAME = 'alice';
export const PASSWORD = 'throwaway-password';
export const REDIRECT_URI = `${APP}/callback`;

const CONTAINER = 'visual-auth-explainer-keycloak';
export const ADMIN_PASSWORD = 'throwaway-admin';

const docker = (...args: string[]) =>
	execFileSync('docker', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

export function stopKeycloak() {
	try {
		docker('rm', '--force', CONTAINER);
	} catch {
		// It was not running.
	}
}

export async function startKeycloak(version: string, features: readonly string[]) {
	stopKeycloak();
	docker(
		'run',
		'--detach',
		'--name',
		CONTAINER,
		'--publish',
		`${KEYCLOAK_PORT}:8080`,
		'--add-host=host.docker.internal:host-gateway',
		'--env',
		'KC_BOOTSTRAP_ADMIN_USERNAME=admin',
		'--env',
		`KC_BOOTSTRAP_ADMIN_PASSWORD=${ADMIN_PASSWORD}`,
		`quay.io/keycloak/keycloak:${version}`,
		'start-dev',
		...(features.length ? [`--features=${features.join(',')}`] : [])
	);
	for (let i = 0; i < 90; i++) {
		try {
			if ((await fetch(`${KEYCLOAK}/realms/master`)).ok) return;
		} catch {
			// Not up yet.
		}
		await new Promise((resolve) => setTimeout(resolve, 2000));
	}
	throw new Error(`Keycloak did not start:\n${docker('logs', '--tail', '40', CONTAINER)}`);
}

const form = (values: Record<string, string>) => new URLSearchParams(values).toString();

export class Admin {
	#token = '';

	static async connect() {
		const admin = new Admin();
		const response = await fetch(`${KEYCLOAK}/realms/master/protocol/openid-connect/token`, {
			method: 'POST',
			headers: { 'content-type': 'application/x-www-form-urlencoded' },
			body: form({
				grant_type: 'password',
				client_id: 'admin-cli',
				username: 'admin',
				password: ADMIN_PASSWORD
			})
		});
		if (!response.ok) throw new Error(`Admin login failed: ${response.status}`);
		admin.#token = ((await response.json()) as { access_token: string }).access_token;
		return admin;
	}

	async call<T = unknown>(method: string, path: string, body?: unknown): Promise<T> {
		const response = await fetch(`${KEYCLOAK}/admin${path}`, {
			method,
			headers: {
				authorization: `Bearer ${this.#token}`,
				'content-type': 'application/json'
			},
			body: body === undefined ? undefined : JSON.stringify(body)
		});
		if (!response.ok) {
			throw new Error(`${method} ${path}: ${response.status} ${await response.text()}`);
		}
		const text = await response.text();
		return (text ? JSON.parse(text) : undefined) as T;
	}

	async serverVersion() {
		const info = await this.call<{ systemInfo: { version: string } }>('GET', '/serverinfo');
		return info.systemInfo.version;
	}

	/** Removes the user a brokered login creates, so every run starts from a first login. */
	async forgetBrokeredUsers() {
		const users = await this.call<{ id: string }[]>('GET', `/realms/${BROKERED_REALM}/users`);
		for (const user of users) {
			await this.call('DELETE', `/realms/${BROKERED_REALM}/users/${user.id}`);
		}
	}

	async setClientAttributes(realm: string, clientId: string, attributes: Record<string, string>) {
		const [client] = await this.call<{ id: string; attributes?: Record<string, string> }[]>(
			'GET',
			`/realms/${realm}/clients?clientId=${clientId}`
		);
		await this.call('PUT', `/realms/${realm}/clients/${client.id}`, {
			...client,
			attributes: { ...client.attributes, ...attributes }
		});
	}
}

const user = {
	username: USERNAME,
	email: 'alice@example.test',
	firstName: 'Alice',
	lastName: 'Example',
	enabled: true,
	emailVerified: true,
	credentials: [{ type: 'password', value: PASSWORD, temporary: false }]
};

const client = (clientId: string, extra: object) => ({
	clientId,
	enabled: true,
	standardFlowEnabled: true,
	redirectUris: [REDIRECT_URI],
	...extra
});

const confidential = {
	publicClient: false,
	clientAuthenticatorType: 'client-secret',
	secret: CLIENT_SECRET
};

export async function setUpRealms(admin: Admin) {
	for (const realm of [LOCAL_REALM, BROKERED_REALM, UPSTREAM_REALM]) {
		await admin.call('POST', '/realms', { realm, enabled: true });
	}

	await admin.call('POST', `/realms/${LOCAL_REALM}/users`, user);
	await admin.call(
		'POST',
		`/realms/${LOCAL_REALM}/clients`,
		client(CONFIDENTIAL_CLIENT, confidential)
	);
	await admin.call(
		'POST',
		`/realms/${LOCAL_REALM}/clients`,
		client(PUBLIC_CLIENT, { publicClient: true })
	);
	await admin.call(
		'POST',
		`/realms/${LOCAL_REALM}/clients`,
		client(CONSENT_CLIENT, { ...confidential, consentRequired: true })
	);
	await admin.call(
		'POST',
		`/realms/${LOCAL_REALM}/clients`,
		client(PKCE_CLIENT, {
			publicClient: true,
			attributes: { 'pkce.code.challenge.method': 'S256' }
		})
	);

	await admin.call('POST', `/realms/${UPSTREAM_REALM}/users`, user);
	await admin.call('POST', `/realms/${UPSTREAM_REALM}/clients`, {
		clientId: BROKER_CLIENT,
		enabled: true,
		standardFlowEnabled: true,
		publicClient: false,
		clientAuthenticatorType: 'client-secret',
		secret: BROKER_SECRET,
		redirectUris: [`${KEYCLOAK}/realms/${BROKERED_REALM}/broker/${UPSTREAM_REALM}/endpoint`]
	});

	await admin.call(
		'POST',
		`/realms/${BROKERED_REALM}/clients`,
		client(CONFIDENTIAL_CLIENT, {
			...confidential,
			attributes: {
				'external.token.enabled': 'true',
				'external.token.idp': UPSTREAM_REALM
			}
		})
	);

	// The calls Keycloak makes to the upstream go through the proxy, so they can be recorded too.
	const upstream = `realms/${UPSTREAM_REALM}/protocol/openid-connect`;
	await admin.call('POST', `/realms/${BROKERED_REALM}/identity-provider/instances`, {
		alias: UPSTREAM_REALM,
		providerId: 'oidc',
		enabled: true,
		trustEmail: true,
		storeToken: true,
		addReadTokenRoleOnCreate: true,
		config: {
			authorizationUrl: `${KEYCLOAK}/${upstream}/auth`,
			tokenUrl: `${PROXY_FROM_CONTAINER}/${upstream}/token`,
			userInfoUrl: `${PROXY_FROM_CONTAINER}/${upstream}/userinfo`,
			jwksUrl: `${PROXY_FROM_CONTAINER}/${upstream}/certs`,
			useJwksUrl: 'true',
			validateSignature: 'true',
			issuer: `${KEYCLOAK}/realms/${UPSTREAM_REALM}`,
			clientId: BROKER_CLIENT,
			clientSecret: BROKER_SECRET,
			clientAuthMethod: 'client_secret_post',
			defaultScope: 'openid',
			syncMode: 'IMPORT'
		}
	});

	// Sends everyone straight to the upstream, so the app really does not notice (see the setting).
	const executions = await admin.call<{ id: string; providerId?: string }[]>(
		'GET',
		`/realms/${BROKERED_REALM}/authentication/flows/browser/executions`
	);
	const redirector = executions.find((e) => e.providerId === 'identity-provider-redirector');
	if (!redirector) throw new Error('No identity provider redirector in the browser flow');
	await admin.call(
		'POST',
		`/realms/${BROKERED_REALM}/authentication/executions/${redirector.id}/config`,
		{ alias: 'straight-to-upstream', config: { defaultProvider: UPSTREAM_REALM } }
	);
}
