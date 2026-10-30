# Interactive OAuth 2.x / OIDC tools, playgrounds and visual simulators

Research date: 2026-10-30. Scope: interactive tools only. Spec coverage, static illustrated articles, community demand and format benchmarks are covered by other researchers.

**How each entry was checked** (stated per tool, because the depth of checking varies):
- **[Operated]** opened in a real browser and used the controls.
- **[Page]** page text fetched and read, controls not used.
- **[Repo]** README and GitHub metadata only, tool not run.
- **[Snippet]** search result only, could not or did not open it. Treat as unconfirmed.

GitHub stars and dates were read from the GitHub API on 2026-10-30.

**Debugger vs explainer, as used here:**
- **Debugger:** you bring a real client or authorization server (AS) and see real tokens.
- **Explainer:** teaches the concept using scripted or simulated data.
- **Sandbox:** in between. Canned flows run over real HTTP against a server the project itself hosts, so no setup is needed but it does not test your system.

## Which tools exist?

### Takeaway
Roughly 40 tools exist and the category is getting crowded fast, with most serious entrants launched in 2026: ProtocolSoup (January), Authlete Playground (June), Ping AuthPlayground (August), Auth0 IdentiFlows (September). Older tools (oauth.tools, oauth.com, oauthdebugger, Google Playground) are form-based, with no step-through sequence diagram.

### Cited Findings

#### A. Closest competitors (checked in most depth)

