# Follow-up checks

Done on 2026-10-30 and 2026-10-31, after the main research, to test points the maintainer raised in response to it. These were quick checks and not a survey.

## OAuth to OIDC on a real Keycloak

Run on 2026-10-30 against `quay.io/keycloak/keycloak:26.8.1` in `start-dev`: the authorization code flow with a public client, through the real login form. There were four runs, with and without `openid`, on a default client and on a client with `profile`, `email` and `roles` removed from its default client scopes.

| | `openid` off | `openid` on |
|---|---|---|
| `id_token` in the token response | No | Yes |
| UserInfo | 403, `insufficient_scope`, "Missing openid scope" | 200 |
| `scope` in the response, default client | `profile email` | `openid profile email` |
| Access token, default client | Has `name`, `email` and `preferred_username` | Same claims |
| Access token, stripped client | `sub` and technical claims, no `aud` | Same claims |
| ID token, stripped client | None issued | `sub` and technical claims, no name or email |

**The toggle is real, but the access token does not change.** On a default client it already says who the user is with OIDC off. Those claims come from client scopes, not from `openid`.

Also seen in these runs:

- **Wrong `redirect_uri`:** 400 with `Invalid parameter: redirect_uri` and no redirect.
- **Discovery:** 200 at `/realms/{realm}/.well-known/openid-configuration`, `/realms/{realm}/.well-known/oauth-authorization-server` and `/.well-known/oauth-authorization-server/realms/{realm}`.
- **A new client's default client scopes:** `web-origins`, `acr`, `profile`, `roles`, `basic` and `email`.

## What "token brokering" refers to

On 2026-10-31 the maintainer said it means upstream token storage. **This was read from Keycloak's 26.8.1 docs and has not been run.** The sources are the [developer guide](https://www.keycloak.org/docs/26.8.1/server_development/#_identity-brokering-apis-tokens), the [admin guide](https://www.keycloak.org/docs/latest/server_admin/index.html), the [features page](https://www.keycloak.org/server/features) and the [release notes](https://www.keycloak.org/docs/latest/release_notes/index.html). This explains the brief's "feature flags of keycloak like cimd and token brokering", because the retrieval API sits behind a flag.

| | `identity-brokering-api:v1` | `identity-brokering-api:v2` |
|---|---|---|
| Status | Deprecated, on by default, to be removed | Supported, off by default, to become the default |
| Request | `GET /realms/{realm}/broker/{alias}/token` | `POST` to the same path, with a form body |
| Authentication | The user's Keycloak access token as a bearer token | Client authentication plus the access token. Confidential clients only |
| Authorization | The user's `read-token` role on the `broker` client | Client settings: "Allow retrieve external tokens" and "Allowed Identity Providers for External Tokens" |
| Storage | "Store Tokens": in the database, per user and IdP | "Store token in session", or "Store tokens". The session is tried first, with the database as a fallback |
| Response | Format not specified | Always a JSON access token response |

Other points:

- **Defaults:** the pages read do not state the defaults of "Store Tokens" and "Stored Tokens Readable". The developer guide's wording implies they start off.
- **"Stored Tokens Readable":** assigns the `read-token` role to newly imported users.
- **History:** V2 arrived as a preview in 26.6.0, and in 26.7.0 it became supported and V1 was deprecated.
- **Not settled by these pages:** whether enabling V2 turns V1 off.

## The entry and the format

Looked at on 2026-10-31, because the maintainer named both as the references to follow.

- **roadmap.sh:** the home page has a search box, category chips and cards for 96 roadmaps. A roadmap is a node map on one long page, with a spine, branches, a legend, and progress marks on the nodes. It also carries accounts, ads and an AI tutor. Seen in screenshots of the home page and `/frontend`. What opening a node does was not confirmed.
- **IdentiFlows:** the home page has a search and a category filter over flow cards. A flow page has a description and tags, then the diagram, with five lifelines and 18 messages on code + PKCE, then links to specs. Interactive Mode adds Previous and Next, and the theme can be auto, light or dark. This check read the page text and DOM only, because the browser pane was hidden. The rendering itself was seen only in the earlier research.

## Keycloak feature flags

