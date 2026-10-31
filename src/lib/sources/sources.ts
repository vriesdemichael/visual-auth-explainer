export type SourceId =
	| 'rfc6749'
	| 'rfc6750'
	| 'rfc7636'
	| 'rfc9449'
	| 'rfc9700'
	| 'oidc-core'
	| 'keycloak-brokering'
	| 'keycloak-stored-tokens';

export interface SourceDef {
	label: string;
	title: string;
	status: string;
	/** In our own words. A source's own text stays with its authors (ADR-009). */
	summary: string;
	url: string;
	/** Names a file in static/rfc. Only an RFC's text is shown here, and always in full (ADR-009). */
	textFile?: string;
}

/** A setting pointing at a source, and what the source means for that setting. */
export interface SourceRef {
	source: SourceId;
	section?: string;
	why: string;
}

/** Summaries checked against each document on 2026-10-31. */
export const sources: Record<SourceId, SourceDef> = {
	rfc6749: {
		label: 'RFC 6749',
		title: 'The OAuth 2.0 Authorization Framework',
		status: 'Proposed Standard, October 2012. Updated by RFC 8252, RFC 8996 and RFC 9700.',
		summary:
			'The core of OAuth 2.0. It lets an app get limited access to an HTTP service, either on behalf of a user who approved it or on its own behalf. It defines the roles, the authorization and token endpoints, the ways to get a token, and the two client types. Later RFCs update it, so it is not the last word on security.',
		url: 'https://www.rfc-editor.org/rfc/rfc6749.html',
		textFile: 'rfc6749.txt'
	},
	rfc6750: {
		label: 'RFC 6750',
		title: 'The OAuth 2.0 Authorization Framework: Bearer Token Usage',
		status: 'Proposed Standard, October 2012. Updated by RFC 8996 and RFC 9700.',
		summary:
			'How to send a bearer token with a request, and what the server answers when the token is missing or not good enough. Whoever holds a bearer token can use it, with no key to prove, so it has to be protected in storage and on the way.',
		url: 'https://www.rfc-editor.org/rfc/rfc6750.html',
		textFile: 'rfc6750.txt'
	},
	rfc7636: {
		label: 'RFC 7636',
		title: 'Proof Key for Code Exchange by OAuth Public Clients',
		status: 'Proposed Standard, September 2015.',
		summary:
			'Protects the authorization code. For each login the app makes up a random value and sends a hash of it with the authorization request. It sends the value itself when it trades the code, and the server checks that the two match, so someone who intercepted the code cannot use it. It was written for public clients, such as apps on a phone, where another app can get at the code on its way.',
		url: 'https://www.rfc-editor.org/rfc/rfc7636.html',
		textFile: 'rfc7636.txt'
	},
	rfc9449: {
		label: 'RFC 9449',
		title: 'OAuth 2.0 Demonstrating Proof of Possession (DPoP)',
		status: 'Proposed Standard, September 2023.',
		summary:
			'Ties a token to a key. The app proves it holds a private key by sending a signed JWT in a DPoP header, and the server binds the tokens it issues to the matching public key. The aim is that a leaked or stolen token cannot be used without the key. It works at the application level, so it also suits apps in a browser, where binding through TLS does not work.',
		url: 'https://www.rfc-editor.org/rfc/rfc9449.html',
		textFile: 'rfc9449.txt'
	},
	rfc9700: {
		label: 'RFC 9700',
		title: 'Best Current Practice for OAuth 2.0 Security',
		status: 'Best Current Practice, January 2025. Updates RFC 6749, RFC 6750 and RFC 6819.',
		summary:
			'The current security advice for OAuth 2.0, written with what has gone wrong since OAuth was published. It describes the attacks and says what clients and servers have to do about them: for example PKCE to protect the code, exact matching of redirect addresses, and no more implicit or password grants.',
		url: 'https://www.rfc-editor.org/rfc/rfc9700.html',
		textFile: 'rfc9700.txt'
	},
	'oidc-core': {
		label: 'OpenID Connect Core 1.0',
		title: 'OpenID Connect Core 1.0',
		status: 'Final specification, with errata set 2 from December 2023. OpenID Foundation.',
		summary:
			'An identity layer on top of OAuth 2.0. It lets an app verify who logged in, based on the login at the authorization server, and get basic profile information about them. It adds the ID token and the UserInfo endpoint.',
		url: 'https://openid.net/specs/openid-connect-core-1_0.html'
	},
	'keycloak-brokering': {
		label: 'Keycloak docs: identity brokering',
		title: 'Integrating identity providers',
		status: 'Keycloak 26.8.1, Server Administration Guide.',
		summary:
			'Keycloak as a go-between: it connects the apps that use it to other identity providers, so users can log in with an identity from elsewhere. Those providers are configured in Keycloak.',
		url: 'https://www.keycloak.org/docs/26.8.1/server_admin/#_identity_broker'
	},
	'keycloak-stored-tokens': {
		label: 'Keycloak docs: stored tokens',
		title: 'Retrieving external IDP tokens',
		status: 'Keycloak 26.8.1, Server Developer Guide.',
		summary:
			'How an app gets the tokens Keycloak stored from an external identity provider. There are two versions. V1 is deprecated and still on by default, and V2 is the one to migrate to.',
		url: 'https://www.keycloak.org/docs/26.8.1/server_development/#_identity-brokering-apis-tokens'
	}
};

export const sourceIds = Object.keys(sources) as SourceId[];

export function refLabel(ref: SourceRef): string {
	const { label } = sources[ref.source];
	return ref.section ? `${label} §${ref.section}` : label;
}

/** Where to read it at the source. RFC pages have an anchor for each section. */
export function originalUrl(source: SourceDef, section: string | null): string {
	return source.textFile && section ? `${source.url}#section-${section}` : source.url;
}