**IdentiFlows** (`https://identiflows.dev/`) — Explainer. [Operated]
- **Operator:** vendor, Auth0/Okta ("Presented by Auth0", copyright Okta) — [IdentiFlows](https://identiflows.dev/)
- **Launch:** blog post dated 2026-09-29 by Andrea Chiarelli, described as an early release asking for feedback — [Auth0 blog](https://auth0.com/blog/introducing-identiflows-a-visual-reference-for-identity-flows)
- **Diagram:** real lifeline sequence diagrams. Static mode has clickable arrows. An "Interactive Mode" button switches to Previous/Next with "STEP 1 OF 18" and a step-details panel — [IdentiFlows PKCE page](https://identiflows.dev/diagrams/oauth-authorization-code-pkce/)
- **Toggles/modes:** none. The diagram page has 0 selects and 0 checkboxes or switches in the DOM. Variants are separate pages (Authorization Code and Code + PKCE are different diagrams) — [IdentiFlows PKCE page](https://identiflows.dev/diagrams/oauth-authorization-code-pkce/)
- **Flows:** 13 in the sitemap: DPoP request, DPoP usage, OAuth code, code + PKCE, client credentials, device, private_key_jwt, refresh, OIDC code, CIBA, discovery, implicit, SAML SP-initiated. No PAR, DCR or CIMD — [sitemap](https://identiflows.dev/sitemap.xml)
- **Signup:** none seen. No source repository is linked — [IdentiFlows](https://identiflows.dev/)
- **Maintenance:** very active. The launch post listed 8 flows, with client credentials and device as next and private_key_jwt on a longer backlog. All three are live about a month later — [Auth0 blog](https://auth0.com/blog/introducing-identiflows-a-visual-reference-for-identity-flows); [sitemap](https://identiflows.dev/sitemap.xml)

**AuthPlayground** (`https://www.authplayground.dev/`) — Sandbox/explainer on a simulated backend. [Operated]
- **Operator:** vendor, Ping Identity (footer copyright, "Powered by") — [About](https://www.authplayground.dev/about/)
- **Launch:** 2026-08-24 — [Ping release notes](https://developer.pingidentity.com/identity-for-ai/release-notes/idai-whats-new.html)
- **What it does:** one page per protocol: a sequence diagram, then numbered step cards each with an "Execute" button, then an Activity panel with the raw request and response and "Copy as cURL" — [CIMD flow](https://www.authplayground.dev/flows/cimd/)
- **Backend:** the About page says "The backend is a lightweight simulation" with no external IdP. Ping's docs also say it shows real HTTP requests and responses; both hold because the simulation is reached over HTTP — [About](https://www.authplayground.dev/about/); [Ping docs](https://developer.pingidentity.com/identity-for-ai/protocols/authplayground.html)
- **Diagram:** static Mermaid. On the CIMD flow, no highlight classes were present after executing step 1, and the SVG length was identical before and after executing step 2 (27,496 characters), so the diagram does not appear to track progress — [CIMD flow](https://www.authplayground.dev/flows/cimd/)
- **Toggles/modes:** none. The DPoP page has 0 inputs, selects or switches, and the only controls are Execute and Reset Flow — [DPoP flow](https://www.authplayground.dev/flows/dpop/)
- **Flows:** PKCE, PAR, DPoP, Token Exchange, RAR, Txn Tokens, XAA/ID-JAG, SPIFFE, Resource Metadata, CIMD, Full XAA Use Case. DCR, client credentials, device and refresh are not listed — [home](https://www.authplayground.dev/)
- **Signup:** none seen. **Maintenance:** new, only one release-note entry so far — [Ping release notes](https://developer.pingidentity.com/identity-for-ai/release-notes/idai-whats-new.html)

**ProtocolSoup** (`https://protocolsoup.com/`) — Sandbox. [Operated]
- **Operator:** independent, Mason Parle. Apache-2.0, 31 stars, created 2025-11-28 — [GitHub](https://github.com/ParleSec/ProtocolSoup)
- **Launch:** Show HN 2026-01-14, 4 points and 0 comments — [HN](https://news.ycombinator.com/item?id=46615649)
- **Backend:** the site says "real hops · real tokens · no mocks", but the Show HN post and README describe a built-in Mock IdP. The accurate reading is real protocol traffic against a project-run IdP — [Looking Glass](https://protocolsoup.com/looking-glass); [HN](https://news.ycombinator.com/item?id=46615649)
- **Toggles:** real, but per flow. Client Credentials exposes client_secret_basic / private_key_jwt and Bearer / DPoP. I ran both token options: Bearer produced 12 flow events and 2 wire exchanges, DPoP produced 27 flow events and 4 wire exchanges, including the `use_dpop_nonce` 400 and retry. The Authorization Code flow showed no option panel — [Looking Glass](https://protocolsoup.com/looking-glass)
- **Diagram:** the reference pages have a static lifeline diagram labelled "Click any step for details". The live run in Looking Glass is a vertical event timeline with timings and spec citations, not a lifeline diagram — [PKCE reference](https://protocolsoup.com/protocol/oauth2/flow/authorization-code-pkce). The README calls this "Flow Visualizer: animated step-by-step flow diagrams" — [GitHub](https://github.com/ParleSec/ProtocolSoup)
- **Flows:** OAuth code, code + PKCE, client credentials, implicit, device, refresh, introspection, revocation; also OIDC, SAML, SCIM, SPIFFE, SSF, OID4VCI, OID4VP. No PAR, DCR or CIMD in the OAuth list — [OAuth reference](https://protocolsoup.com/protocol/oauth2)
- **Modes:** none, although the homepage search offers audience prompts such as "I'm building a mobile app" and "Just exploring" — [home](https://protocolsoup.com/)
- **Signup:** none seen. **Maintenance:** very active, last commit 2026-10-29, v4.1.1 on 2026-08-22 — [GitHub](https://github.com/ParleSec/ProtocolSoup)

**MCPJam Inspector OAuth Debugger** (`https://docs.mcpjam.com/inspector/guided-oauth`) — Debugger, MCP servers only. [Repo + Page; UI not run]
- **Operator:** independent project/company, 2,296 stars, pushed 2026-10-30 — [GitHub](https://github.com/MCPJam/inspector)
- **Options:** protocol version (03-26, 06-18, 11-25, 2026-07-28) and registration method (pre-registered, DCR, CIMD) — [docs](https://docs.mcpjam.com/inspector/guided-oauth)
- **Diagram:** a sequence diagram synchronised with progress. The source builds the diagram's actions from `protocolVersion`, `registrationStrategy` and `flowState`, so the diagram does depend on the options. A July 2026 commit made it advance one step per Continue click — [source](https://github.com/MCPJam/inspector/blob/main/mcpjam-inspector/client/src/components/oauth/OAuthSequenceDiagram.tsx)
- **Depth:** a Guide view (explains the step, gives hints on failure) and a Raw view (full network requests) — [MCPJam blog](https://www.mcpjam.com/blog/oauth-debugger)
- **Limits:** you must connect a real MCP server, so it is not a general OAuth explainer. It installs through `npx`; a hosted app exists at app.mcpjam.com but only showed "Loading" when I opened it — [MCPJam blog](https://www.mcpjam.com/blog/oauth-debugger)

**Authlete OAuth Playground** (`https://authlete-playground.vercel.app`) — Debugger. [Operated to the first screen + Repo]
- **Operator:** vendor, Authlete. Apache-2.0, 0 stars, created 2026-06-05, last commit 2026-10-21 — [GitHub](https://github.com/authlete/oauth-playground)
- **Options:** the widest modern surface I found: PKCE, PAR, JAR, RAR, CIMD (hosts its own metadata document), DCR, OpenID Federation, DPoP, private_key_jwt, RFC 9207, RFC 9728, Grant Management, CIBA, Device — [GitHub](https://github.com/authlete/oauth-playground)
- **Toggle behaviour:** a live preview of the exact wire request "updates as you toggle options" — [GitHub](https://github.com/authlete/oauth-playground)
- **Diagram:** none. The layout is a left step rail, a centre panel and a network log; the README mentions no diagram — [app](https://authlete-playground.vercel.app)
- **Depth:** essentials open, advanced sections collapsed. That is progressive disclosure inside a form rather than a mode — [GitHub](https://github.com/authlete/oauth-playground)
- **Limits:** a pure browser SPA, so the AS must allow CORS. Google, Auth0 and Okta generally fail at the token endpoint. Authlete's demo servers work with no setup — [GitHub](https://github.com/authlete/oauth-playground)

**OAuth Tools** (`https://oauth.tools/`) — Debugger with a preloaded demo environment. [Operated]
- **Operator:** vendor, Curity. Described as free and vendor-agnostic — [Nordic APIs, 2019](https://nordicapis.com/exploring-oauth-tools-the-worlds-first-oauth-playground)
- **Options:** the Code Flow has "Use PKCE", "JWT Secured Authorization Request (JAR)" and "Pushed Authorization Request (PAR)". Turning on PKCE added `code_challenge` to the displayed Start URL — [oauth.tools](https://oauth.tools/)
- **Flows seen:** Decode/Create JWT, Introspection, Refresh, Revoke, Code, Implicit, Hybrid, Device, CIBA, Client Credentials, Token Exchange, ROPC, Userinfo, Logout, plus VCI flows. The new-flow dialog extends below what I could read — [oauth.tools](https://oauth.tools/)
- **Diagram:** no sequence diagram in the working panel, which is a numbered vertical form. A "Show guide" panel loads a static SVG (`code-flow.svg`, no animation elements) whose content I could not view — [oauth.tools](https://oauth.tools/)
- **Signup:** none. The "Curity Playground" workspace comes with demo clients. A desktop app also exists — [oauth.tools](https://oauth.tools/)
- **Maintenance:** the newest dated evidence I found for the tool is v3.5 on 2024-03-20 (RAR, VCI, JWT creation) — [Curity](https://curity.io/news/oauth-tools-new-version/). The site itself is live and handles SD-JWT.

#### B. Other explainers and simulators

- **oauthflows** (`https://oauthflows.com/`) — Explainer, plus a bring-your-own-app playground. [Operated]
  - **Operator:** independent, Sohail Pathan. MIT, 0 stars, last commit 2026-04-28 — [GitHub](https://github.com/aiauthz/auth-illustration)
  - **Format:** actor boxes on a canvas with Previous / Next Step / Reset and a narration bar. It is not a lifeline diagram. Also an HTTP log drawer and a scripted fake login dialog — [PKCE flow](https://oauthflows.com/flows/pkce)
  - **Depth:** per-step "What / Why / Risk" buttons, some disabled on some steps. I could not read the Why/Risk content reliably — [PKCE flow](https://oauthflows.com/flows/pkce)
  - **Flows:** basic OIDC, PKCE, refresh, client credentials, app-to-app, device, implicit, password, API key delegation, agent as OAuth client, cross-app access — [home](https://oauthflows.com/)
  - **Toggles:** none. **Signup:** none for the flows.
- **AllTools OAuth 2.0 Flow Simulator** (`https://alltools.dev/tools/tech/oauth2-flow-simulator/`) — Explainer. [Operated]
  - **Operator:** generic utility site, "Updated June 2026".
  - **Format:** SVG lanes with Play, Previous/Next, Speed, "Step 1/7" and keyboard control. Editing client_id, redirect_uri or scope updates generated URLs live, and the PKCE verifier can be regenerated.
  - **Flows:** only Code + PKCE, Client Credentials and Device. Switching flow is the only way the diagram changes — [AllTools](https://alltools.dev/tools/tech/oauth2-flow-simulator/)
  - **Signup:** optional sign-in, not needed to use it.
- **The Infinity OAuth Simulator** (`https://www.theinfinity.dev/simulators/oauth`) — Explainer. [Operated partly]
  - **Controls confirmed:** four flow buttons, Play, Reset, Slow/Normal/Fast, and a clickable 10-step timeline. No other options.
  - **Not confirmed:** a large ad overlay hid the stage, so I did not see the animation itself. Page text describes an animated sequence between four actors — [The Infinity](https://www.theinfinity.dev/simulators/oauth)
  - **Dates:** copyright 2026 only.
- **DevToolbox OAuth 2.0 Flow Visualizer** (`https://www.dev-toolbox.tech/tools/oauth2-flow-visualizer`) — Explainer. [Operated partly]
  - **Format:** a real SVG sequence diagram and a flow selector. Clicking a step expands HTTP details. It has a parameter-reference toggle and a Generate PKCE button; no animation or stepping is described.
  - **Flows:** code, code + PKCE, client credentials, device, implicit, password — [DevToolbox](https://www.dev-toolbox.tech/tools/oauth2-flow-visualizer)
  - **Dates:** copyright 2026 only.
- **AuthPlay.io** (`https://authplay.io/`) — Sandbox/explainer. [Operated partly]
  - **Operator:** vendor, Scalekit ("crafted by scalekit"). Show HN 2025-01-07, 3 points — [HN](https://news.ycombinator.com/item?id=42618161)
  - **Format:** an 8-step locked wizard against a mock IdP, with a small 4-arrow static SVG diagram beside it and a log panel — [PKCE playground](https://authplay.io/pg/playground/auth-code-pkce-grant)
  - **Claims not verified:** the landing page also advertises a provider hub, a token decoder and "Gamified Learning" mini-games — [home](https://authplay.io/)
  - **Toggles:** none seen. **Dates:** copyright 2026 only.
- **Zero Snippet OAuth 2.0 flow visualizer** (`https://zerosnippet.com/api-toolbox/oauth2-flow-visualizer`) — Teaching and URL-building aid. [Page]
  - Has a PKCE toggle and a 4-phase overview but no sequence diagram or animation. Covers authorization code only — [Zero Snippet](https://zerosnippet.com/api-toolbox/oauth2-flow-visualizer)
- **OAuth Flow Lab** (`https://oauth-simulator.vercel.app/`) — Explainer in Korean. [Page]
  - Three flows, nine-step Previous/Next, no toggles — [OAuth Flow Lab](https://oauth-simulator.vercel.app/). 1 star, last push 2026-03-19 — [GitHub](https://github.com/seungjoonH/oauth_simulator)
- **Token Journey** — Explainer driven by JSON traces. [Repo; not run]
  - Animated sequence diagram with "Narrative" and "Technical" views. Python/JS recorders can capture a real sign-in, including from Keycloak. No hosted demo, 0 stars, 2 commits, created 2026-10-14 — [GitHub](https://github.com/joevanhorn/token-journey)
- **OAuth & OIDC Learning Studio (thenom)** — Explainer, local only. [Repo; not run]
  - Animated packets in swimlanes, provider presets, a flow decision wizard and an attack sandbox. No hosted URL, 0 stars, 5 commits, created 2026-09-13 — [GitHub](https://github.com/thenom/oauth-explainer)
- **oauth-explorer (ryanrdetzel)** — single-page crash course with animated flows, PKCE generator, JWT decoder and quiz. [Repo blurb only] No hosted URL found, 0 stars, pushed 2026-05-28 — [GitHub](https://github.com/ryanrdetzel/oauth-explorer)
- **oauth-flow-visualizer (gmowses)** — diagrams for five flows. [Repo blurb only] 0 stars, pushed 2026-05-01 — [GitHub](https://github.com/gmowses/oauth-flow-visualizer)
- **AAuth Explorer** — interactive knowledge graph for the AAuth protocol with group filters and a step counter. It does not cover OAuth flows but is relevant as a format reference. [Page] — [site](https://mcp-shark.github.io/aauth-explorer/); Show HN 2026-04-23, 3 points — [HN](https://news.ycombinator.com/item?id=47877287)

#### C. Debuggers (bring a real client or AS)

- **OAuth Debugger** (`https://oauthdebugger.com/`) and **OIDC Debugger** (`https://oidcdebugger.com/`) [Page]
  - **Operator:** independent, Nate Barbettini. Copyright "2018-2026".
  - **What they do:** build a request form (response type, response mode, PKCE) and show the response. No diagrams, no signup — [OAuth Debugger](https://oauthdebugger.com/); [OIDC Debugger](https://oidcdebugger.com/)
  - **Maintenance:** 250 stars; latest commits on the default branch are from 2025-03-21 ("Update help links"). Stable but quiet — [GitHub](https://github.com/nbarbettini/oidc-debugger)
- **Google OAuth 2.0 Playground** (`https://developers.google.com/oauthplayground/`) [Page]
  - Three steps (scopes, code exchange, API request) with server-side/client-side flow, custom endpoints and own credentials. No diagrams. Text still refers to "OAuth 2.0 draft 10" — [Google](https://developers.google.com/oauthplayground/)
  - On HN since at least 2012 — [HN](https://news.ycombinator.com/item?id=4084467)
- **OAuth 2.0 Playground** (`https://oauthplayground.io/`) [Page]
  - **Operator:** independent, Michael Mineev — [About](https://oauthplayground.io/about/)
  - **Options:** PKCE none/plain/S256, PAR, DPoP, private_key_jwt, JWE decryption. Flows: code, implicit, client credentials, device. Outputs copyable curl for each step. No sequence diagram. Sign-in is optional — [oauthplayground.io](https://oauthplayground.io/)
  - **Keycloak:** the site says it was validated against Keycloak, among others. No date evidence — [About](https://oauthplayground.io/about/)
- **Flow Simulator** (`https://flowsimulator.pragmaticwebsecurity.com`) [Operated to landing page + Page]
  - **Operator:** independent, Philippe De Ryck. Announced 2020-07-07. Steps through a flow with inspectable requests and cURL copy, with PKCE among the configurable options — [article](https://pragmaticwebsecurity.com/articles/oauthoidc/oauth-flow-simulator.html)
  - **Maintenance:** changelog reaches v0.3.2 with no dates; explicitly tested with Auth0. Looks like low activity — [Flow Simulator](https://flowsimulator.pragmaticwebsecurity.com)
- **Auth0 OpenID Connect Playground** (`https://www.openidconnect.net/`) [Page]
  - Vendor. Three steps with short explanations. No diagrams, no signup required on the page — [openidconnect.net](https://www.openidconnect.net/)
  - 16 stars, pushed 2026-10-26 — [GitHub](https://github.com/auth0/openidconnect-playground)
- **ZITADEL OIDC Playground** (`https://zitadel.com/oidc-playground`) [Page] — Vendor. Builds auth requests for a ZITADEL instance, no diagrams — [ZITADEL](https://zitadel.com/oidc-playground)
- **SSOJet OIDC Playground** (`https://ssojet.com/oidc-playground/`) [Page] — Vendor. Free URL builder with provider presets, no diagrams — [SSOJet](https://ssojet.com/oidc-playground/)
- **Auth Playground (yaal-coop)** (`https://demo.client.yaal.coop/en/`) [Page] — Open-source demo client, no diagrams — [site](https://demo.client.yaal.coop/en/); [GitHub](https://github.com/yaal-coop/auth-playground)
- **OIDC Tester (Compile7)** (`https://oidc-tester.compile7.org/`) [Page] — A mock OIDC provider for testing your app, with no signup and static flow images — [site](https://oidc-tester.compile7.org/). Show HN 2025-03-28, 3 points — [HN](https://news.ycombinator.com/item?id=43504040)
- **Authduck** [Repo; hosted app not opened] — OIDC server playground for testing clients. 5 stars, last push 2024-10-13, so it looks dormant — [GitHub](https://github.com/azophy/authduck); [HN](https://news.ycombinator.com/item?id=42337413)
- **openid-playground (ay4toh5i)** [Repo; not run] — Guided wizard with a timeline for code + PKCE, client credentials and refresh. No hosted URL, 0 stars, pushed 2026-03-29 — [GitHub](https://github.com/ay4toh5i/openid-playground)
- **Official MCP Inspector** [Snippet] — "Guided OAuth Flow" with step-by-step Continue. I found no evidence of a sequence diagram — [third-party tutorial](https://docs.prefactor.tech/mcp-demo/03-connecting-clients); [docs](https://modelcontextprotocol.io/docs/tools/inspector/authorization). 11,196 stars, pushed 2026-10-29 — [GitHub](https://github.com/modelcontextprotocol/inspector)

#### D. Named vendors and products from the brief

- **Okta / oauth.com Playground** (`https://www.oauth.com/playground/`) [Page]
  - Walks through code, PKCE, implicit, device and OIDC against a simulated AS. You first register a throwaway client and user, so it needs a lightweight in-tool setup rather than a real signup. No diagrams; no date on the page — [oauth.com](https://www.oauth.com/playground/); [code flow page](https://www.oauth.com/playground/authorization-code.html)
- **jwt.io** (`https://www.jwt.io/`) [Page] — Token decoding, verifying and encoding only, with no flow visualisation. Presented by Auth0, copyright 2026 Okta — [jwt.io](https://www.jwt.io/)
- **Auth0 Academy and labs** [Snippet] — Labs run in GitHub Codespaces; the resources page lists an OIDC Playground and a Passkeys Playground. I found no interactive flow explorer under the Academy name — [Auth0 resources](https://developer.auth0.com/resources); [lab repo](https://github.com/auth0-training/labs-node-working-with-tenants)
- **Microsoft identity platform** [Page] — The authorization code page has a single static SVG diagram and no interactive component. Metadata shows `ms.date` 2026-01-09 and `updated_at` 2026-06-15. Only this one page was checked — [Microsoft Learn](https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-auth-code-flow)
- **Keycloak** — I found no official or community flow visualiser.
  - **Keycloak test app** [Page]: sign-in test against your own URL, realm and client, with no diagrams — [keycloak.org/app](https://www.keycloak.org/app/)
  - **FAPI playground** [Repo]: an official demo with toggles for nonce, PKCE, request objects and DPoP, but it needs a local Keycloak, Quarkus and hosts-file setup, and has no diagrams — [GitHub](https://github.com/keycloak/keycloak-playground/tree/main/fapi-playground)
  - **KeycloakKit** [Snippet]: a promoted hosted realm with a JWT viewer. keycloakkit.com failed to connect when I tried on 2026-10-30, so it may be dead — [creator's post](https://dev.to/iamarshrx/oauth-is-hard-so-i-built-a-playground-that-isnt-5m0)
- **Authlete** — see section A. **Scalekit** — see AuthPlay.io in section B.
- **Ory** [Snippet] — No hosted playground found. The closest is Hydra's CLI command `perform authorization-code`, which runs an example client locally — [Hydra source](https://codeclimate.com/github/ory-am/hydra/cmd/cmd_perform_authorization_code.go/source)
- **Duende demo server** (`https://demo.duendesoftware.com/`) [Page] — A live AS with many preconfigured clients (PKCE, DPoP, JAR, device) and a conformance report, at v8.0.10. A target to test against, with no flow visuals — [Duende demo](https://demo.duendesoftware.com/). Pushed 2026-10-26 — [GitHub](https://github.com/DuendeSoftware/demo.duendesoftware.com)
- **Postman** [Snippet: docs in search results] — The Authorization tab supports OAuth 2.0 grant types with PKCE fields and "Get New Access Token". It is an API client helper, and I found no flow visualisation — [Postman docs](https://learning.postman.com/docs/use/send-requests/authorization/oauth-20)
- **Stytch, WorkOS, Descope** [Snippet] — Site-restricted searches returned articles and blog diagrams but no interactive OAuth tool — [Descope PKCE article](https://www.descope.com/learn/post/pkce); [WorkOS article](https://workos.com/blog/oauth-on-behalf-of-ai-agents). Absence is not proven.
- **PingFederate OAuth Playground** [Snippet] — A legacy downloadable package, separate from AuthPlayground — [Ping docs](https://docs.pingidentity.com/r/en-us/pingfederate-110/pf_oauth_endpoints)

#### E. Dead, stub or abandoned

- **K-Lab OAuth visualizer** — A search result described an animated step-by-step flow, but `k-lab.dev/protocols/oauth` returns 404 by fetch, curl and browser. The site's home page lists no visualizer — [K-Lab](https://k-lab.dev/)
- **Constellation Tools "OAuth 2.0 Flow Visualizer"** — The page lists features, but when loaded in a browser it rendered only a description, with no inputs and no diagram. Treat it as a stub — [Constellation Tools](https://tools.selby.one/tools/oauth-flow-visualizer)
- **tmkasun/oauth-playground** — last push 2016-10-23 — [GitHub](https://github.com/tmkasun/oauth-playground)
- **MasterFlow (curtismu7/oauthPlayground)** — PingOne-focused despite its repo name. Its listed Vercel homepage returned 404 — [GitHub](https://github.com/curtismu7/oauthPlayground)
- **Long tail** — GitHub searches for "oauth simulator" and "oauth playground" return many 0-3 star repositories from 2024-2026, mostly personal learning projects — [GitHub search](https://github.com/search?q=oauth+playground&type=repositories)

#### Launch traction on Hacker News
- Launches I found drew little attention: AuthPlay 3 points, ProtocolSoup 4, OIDC Tester 3, Authduck 6, AAuth Explorer 3 — [AuthPlay](https://news.ycombinator.com/item?id=42618161); [ProtocolSoup](https://news.ycombinator.com/item?id=46615649); [OIDC Tester](https://news.ycombinator.com/item?id=43504040); [Authduck](https://news.ycombinator.com/item?id=42337413); [AAuth](https://news.ycombinator.com/item?id=47877287)
- The strongest result was a non-Show-HN "OAuth Playground" post from 2014 with 66 points — [HN](https://news.ycombinator.com/item?id=8580567)

### Inferences
- The field split into two camps that rarely overlap. Debuggers have the toggles but no diagrams; explainers have the diagrams but no toggles.
- Low star counts and low HN scores mean popularity gives little signal here. Most tools have no public usage data, so "exists" does not mean "widely known".
- The burst of near-identical 0-star simulators in 2026 suggests a basic animated flow is now cheap to build. A plain flow animator is unlikely to stand out.

### Gaps
- Reddit could not be checked. The search tool refuses reddit.com, so r/oauth, r/webdev, r/programming and r/KeyCloak launches may be missing.
- No tool publishes usage numbers, so reach could not be compared.
- Auth0 Academy course content was not opened.
- Other Microsoft pages and the Postman app itself were not checked.

## Does any tool animate or step through a sequence diagram while letting the user switch options and see the diagram change?

### Takeaway
Not for general OAuth. The only diagram I found that depends on selected options is MCPJam's, which is MCP-only, needs a real server, and offers version and registration choices rather than PKCE, PAR or DPoP. No tool lets you compose options such as PKCE + PAR + DPoP and watch one diagram change.

### Cited Findings
- **MCPJam:** the sequence diagram is built from the chosen protocol version and registration strategy (CIMD, DCR, pre-registered). Confirmed from source, not from running the UI — [source](https://github.com/MCPJam/inspector/blob/main/mcpjam-inspector/client/src/components/oauth/OAuthSequenceDiagram.tsx)
- **ProtocolSoup:** options change what really happens (Bearer 12 events, DPoP 27 events), but the result is a vertical timeline. The lifeline diagram on the reference page has no options — [Looking Glass](https://protocolsoup.com/looking-glass); [PKCE reference](https://protocolsoup.com/protocol/oauth2/flow/authorization-code-pkce)
- **oauth.tools and Authlete:** toggles change the request (PKCE, PAR, JAR; Authlete also DPoP, RAR, CIMD), but there is no sequence diagram to change — [oauth.tools](https://oauth.tools/); [Authlete](https://github.com/authlete/oauth-playground)
- **IdentiFlows:** step-through of a lifeline diagram, but no options. PKCE and non-PKCE are separate pages — [IdentiFlows](https://identiflows.dev/diagrams/oauth-authorization-code-pkce/)
- **Ping AuthPlayground:** each extension is its own page with a static diagram. PAR and DPoP cannot be combined by the user. The closest thing to combination is the fixed "Full XAA Use Case" — [home](https://www.authplayground.dev/)
- **AllTools, The Infinity, DevToolbox:** the diagram changes only by selecting a different pre-drawn flow — [AllTools](https://alltools.dev/tools/tech/oauth2-flow-simulator/); [The Infinity](https://www.theinfinity.dev/simulators/oauth); [DevToolbox](https://www.dev-toolbox.tech/tools/oauth2-flow-visualizer)
- **Zero Snippet:** has a PKCE toggle but no sequence diagram — [Zero Snippet](https://zerosnippet.com/api-toolbox/oauth2-flow-visualizer)

### Inferences
- A diagram driven by composable protocol options appears to be the unoccupied idea. MCPJam proves the technique works (a function from options to diagram steps) but only applies it to MCP registration.
- The hard part is likely content rather than rendering. Someone must model how each option adds, removes or alters messages, and how options interact.

### Gaps
- I did not run MCPJam's UI, so the visual effect of switching options is unconfirmed.
- I checked ProtocolSoup's option panels only on Client Credentials and Authorization Code. Other flows may expose more.
- Tools I checked only at [Repo] level (Token Journey, thenom, ryanrdetzel, gmowses) could have option behaviour their READMEs do not describe. The thenom README describes PKCE as part of a flow and its sandbox, not as a toggle — [GitHub](https://github.com/thenom/oauth-explainer)

## Does any tool offer distinct beginner and expert levels of depth?

### Takeaway
No tool I checked has a true simple/advanced mode that changes the depth of the same flow. Several have partial substitutes, and the nearest match in concept is Token Journey's Narrative/Technical switch, in a 2-commit project with no hosted version.

### Cited Findings
- **Token Journey:** "Narrative" and "Technical" views of the same trace. README only, not run — [GitHub](https://github.com/joevanhorn/token-journey)
- **MCPJam:** Guide view and Raw view, for debugging rather than teaching beginners — [MCPJam blog](https://www.mcpjam.com/blog/oauth-debugger)
- **oauthflows:** per-step What / Why / Risk lenses. These add angles to a step rather than changing the level of detail — [PKCE flow](https://oauthflows.com/flows/pkce)
- **Authlete:** essential sections open, advanced ones collapsed. That is form disclosure, not a learning mode — [GitHub](https://github.com/authlete/oauth-playground)
- **ProtocolSoup:** separates a reference from the live Looking Glass, and offers prompts such as "Just exploring", but no levels — [home](https://protocolsoup.com/)
- **IdentiFlows:** Static vs Interactive changes how you move through a diagram, not its depth. The launch post mentions no levels — [Auth0 blog](https://auth0.com/blog/introducing-identiflows-a-visual-reference-for-identity-flows)
- **Ping AuthPlayground:** the docs name a mixed audience (architects, engineers learning, people debugging) and mention no modes — [Ping docs](https://developer.pingidentity.com/identity-for-ai/protocols/authplayground.html)

### Inferences
- Tools currently pick one audience. Plain-language explainers (oauthflows, The Infinity) stop at basic flows, while modern-spec tools (Ping, Authlete) assume you already know OAuth. A single flow that scales between the two looks open.

### Gaps
- I could not reliably read the What/Why/Risk content on oauthflows, so how much depth it adds is uncertain.
- AuthPlay's advertised mini-games were not found or tested.

## Which tool is closest to the requester's concept, and precisely what does it lack?

### Takeaway
No single tool matches. On format, IdentiFlows (Auth0) is closest, and it lacks toggles, depth levels and CIMD/DCR/PAR. On topic, Ping's AuthPlayground is closest because it covers CIMD and PAR with sequence diagrams, and it lacks a reactive diagram, toggles, depth levels and DCR. The biggest competitive risk is IdentiFlows, because it is weeks old, shipping quickly, and already has the right core format.

### Cited Findings

Comparison against the concept. All cells come from the sources in section A and B above; "not listed" means I did not find it, not that it is proven absent.

| Tool | Lifeline diagram | Step-through | Concept toggles | Diagram reacts to toggles | Depth levels | CIMD | DCR | No-setup use |
|---|---|---|---|---|---|---|---|---|
| [IdentiFlows](https://identiflows.dev/) | Yes | Yes, Prev/Next | No | No | No | Not listed | Not listed | Yes |
| [Ping AuthPlayground](https://www.authplayground.dev/) | Yes, static Mermaid | Execute per step, diagram does not track | No | No | No | Yes | Not listed | Yes |
| [ProtocolSoup](https://protocolsoup.com/) | Reference pages only | Run produces a timeline | Some flows | Timeline only | No | Not listed | Not listed | Yes |
| [MCPJam](https://docs.mcpjam.com/inspector/guided-oauth) | Yes | Yes, Continue | Version and registration | Yes, per source | Guide/Raw | Yes | Yes | No, needs an MCP server |
| [Authlete Playground](https://github.com/authlete/oauth-playground) | No | Step rail | Many | No diagram | Collapsed sections | Yes | Yes | With Authlete demo AS |
| [oauth.tools](https://oauth.tools/) | No | Numbered form | PKCE, JAR, PAR | No diagram | No | Not listed | Not listed | Yes |
| [AllTools](https://alltools.dev/tools/tech/oauth2-flow-simulator/) | Yes | Yes, with auto-play | No, flow switch only | Flow switch only | No | No | No | Yes |
| [oauthflows](https://oauthflows.com/) | No, actor canvas | Yes | No | No | What/Why/Risk | No | No | Yes |

What IdentiFlows lacks, precisely:
- Option toggles: variants are separate pages — [IdentiFlows](https://identiflows.dev/diagrams/oauth-authorization-code-pkce/)
- CIMD, DCR and PAR diagrams: none in the 13-diagram sitemap — [sitemap](https://identiflows.dev/sitemap.xml)
- Simple/advanced depth: none described — [Auth0 blog](https://auth0.com/blog/introducing-identiflows-a-visual-reference-for-identity-flows)
- Vendor neutrality and open source: it is Auth0-branded, and no repo is linked — [IdentiFlows](https://identiflows.dev/)

What Ping AuthPlayground lacks, precisely:
- A diagram linked to progress: the SVG did not change when I executed step 2 — [CIMD flow](https://www.authplayground.dev/flows/cimd/)
- Any user options: 0 inputs on the page checked — [DPoP flow](https://www.authplayground.dev/flows/dpop/)
- Foundational flows and DCR: its focus is OAuth extensions — [home](https://www.authplayground.dev/)
- Depth modes and a real AS: the backend is a simulation — [About](https://www.authplayground.dev/about/)

Keycloak angle: no tool I found maps flows onto Keycloak realm or client settings. Keycloak's own offerings are a sign-in tester and a developer demo — [keycloak.org/app](https://www.keycloak.org/app/); [FAPI playground](https://github.com/keycloak/keycloak-playground/tree/main/fapi-playground)

### Inferences
- The concept is not already built, but its parts are all live. The defensible difference would be the combination: one lifeline diagram that reacts to composable toggles, with a depth switch, in a vendor-neutral site.
- The window may be short. Auth0 and Ping both shipped in the last ten weeks, Auth0 is openly asking for feedback, and adding toggles to IdentiFlows seems a natural step. This is my judgement; I found no roadmap item saying so.
- A cheaper path than a full site may be worth weighing, such as contributing to or building on an existing open-source option (ProtocolSoup is Apache-2.0). I did not assess its code for that use.
- Keycloak-specific annotation ("this toggle is this realm setting") is a plausible differentiator that fits the requester's expertise and that vendor sites have no reason to offer.

### Gaps
- No public roadmap was found for IdentiFlows beyond the launch post, or for Ping's AuthPlayground.
- ProtocolSoup's and MCPJam's teaching quality was not evaluated with learners, and no tool publishes learning outcomes.
- Mobile usability and accessibility were not compared.