Sources: the [features page](https://www.keycloak.org/server/features) and [specifications page](https://www.keycloak.org/securing-apps/specifications). Neither states which version it describes. Their release switcher reads Nightly, 26.8.1, 26.7.5 and 26.6.4, and the admin guide's links carry 26.8.1.

| Flag | Description on the page | Status as stated |
|---|---|---|
| `cimd[:v1]` | None. Appears only in the option lists | No status on the features page. The specifications page lists "OAuth Client ID Metadata Document" as Experimental |
| `token-exchange-standard:v2` | Standard Token Exchange version 2 | Supported, enabled by default |
| `token-exchange:v1` | Token Exchange Service | Preview, disabled by default |
| `token-exchange-delegation:v1` | Token Exchange Delegation | Preview, disabled by default |
| `identity-brokering-api:v1` | Identity Brokering API V1 | Supported, enabled by default |
| `identity-brokering-api:v2` | Identity Brokering API V2 | Supported, disabled by default |
| `twitter-broker:v1` | Twitter Identity Broker | Supported, enabled by default |
| `instagram-broker:v1` | Instagram Identity Broker | Deprecated, disabled by default |
| `client-auth-federated:v1` | Authenticates client based on assertions issued by identity provider | Supported, enabled by default |
| `jwt-authorization-grant:v1` | JWT Profile for OAuth 2.0 Authorization Grant | Supported, enabled by default |
| `kubernetes-service-accounts:v1` | Kubernetes service accounts trust relationship provider | Supported, enabled by default |
| `spiffe:v1` | SPIFFE trust relationship provider | Preview |

Other points:

- **Core identity brokering is not listed as a flag.** Neither page says whether it needs one, and the brokering docs mention none.
- **Token exchange direction:** the specifications page says "Token exchange V2 only supports the internal to internal use-case", so RFC 8693 support is partial. Neither page says which feature enables external-to-internal or internal-to-external exchange.
- **Names listed with no description or status:** `client-auth-abca`, `identity-assertion-jwt`, `ipa-tuura-federation`. The page does not say whether these relate.
- **Not read:** the [token exchange guide](https://www.keycloak.org/securing-apps/token-exchange), the [MCP authorization server page](https://www.keycloak.org/securing-apps/mcp-authz-server) and the [chaining page](https://www.keycloak.org/securing-apps/oauth-identity-authorization-chaining-across-domains). Read these before writing content on those topics.

Release notes found by search add that [Keycloak 26.6.0](https://www.keycloak.org/2026/04/keycloak-2660-released) added experimental CIMD so Keycloak can act as an authorization server for MCP, and promoted federated client authentication and JWT Authorization Grant to supported. This comes from a search summary and was not read in full.

## User federation vs identity brokering

Source: the [Server Administration Guide](https://www.keycloak.org/docs/latest/server_admin/index.html). "User Federation" is the admin console's menu label, and the guide's section is called "Using external storage". Brokering is under "Integrating identity providers".

- **User federation:** user records stay in existing external stores. Keycloak supports LDAP and Active Directory, and the User Storage SPI allows custom databases. At login Keycloak searches that storage and maps the record into its own user model. The intro describes a server-side lookup and does not mention sending the browser elsewhere.
- **Identity brokering:** the guide describes an intermediary connecting service providers with identity providers, typically over SAML 2.0, OpenID Connect or OAuth 2.0. Its overview says Keycloak redirects the user to the identity provider's login page. Accounts can be linked to external identities or created from them. Client applications never contact the external provider.

## Is application setup explained visually anywhere?

One search for visual explainers of client registration from the application's point of view found only text: a [MojoAuth glossary](https://mojoauth.com/glossary/client-id), [Thales setup docs](https://thalesdocs.com/oip/idaas-core/idaas-core-tulip/oauth-openid/oauth-oidc-setup/index.html), the [OpenID Connect registration spec](https://openid.net/specs/openid-connect-registration-1_0-12.html) and vendor docs. **This supports the maintainer's point but is a weak test.** It would not catch vendor quickstarts with diagrams, which are the most likely counterexamples, or a setup section inside a course. Note that IdentiFlows does have an OIDC Discovery flow, so part of this is covered as a separate flow.

## Are external IdPs explained interactively anywhere?

One search found no interactive explainer. The closest material is [Authlete's tutorial on integration with external IdPs](https://www.authlete.com/developers/tutorial/idp), which has a federation flow illustration, and [Red Hat's identity broker docs](https://access.redhat.com/documentation/vi-vn/red_hat_single_sign-on/7.4/html/server_administration_guide/identity_broker). The earlier research also found one `identity_broker_flow` figure in Keycloak's guide. **Also a weak test.**

## Confirming the headline tools

Separate searches confirmed the two closest tools and what they are for:

- **IdentiFlows:** [Auth0's announcement](https://auth0.com/blog/introducing-identiflows-a-visual-reference-for-identity-flows/) describes per-flow pages with an intro, a sequence diagram and a step-by-step breakdown. It calls this an early release and asks for feedback. An earlier copy of the post said Client Credentials, Device Authorization and WebAuthn were coming soon. The first two have since shipped, so WebAuthn may be next.
- **AuthPlayground:** [Ping's docs](https://developer.pingidentity.com/identity-for-ai/protocols/authplayground-cimd.html) confirm it is a simulated environment with no external IdP. Ping also describes a "Full Cross-Domain Access" flow that chains PAR, RAR, PKCE, DPoP and token exchange across seven steps. **That is the nearest thing to composition found**, but it is a fixed chain the reader cannot change.
