# Advanced OAuth, identity and authz specs: visual and interactive coverage (checked 2026-10-30)

Verification legend used throughout:
- **[B]** rendered and read in a real browser.
- **[F]** opened with a text fetch. Text extraction cannot see images, so a "no diagrams" result from [F] means none were referenced in the page text.
- **[S]** seen only in search results, page not opened. Treat as a lead, not a finding.

Ratings: **interactive**, **static diagram**, **text only**, **nothing found**. "Nothing found" means not found in this research, not proven absent.

## For each topic, what is the best existing visual or interactive explanation?

### Takeaway
Two recent vendor sites do most of the work: Ping's AuthPlayground (11 protocol flows, the agentic and token-hardening set, including CIMD) and Auth0/Okta's IdentiFlows (13 steppable sequence diagrams, the classic set plus SAML). They barely overlap. Neither has DCR side by side with CIMD, a simple vs advanced mode, logout, FAPI, Keycloak or authz. Authz has good sandboxes but no explainers, and Keycloak has nothing built for explanation.

### Cited Findings

**The two sites that matter most**
- **AuthPlayground.dev** (Ping Identity, vendor, footer copyright Ping): flows are PKCE, PAR, DPoP, Token Exchange, RAR, Txn Tokens, XAA / ID-JAG, SPIFFE, Resource Metadata (RFC 9728), CIMD, and a composite Full XAA Use Case. DCR and device flow are not listed. Simple/advanced mode is not mentioned. [F] — [AuthPlayground home](https://www.authplayground.dev/)
- Each AuthPlayground flow has a section labelled Sequence Diagram with named participants, numbered steps, a per-step Execute button, an Activity panel for payloads, and Reset Flow. Example: DPoP has Client App, IdP and Resource Server across 4 steps. [F] — [DPoP flow](https://www.authplayground.dev/flows/dpop); [CIMD flow](https://www.authplayground.dev/flows/cimd). My browser could not load this site (navigation denied or failed), so the rendering itself is unconfirmed.
- **IdentiFlows** (identiflows.dev, footer says presented by Auth0, copyright 2026 Okta, vendor) is the closest format match to the requester's idea: a real sequence diagram, an Interactive Mode toggle to advance one message at a time, and clickable arrows showing the exact request, response or token. The SAML diagram page also lists the official specs. I read the controls but did not click through a flow. [B] — [How it works](https://identiflows.dev/how-it-works); [SAML example](https://identiflows.dev/diagrams/saml-sp-initiated/)
- IdentiFlows catalogue, read from all 4 category tabs, 13 flows: OIDC Code + PKCE, OIDC Implicit (marked deprecated), OIDC Discovery, OAuth Authorization Code, OAuth Code + PKCE, Client Credentials, Device Authorization, Private Key JWT, Refresh Token, CIBA, DPoP Token Request, DPoP Token Usage, SAML SP-Initiated SSO. No CIMD, DCR, PAR, RAR, Token Exchange, mTLS, ID-JAG, logout, passkeys or authz. No simple/advanced toggle seen. [B] — [IdentiFlows](https://identiflows.dev/)

**OAuth registration**

| Topic | Best found | Rating | Publisher and stance | Check |
|---|---|---|---|---|
| CIMD | [AuthPlayground CIMD flow](https://www.authplayground.dev/flows/cimd), 4 steps with Execute; written companion at [Ping docs](https://developer.pingidentity.com/identity-for-ai/protocols/authplayground-cimd.md) | interactive | Ping, vendor | [F] |
| CIMD, neutral | [MCP client registration spec](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/client-registration) has a Mermaid CIMD sequence with success and failure branches | static diagram | MCP spec, neutral | [F] |
| CIMD, explainer site | [client.dev](https://client.dev/) (cimd.dev redirects there): numbered 4-step flow with JSON samples, no diagram or tool, no explicit DCR comparison. Parecki endorsed it in [his adoption post](https://aaronparecki.com/2025/10/08/4/cimd) | text only | Stytch, vendor | [F] |
| DCR (RFC 7591) | [MCPJam OAuth debugger](https://docs.mcpjam.com/inspector/guided-oauth): docs describe a guided step-by-step flow with a visual synchronised to progress, supporting pre-registration, DCR and CIMD against spec versions 03-26, 06-18, 11-25 and 2026-07-28 | interactive (docs only, not run) | MCPJam, dev tool | [F] |
| DCR, neutral | [MCP authorization spec](https://modelcontextprotocol.io/specification/draft/basic/authorization) has one Mermaid sequence with alt branches for CIMD, DCR and pre-registered | static diagram | MCP spec, neutral | [F] |
| CIMD vs DCR | [Auth0 post](https://auth0.com/blog/cimd-vs-dcr-mcp-registration/) (2025-11-24): one CIMD flow diagram, no comparison table, compares on statefulness, scale, attack surface, impersonation, overhead, client auth and risks. Largely fair | static diagram | Auth0, vendor | [F] |
| CIMD vs DCR | [WorkOS post](https://workos.com/blog/mcp-client-registration-cimd-vs-dcr) (2025-12-02): no diagrams, numbered flows and code, sign-up pitch at end | text only | WorkOS, vendor | [F] |
| CIMD vs DCR | [Scalekit post](https://www.scalekit.com/blog/how-mcp-clients-register-using-cimd) (2026-01-06): static CIMD vs DCR graphic plus 4-step flow, mostly marketing | static diagram | Scalekit, vendor | [F] |
| MCP adoption | [MCP blog, Evolving OAuth Client Registration](https://blog.modelcontextprotocol.io/posts/client_registration/) (2025-08-22): two sequence diagrams, no comparison table | static diagram | MCP maintainers, neutral | [F] |
| MCP adoption | [Scalekit on MCPJam](https://www.scalekit.com/blog/mcpjams-oauth-debugger) says the debugger lets you switch registration style against one backend. Vendor claim, not tested | interactive (claimed) | Scalekit, vendor | [F] |
| CIMD glossary | [Logto Auth Wiki](https://auth-wiki.logto.io/client-id-metadata-document): Mermaid sequence | static diagram | Logto, vendor | [F] |

**Newer OAuth mechanisms**

| Topic | Best found | Rating | Publisher and stance | Check |
|---|---|---|---|---|
| PKCE | [IdentiFlows](https://identiflows.dev/) and [AuthPlayground](https://www.authplayground.dev/) (also has a PKCE code generator) | interactive | Auth0; Ping, vendors | [B]/[F] |
| PAR (RFC 9126) | [AuthPlayground](https://www.authplayground.dev/) | interactive | Ping, vendor | [F] |
| RAR (RFC 9396) | [AuthPlayground](https://www.authplayground.dev/) | interactive | Ping, vendor | [F] |
| DPoP (RFC 9449) | [dpop.info](https://dpop.info): 8-step interactive tutorial with attack demos, mostly text and HTTP samples, no flow diagram referenced. Also [AuthPlayground DPoP](https://www.authplayground.dev/flows/dpop) and 2 IdentiFlows diagrams | interactive | dpop.info by Sambego, individual; others vendor | [F]/[B] |
| mTLS-bound tokens (RFC 8705) | Only RFC copies with an ASCII figure surfaced ([RFC 8705](https://www.rfc-editor.org/rfc/rfc8705)). Not listed on AuthPlayground or IdentiFlows | nothing found (beyond RFC ASCII) | IETF, neutral | [S] |
| Token Exchange (RFC 8693) | [AuthPlayground](https://www.authplayground.dev/) | interactive | Ping, vendor | [F] |
| Device Code | [IdentiFlows](https://identiflows.dev/) | interactive | Auth0, vendor | [B] |
| CIBA | [IdentiFlows](https://identiflows.dev/); [OAuth Tools](https://oauth.tools) has a CIBA flow runner | interactive | Auth0; Curity, vendors | [B] |
| OAuth 2.1 | [oauth.net/2.1](https://oauth.net/2.1/): list of changes, no diagrams. Search found vendor comparison tables ([Stytch](https://stytch.com/blog/oauth-2-1-vs-2-0/), [Descope](https://www.descope.com/blog/post/oauth-2-0-vs-oauth-2-1)) and no interactive comparison | text only; static [S] | oauth.net, mostly neutral | [F]/[S] |
| FAPI 2.0 | [OpenID FAPI specs](https://openid.net/wg/fapi/specifications/) lists Security Profile and Message Signing as final, no diagrams. [SecureAuth post](https://docs.secureauth.com/ciam/en/exploring-financial-grade-api--fapi--2-0.html) (2025-06-10) has no diagrams. [Curity](https://curity.io/blog/the-state-of-fapi-2/) and [Zuplo](https://zuplo.com/learning-center/fapi-2-financial-grade-api-security-patterns) surfaced, not opened | text only | OpenID neutral; others vendor | [F]/[S] |
| RFC 9728 | [AuthPlayground Resource Metadata](https://www.authplayground.dev/) is interactive; the [MCP spec sequence](https://modelcontextprotocol.io/specification/draft/basic/authorization) shows it in context | interactive | Ping, vendor; MCP, neutral | [F] |
| ID-JAG / Cross App Access | [xaa.dev](https://xaa.dev): runs a live flow with no account, 4 labelled steps and clickable actor cards, no formal sequence diagram. Presented by Okta Developer | interactive | Okta, vendor | [F] |
| ID-JAG, alternative | [AuthPlayground](https://www.authplayground.dev/) has XAA / ID-JAG and Full XAA Use Case. Static: [Auth0 post](https://auth0.com/blog/what-is-id-jag) (2026-10-20, leans marketing) and [Keycloak ID-JAG docs](https://www.keycloak.org/securing-apps/identity-assertion-jwt-authorization-grant) with an architecture diagram | interactive; static | Ping, Auth0, Keycloak | [F] |
| GNAP (RFC 9635) | [oauth.xyz](https://oauth.xyz/) says it has a live playground but gives no link in the text, is undated, latest dated item January 2021, and warns its implementations may be unfinished. [RFC 9635](https://www.rfc-editor.org/rfc/rfc9635) has a roles figure [S]. No third-party visual surfaced | text only effectively (playground unconfirmed) | Justin Richer / bspk, individual | [F] |

**OIDC specifics**

| Topic | Best found | Rating | Publisher and stance | Check |
|---|---|---|---|---|
| ID token vs access token | [oauth.net](https://oauth.net/id-tokens-vs-access-tokens/) has no diagrams. IdentiFlows and OAuth Tools let you inspect tokens but do not teach the distinction | text only | oauth.net, mostly neutral (promotes a course) | [F] |
| Hybrid flow | [OAuth Tools](https://oauth.tools) lists a Hybrid Flow runner. Not on IdentiFlows or AuthPlayground. Kawasaki's Medium diagrams returned 403, so unverified | interactive runner, no explainer verified | Curity, vendor | [B] |
| Back- and front-channel logout | [Curity logout article](https://curity.io/resources/learn/openid-connect-logout/), updated 2024-02-09, references front- and back-channel diagrams. OAuth Tools has a Logout Flow, variant unverified | static diagram | Curity, vendor | [F] |
| Session management | Same Curity article, 8-step session management sequence covering check_session_iframe. [Ping](https://docs.pingidentity.com/pingam/8/am-oidc1/session-management.md) and [WSO2](https://is.docs.wso2.com/en/next/references/concepts/oidc-session-management/) docs reference diagrams [S] | static diagram | Curity, vendor | [F] |

**Keycloak**

| Topic | Best found | Rating | Publisher and stance | Check |
|---|---|---|---|---|
| Realms, clients, client scopes | [Server Administration Guide](https://www.keycloak.org/docs/latest/server_admin/index.html): 291 images. A filename and alt filter found no conceptual realm, client or scope figure. Not a full image audit | text and UI screenshots | Keycloak, neutral | [B] |
| Identity brokering | Same guide has one identity_broker_flow figure | static diagram | Keycloak, neutral | [B] |
| Authentication flows | [FlowDiagram.tsx](https://github.com/keycloak/keycloak/blob/main/js/apps/admin-ui/src/authentication/components/FlowDiagram.tsx) in the Keycloak admin UI renders flows as a React Flow graph with conditions, sub-flows, minimap and zoom. It is a config tool inside the product, not an explainer. Source read, not run | interactive inside admin console | Keycloak, neutral | [F] |
| Authentication flows, third party | [Phase Two](https://phasetwo.io/docs/authentication/understanding-flows/): text and admin UI screenshots, no original diagrams | text and screenshots | Phase Two, vendor | [F] |
| Authorization Services and UMA | [Authorization Services Guide](https://www.keycloak.org/docs/latest/authorization_services/index.html) has 5 conceptual figures: architecture, resource management, resource server, policy management, PEP. Filename filter found no UMA or permission ticket sequence figure | static diagram (UMA itself: text) | Keycloak, neutral | [B] |
| UMA, third party | [Skycloak UMA guide](https://skycloak.io/blog/keycloak-uma-2-0-resource-sharing-guide/) describes the ticket to RPT flow; diagrams unverified | unverified | Skycloak, vendor | [S] |
| Newer Keycloak features | The server admin guide has draw.io sequence diagrams for parameterized scopes, OID4VCI authorization code and pre-authorized flows. The [MCP integration page](https://www.keycloak.org/nightly/securing-apps/mcp-authz-server) has a compliance table and no diagrams | static diagram | Keycloak, neutral | [B]/[F] |

**Authn beyond OAuth**

| Topic | Best found | Rating | Publisher and stance | Check |
|---|---|---|---|---|
| Passkeys / WebAuthn | [webauthn.me](https://webauthn.me): 6-step guided registration and login, plus a debugger | interactive | Auth0/Okta, vendor | [F] |
| Passkeys / WebAuthn | [webauthn.io](https://webauthn.io/): live demo for testing WebAuthn and passkeys. Whether it visualises the ceremony is unconfirmed | interactive demo | Duo Labs/Cisco, mostly neutral | [B] |
| Passkeys / WebAuthn | [webauthn.guide](https://webauthn.guide): image-based flow illustrations, no mention of passkeys in the text | static diagram, dated | Duo-sponsored | [F] |
| Passkeys / WebAuthn | [passkeys.dev](https://passkeys.dev/docs/intro/what-are-passkeys/): text explainer, links to developer tools, a response decoder and demo lists | text plus tools | W3C CG and FIDO members, neutral | [F] |
| SAML | [IdentiFlows SAML SP-Initiated](https://identiflows.dev/diagrams/saml-sp-initiated/): 12-message steppable sequence. No IdP-initiated or single logout flow listed | interactive (one flow) | Auth0, vendor | [B] |
| SAML | Otherwise static: [Ping docs](https://docs.pingidentity.com/pinggateway/2025.3/gateway-guide/federation-about-sp-init.html), [Creately template](https://creately.com/diagram/example/i7f2co0k2/saml-flow) | static diagram | vendors | [S] |

**Authz**

| Topic | Best found | Rating | Publisher and stance | Check |
|---|---|---|---|---|
| ReBAC | [SpiceDB Playground](https://play.authzed.com/): schema, relationships, assertions, expected relations, Visualize and Explain, an AI assistant | interactive sandbox | AuthZed, vendor | [B] |
| ReBAC, plus attributes | [Permify Playground](https://play.permify.co/): schema, Visualizer, relationships, attributes, enforcement, guided intro. Banner says acquired by FusionAuth | interactive sandbox | Permify, vendor | [B] |
| ReBAC | [Fine-Grained Authorization Playground](https://play.fga.dev/): guided intro, Auth0 FGA branded | interactive | Auth0, vendor | [B] |
| RBAC and ABAC policies | [Cerbos Playground](https://play.cerbos.dev/): policy sandbox with wizard and examples, decisions update as you type | interactive sandbox | Cerbos, vendor | [B] |
| Oso | [Authorization Academy](https://www.osohq.com/academy) has chapters on RBAC, ABAC and ReBAC, no diagrams or interactivity in the text, banner says acquired by Tiny. No playground confirmed; try.osohq.com would not load in my browser | text only | Oso, vendor | [F] |
| Zanzibar | [zanzibar.academy](https://zanzibar.academy): tour with Basics, Editors to Viewer, Groups, Folders tabs, step counter, tuple cards and a query answer. No graph traversal visible in the text | interactive | Auth0 Lab, vendor | [F] |
| Zanzibar | [AuthZed annotated paper](https://authzed.com/zanzibar): paper plus commentary | text (paper figures only) | AuthZed, vendor | [F] |
| RBAC vs ABAC vs ReBAC | [OpenFGA concepts](https://openfga.dev/docs/authorization-concepts): short sections, no diagrams. Two searches found no interactive side-by-side | text only | OpenFGA project | [F] |

### Inferences
- Sandboxes outnumber explainers in authz. All four playgrounds assume you already know why you want ReBAC or policies, and they teach the vendor's DSL rather than the concept.
- MCPJam is a debugger aimed at your own server, while AuthPlayground teaches a fixed flow. Neither is a teaching toggle between CIMD and DCR.
- zanzibar.academy's wording (Auth0 "is building", waitlist link) suggests it has not been updated in a while.

### Gaps
- AuthPlayground rendering was not seen; my browser could not load it. Whether Execute performs real calls or simulates them is unverified.
- MCPJam was verified from docs only. Whether it needs a live MCP server and an account is unknown.
- Launch dates of IdentiFlows and AuthPlayground were not found, so how new they are is unknown.
- The OAuth Tools catalogue beyond the default workspace was not explored (PAR, device, token exchange and mTLS may exist behind Start Flow). The general playgrounds researcher should have this.
- Illustrated DPoP and Illustrated PAR (Kawasaki/Authlete) were referenced by [DZone](https://cloud.dzone.com/articles/fapi-20-explained) in a search result but not opened; Medium blocked my fetch.
- [Descope's XAA page](https://docs.descope.com/agentic-identity-hub/enterprise-managed-authorization/how-xaa-works) and the Okta XAA blog posts were not opened.

## Which topics have effectively no good visual explanation today, and which are saturated?

### Takeaway
Empty or thin: Keycloak concepts, the CIMD vs DCR comparison as an interactive, logout and session management beyond static diagrams, mTLS-bound tokens, FAPI 2.0, OAuth 2.1 as a delta, GNAP, UMA, and an RBAC/ABAC/ReBAC comparison. Saturated: Code + PKCE, JWT decoding, WebAuthn demos, ReBAC sandboxes, and vendor text on CIMD vs DCR.

### Cited Findings
- **No interactive found, static or text at best:** mTLS-bound tokens ([RFC 8705](https://www.rfc-editor.org/rfc/rfc8705), [S]), FAPI 2.0 ([OpenID](https://openid.net/wg/fapi/specifications/)), OAuth 2.1 ([oauth.net](https://oauth.net/2.1/)), back- and front-channel logout and session management ([Curity](https://curity.io/resources/learn/openid-connect-logout/)), ID token vs access token ([oauth.net](https://oauth.net/id-tokens-vs-access-tokens/)), UMA ([Keycloak guide](https://www.keycloak.org/docs/latest/authorization_services/index.html)), and GNAP ([oauth.xyz](https://oauth.xyz/), playground unconfirmed).
- **Keycloak:** official docs are reference text plus screenshots with a few figures ([Server Admin Guide](https://www.keycloak.org/docs/latest/server_admin/index.html), [Authorization Services](https://www.keycloak.org/docs/latest/authorization_services/index.html)), and third-party searches returned text tutorials ([OneUptime](https://oneuptime.com/blog/post/2026-01-27-keycloak-realms-clients/view) [S], [Phase Two](https://phasetwo.io/docs/authentication/understanding-flows/)). No interactive explainer of Keycloak concepts surfaced in four searches.
- **CIMD vs DCR:** covered repeatedly in vendor prose ([Auth0](https://auth0.com/blog/cimd-vs-dcr-mcp-registration/), [WorkOS](https://workos.com/blog/mcp-client-registration-cimd-vs-dcr), [Scalekit](https://www.scalekit.com/blog/how-mcp-clients-register-using-cimd)). The interactive CIMD flow on [AuthPlayground](https://www.authplayground.dev/) has no DCR counterpart. Only [MCPJam](https://docs.mcpjam.com/inspector/guided-oauth) covers both, as a debugger.
- **Saturated or well served:** Code + PKCE ([IdentiFlows](https://identiflows.dev/), [AuthPlayground](https://www.authplayground.dev/)), WebAuthn ([webauthn.me](https://webauthn.me), [webauthn.io](https://webauthn.io/)), ReBAC sandboxes ([SpiceDB](https://play.authzed.com/), [Permify](https://play.permify.co/), [FGA](https://play.fga.dev/)).
- **Adequately covered by one or two interactives, so a new site adds little here alone:** PAR, RAR, Token Exchange, ID-JAG ([AuthPlayground](https://www.authplayground.dev/), [xaa.dev](https://xaa.dev)), DPoP ([dpop.info](https://dpop.info)), device code and CIBA ([IdentiFlows](https://identiflows.dev/)).

### Inferences
- Strongest openings for this requester, in order: (1) Keycloak-specific visuals, since nobody else has them and the requester has the expertise; (2) a registration explainer with a CIMD, DCR and pre-registration toggle over one sequence diagram, tied to the MCP priority order; (3) composition views, such as FAPI 2.0 as PAR + PKCE + sender-constraining, or OAuth 2.1 as a diff over 2.0, because existing tools show one mechanism at a time.
- The "this already exists" risk is real for single-flow steppable sequence diagrams. IdentiFlows has essentially the proposed interaction model. A new site should compete on toggles, depth levels and neutrality rather than on the diagram format itself.
- Okta/Auth0 and Ping could extend these catalogues cheaply, so any single-flow gap (for example, Auth0 adding CIMD) could close without notice.

### Gaps
- "Nothing found" for mTLS, FAPI and logout rests on limited searches, not a proof of absence. Vendor courses or conference talks may have visuals I did not see.
- Video coverage was not assessed.
- Demand per topic is out of scope here and covered by another researcher.

## Does any single site span authn and authz across multiple levels of depth, or is everything single-topic?

### Takeaway
None found. The closest are protocol catalogues with one depth level, or one broad glossary. Auth0/Okta spreads the widest coverage across separate microsites with no shared navigation or depth model.

### Cited Findings
- [IdentiFlows](https://identiflows.dev/) spans OAuth, OIDC and SAML with a single depth level and no authz or passkeys. [B]
- [AuthPlayground](https://www.authplayground.dev/) spans OAuth extensions plus SPIFFE, with no SAML, passkeys or authz listed, and no simple/advanced mode mentioned. [F]
- [Logto Auth Wiki](https://auth-wiki.logto.io/) is the broadest in scope: its home page mentions SAML, WebAuthn, passkeys, RBAC, ABAC and token exchange, and the CIMD page has a Mermaid diagram. It is a vendor glossary with no interactive tools seen on that page. Home page text did not mention ReBAC, DPoP, CIBA, GNAP or Zanzibar, though the home page may not list everything. [B]/[F]
- Auth0/Okta properties taken together cover flows ([IdentiFlows](https://identiflows.dev/)), passkeys ([webauthn.me](https://webauthn.me)), Zanzibar ([zanzibar.academy](https://zanzibar.academy)) and ReBAC ([play.fga.dev](https://play.fga.dev/)). IdentiFlows' footer links to the JWT debugger and OIDC playground, but it does not link to these others in what I read. [B]/[F]
- A broad search for an all-in-one site returned single-topic items, such as a [personal OAuth/OIDC visual guide](https://rezaulhasan-me.pages.dev/blog/oauth-openid-connect) and [Auth0 sketchnotes](https://dev.to/auth0/lets-sketch-identity-authentication-vs-authorization-48kb). [S]
- Simple vs advanced mode: not present on IdentiFlows as read, and not mentioned on AuthPlayground. [B]/[F]

### Inferences
- A vendor-neutral site spanning authn and authz with depth levels appears unclaimed. Almost every interactive above comes from a company selling in the category (dpop.info and MCPJam are the clear exceptions), which is itself a differentiator for a neutral explainer.
- Consolidation may reduce competition from smaller players: Permify shows an acquisition by [FusionAuth](https://play.permify.co/), and Oso shows one by [Tiny](https://www.osohq.com/academy). What that means for their learning material is not known.

### Gaps
- Curity's learning library was not audited across topics; it may be the largest vendor library, but it is articles rather than interactive explainers.
- Paid courses (for example Pragmatic Web Security) were not examined.

## What is the current status (as of Oct 2026) of CIMD and of the MCP authorization spec?

### Takeaway
A CIMD/DCR explainer is timely. MCP's current revision (2026-07-28) recommends CIMD and formally deprecates DCR, while CIMD itself is still an IETF working group draft with no last call recorded. Expect wording to move, so version-pin the content.

### Cited Findings

**CIMD at the IETF, checked 2026-10-30**
- Latest is draft-ietf-oauth-client-id-metadata-document-02, updated 2026-07-06, expires 2027-01-07. State is WG Document, IESG state I-D Exists, no shepherd or responsible AD listed, Standards Track in the header. Authors are Aaron Parecki (Okta) and Emelia Smith. — [Datatracker](https://datatracker.ietf.org/doc/draft-ietf-oauth-client-id-metadata-document/)
- History: -00 on 2025-10-08 as a WG document, -01 on 2026-03-01, -02 on 2026-07-06. No WG or IETF last call event is recorded. — [Datatracker history](https://datatracker.ietf.org/doc/draft-ietf-oauth-client-id-metadata-document/history/)

**MCP authorization spec**
- 2026-07-28 is the current final revision, not a release candidate, and the announcement says DCR is deprecated in favour of CIMD and will go in a future version, with no version named. — [MCP blog, 2026-07-28](https://blog.modelcontextprotocol.io/posts/2026-07-28/)
- The changelog lists DCR under Deprecated (PR #2858), retained for servers without CIMD. A new policy sets a minimum twelve-month deprecation window (SEP-2596). — [Changelog](https://modelcontextprotocol.io/specification/2026-07-28/changelog)
- Other auth changes in that revision: servers SHOULD send `iss` per RFC 9207 and clients MUST validate a present `iss` (SEP-2468); clients MUST send `application_type` in DCR (SEP-837); credentials are bound to the issuing authorization server (SEP-2352). — [Changelog](https://modelcontextprotocol.io/specification/2026-07-28/changelog)
- Normative levels: CIMD SHOULD, DCR MAY. Client priority is pre-registered first, then CIMD if `client_id_metadata_document_supported`, then DCR via `registration_endpoint`, then prompt the user. CIMD client IDs are portable across authorization servers; pre-registered or DCR credentials are not. — [Client registration, 2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/client-registration)
- RFC 9728: MCP servers MUST implement it and clients MUST use it for authorization server discovery. RFC 8707 resource indicators are a client MUST. — [Draft authorization spec](https://modelcontextprotocol.io/specification/draft/basic/authorization). I read the draft for this; the 2026-07-28 revision's main authorization page was not opened separately.
- The MCP spec still links CIMD draft -00 while the IETF draft is at -02. — [Client registration](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/client-registration)
- History: 2025-11-25 added CIMD as recommended (SEP-991) and aligned discovery with RFC 9728 (SEP-985). — [2025-11-25 changelog](https://modelcontextprotocol.io/specification/2025-11-25/changelog). DCR moved from SHOULD (2025-03-26, 2025-06-18) to MAY (2025-11-25, 2026-07-28). — [Keycloak MCP table](https://www.keycloak.org/nightly/securing-apps/mcp-authz-server)
- Parecki's rationale: public registration endpoints need rate limiting and grow without bound, and clients often re-register. — [Parecki, 2025-11-25](https://aaronparecki.com/2025/11/25/1/mcp-authorization-spec-update)
- Extensions: Enterprise-Managed Authorization and OAuth Client Credentials are both listed as stable with a 2026-07-28 revision. — [ext-auth repo](https://github.com/modelcontextprotocol/ext-auth)

**Adjacent specs**
- ID-JAG: draft-ietf-oauth-identity-assertion-authz-grant-05, dated 2026-10-30, expires 2027-05-03, Standards Track in the header. Authors are Parecki, McGuinness and Campbell. — [Datatracker](https://datatracker.ietf.org/doc/draft-ietf-oauth-identity-assertion-authz-grant/)
- From the OAuth WG list: OAuth 2.1 is at -16 (2026-09-02), still a WG Document. Browser-based apps is published as RFC 10017 (BCP, 2026-08). Transaction Tokens -11 is at WG consensus, waiting for write-up. Identity Chaining -17 is in the RFC Editor queue. — [OAuth WG documents](https://datatracker.ietf.org/wg/oauth/documents/)
- GNAP is published as [RFC 9635](https://www.rfc-editor.org/rfc/rfc9635) (October 2024, per the RFC header in search results). [S]

**Keycloak's position, relevant to this requester**
- Nightly docs: CIMD experimental (`--features=cimd`), DCR supported, RFC 8707 experimental (`--features=resource-indicators`), RFC 9207 supported, MCP 2026-07-28 compliance experimental. Keycloak does not accept ChatGPT's CIMD documents because they use a different metadata field name. — [Keycloak MCP page](https://www.keycloak.org/nightly/securing-apps/mcp-authz-server)
- ID-JAG: receiver side only, experimental (`--features=identity-assertion-jwt`), based on draft-01, with the issuer side marked TBD. — [Keycloak ID-JAG docs](https://www.keycloak.org/securing-apps/identity-assertion-jwt-authorization-grant)

### Inferences
- Applying the twelve-month minimum to DCR gives an earliest removal around mid-2027, assuming the window starts at the 2026-07-28 revision. MCP gives no date, so the DCR-to-CIMD migration story should stay relevant for at least the next year.
- Because the IETF draft, the MCP citation (-00) and Keycloak's citation (-01) are all on different revisions, an explainer should date its content and pin versions, and could usefully show this skew.
- Keycloak's experimental flags plus MCP's priority order make "MCP on Keycloak, step by step" a distinctive angle that vendor sites have little reason to build.

### Gaps
- IETF 126 minutes and the IETF 127 agenda for the OAuth WG were not found, so WG intent on last call timing is unknown; the record shows only no last call event so far.
- Real-world CIMD adoption numbers among MCP clients and authorization servers were not found.
- A third-party search summary said Keycloak 26.6.0 release notes describe CIMD as required by MCP, which would conflict with the spec's SHOULD. I did not open those notes, so treat it as unconfirmed.
