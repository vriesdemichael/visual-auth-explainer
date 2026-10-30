# Follow-up checks

Done on 2026-10-30, after the main research, to test points the maintainer raised in response to it. These were quick checks and not a survey.

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
