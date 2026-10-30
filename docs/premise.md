# Premise

Starting point as of 2026-10-30. Nothing is built yet. The next step is working out the structure of the site (section 11).

Labels used throughout:

- **Decided:** the maintainer said this. Change it only with the maintainer's agreement.
- **Proposed:** a recommendation from the review with Claude. The maintainer asked for these nuances to be recorded but has not ruled on each one, so challenge them if the work shows they are wrong.
- **Open:** not decided.

The maintainer's own words are in [original-brief.md](original-brief.md). The evidence is in [research/](research/README.md).

## 1. The problem

The maintainer has become the local expert on Keycloak, OAuth, authn and authz in their team. They keep building presentations and struggle to explain the concepts at different levels. These concepts are hard to grasp from text, and sequence diagrams work much better.

So the first user is the maintainer, and the first audience is their team. A public audience comes second.

## 2. The idea

**Decided.** A website that explains OAuth and OIDC visually, and later wider authn/authz. It starts from the most basic concepts, such as what an identity provider and an issuer are, and one basic flow. Everything more advanced is added by switching it on in the same diagram, not by opening a separate page. It starts small and grows with more functionality over time.

In the maintainer's framing, it combines three things that no one site has together:

| Quality | Reference |
|---|---|
| Visually striking step-through | IdentiFlows |
| Advanced level, including executing a step | AuthPlayground |
| Basic explanation of the concepts themselves | Okta's illustrated guide |

The spirit is that of the visual guides to transformers, but authn/authz is a much more varied topic, which is why it suits an interactive site over a single article.

## 3. What to take from existing work

| Source | Take | Leave |
|---|---|---|
| [IdentiFlows](https://identiflows.dev/) (Auth0) | Step-through where each step shows only what is relevant at that point, in detail. **The maintainer's favourite quality.** | A separate page per variant. In depth from the first step. Auth0 branding. |
| [AuthPlayground](https://www.authplayground.dev/) (Ping) | `Execute` on each step, a fake execution with raw request and response. Advanced topics. | A static diagram that does not follow execution. No user options. |
| [Okta's illustrated guide](https://developer.okta.com/blog/2019/10/21/illustrated-guide-to-oauth-and-oidc) | Basic concepts in plain language for newcomers. | Static, one depth, mostly one flow. |
| [The Illustrated Transformer](https://jalammar.github.io/illustrated-transformer/) | Clarity sets the bar more than interactivity does. It drew 500 Hacker News points seven years after publication with no built-in interactivity. | |
| [ProtocolSoup](https://protocolsoup.com/) | Evidence of how much a toggle can teach: on Client Credentials, Bearer gave 12 events and DPoP gave 27, including the nonce retry. | Options change a timeline, not the lifeline diagram. |
| [MCPJam](https://docs.mcpjam.com/inspector/guided-oauth) | Proof that a function from options to diagram steps works. Its diagram depends on protocol version and registration method. | MCP only, and needs a live server. |
| [Authlete Playground](https://github.com/authlete/oauth-playground) | The widest option surface, with a live preview of the wire request. | No sequence diagram. |
| [Illustrated TLS](https://tls13.xargs.org/) | Every byte reproduces from a working client, server and captures in the repo. | It drifted from practice: still X25519 only. |

## 4. The gaps being aimed at

The maintainer's assessment, with how well each one is supported. "Not found" means not found in limited searching and is not proof of absence.

1. **Step-through tools skip the basics.** They are in depth immediately. Well supported: the research found no step-through tool with a concept layer, and the most reported confusion is conceptual (OAuth vs OIDC, token types, why the steps exist).
2. **Nobody shows setup from the application's point of view.** Existing tools explain how the flow works from the end user's perspective, but part of OAuth is getting the handshake between the application and the IdP in place. Plausible but lightly checked: the original research did not look at this, and one follow-up search found only glossaries and vendor docs. Stack Overflow supports it: Keycloak's invalid `redirect_uri` (505k views), endpoints (375k) and client secrets (230k) are all setup questions.
3. **External IdPs are not covered.** Plausible but lightly checked: not in IdentiFlows' 13 flows, and searching found [Authlete's tutorial](https://www.authlete.com/developers/tutorial/idp) and one static figure in Keycloak's guide, nothing interactive.
4. **Parts that could be toggles are presented as separate concepts.** Well supported: no general OAuth tool found changes one diagram as you flip options. AuthPlayground does chain PAR, RAR, PKCE, DPoP and token exchange in one fixed flow, but the reader cannot compose it.
5. **Nothing maps protocol to Keycloak.** Well supported: no tool found maps a protocol option to the realm or client setting that controls it.

**"Not present anywhere" is still a bet.** What is unoccupied is the combination, not each part. IdentiFlows is adding flows and could add toggles, which would close gap 4 with one product decision.

## 5. Core design ideas

### 5.1 Start from OAuth and OIDC

**Decided.** The earlier research report recommended starting with the registration flow and sending people to IdentiFlows for the basics. **That recommendation is superseded**, for three reasons: toggles need a base flow to change, the original problem is explaining at different levels, and the basics are the reported confusion.

The caveat is that the basic code flow is also the most saturated area, and a wave of near-identical simulators in 2026 suggests a plain animated flow is now cheap. The first version must therefore already show what is different: the concept layer, the setup phase and at least one working toggle.

### 5.2 One diagram, many toggles

**Decided.** Others treat toggleable parts as separate concepts. Here they are a set of toggles on one diagram, so a reader can see that DPoP is a change to the flow they already understand, not a new flow.

**Proposed: the transition is the centrepiece.** Stable step IDs let a toggle animate as a change, with an arrow sliding in and rows shifting, instead of a redraw. No precedent found does this for general OAuth, and it is the moment the idea either lands or does not.

### 5.3 Setup is a phase of the same diagram

**Decided:** the application's view of setup is in scope. **Proposed:** it belongs at the top of the same diagram, as what happens before any user arrives, not in a separate section.

The handshake runs in both directions:

| Side | What it must learn |
|---|---|
| The IdP learns about the app | Client ID, client type, redirect URIs, allowed scopes |
| The app learns about the IdP | Issuer URL, endpoints via discovery, signing keys via JWKS |

Three things follow:

- **Registration is the setup.** Manual registration, DCR and CIMD are three answers to one question: how does the IdP get to know this app? So the CIMD toggle lives in this phase and fits the story rather than being an advanced extra.
- **Setup and login can be linked visually.** The redirect URI registered in setup is checked during login. Showing that link explains the most-viewed Keycloak error.
- **The setup phase differs from runtime.** Manual setup is mostly people, an application team and an IdP admin copying values between consoles, not HTTP messages. DCR and CIMD turn those human hand-offs into HTTP calls, which could be a striking toggle, but a sequence diagram may need adapting to carry human steps. Work this out during design.

### 5.4 Limited context per step

**Decided as the quality to keep.** Each step shows only what is relevant at that point, in detail. This is what the maintainer liked about IdentiFlows.

### 5.5 Depth

**Decided:** there should be a basic level and an advanced level. **Proposed:** make it expandable per step, not a page-wide mode.

- None of the benchmarks opened has a global simple/advanced mode. They use ordering, expansion in place and companion pages.
- A meta-analysis of 60 experiments found novices gain from high assistance (d = 0.505) and experts from low (d = −0.428), with help for novices the stronger effect. That argues for defaulting to the simple view.
- Learner control showed almost no effect (g = 0.05, 18 studies). No study found tested a self-selected toggle on an explanatory page, so this is reasoning from adjacent evidence.

A possible ladder over one diagram: concept (plain language, no parameters), protocol (parameters and why), wire (raw HTTP and `Execute`). An "Open all" option serves people who want everything at once.

Keep **scenario toggles** (PKCE on or off) separate from **depth controls** (how much detail). They do different jobs and should not share a control.

### 5.6 Execute

**Decided as desirable:** the maintainer liked AuthPlayground's fake execution.

**Proposed:** make it replay traffic recorded from a real Keycloak. That gives the same feel with real payloads and no backend to host, secure or have abused. Re-recording on each Keycloak release also catches drift. Illustrated TLS is the precedent for reproducibility, and it uses real captures.

### 5.7 Keycloak as the reference

**Decided:** tracing what Keycloak can do is the edge, because it is a universal open source product that is not sold like the other IdPs.

**Proposed refinement of the reasoning:**

- "Not sold" is only partly true, as Red Hat sells a supported build. To someone on Entra, a Keycloak-centred site can look as vendor-focused as the sites criticised here.
- Neutrality alone does not differentiate, because ProtocolSoup and oauthflows are already independent and open source.
- The stronger edge is that **anyone can run it**. Every diagram can be reproduced against a real server, and vendors have little reason to build this layer.
- So keep the **protocol layer neutral, with Keycloak as an overlay** on each message: this setting controls this behaviour. Someone on another IdP still gets the protocol explanation.

### 5.8 Grow from a small start

**Decided.** It starts small and builds up. **Proposed:** treat the first flow as the whole product until shown otherwise, since sequels tend to earn less. Illustrated TLS's stars fall from 3,513 to 921, 243 and 26 across later protocols, though those are also more niche.

## 6. Nuances that must not get lost

### Not everything is a toggle (Proposed)

The controls need more than on/off switches:

| Kind | Examples |
|---|---|
| Base-flow picker (different shapes) | Authorization code, device, client credentials |
| On/off modifiers | OIDC, PKCE, PAR, refresh tokens |
| Exclusive choices | Pre-registered, DCR or CIMD. Bearer, DPoP or mTLS. Public or confidential client |
| Constraints | Which combinations are invalid, and why |

Toggles cut across messages. DPoP touches several steps and PAR changes what crosses the front channel, so conditions must sit on each step and field. `alt` frames cannot express this.

### A toggle shows what changed, not why (Proposed)

Turning on PKCE adds parameters, and the learner still does not know what they are for. "Why" is the most reported confusion, so each toggle must show the problem it solves, ideally what goes wrong when it is off. Showing an attacker's path when a protection is off is one way to do this.

### User federation and brokering are different (Proposed, from Keycloak's docs)

- **Identity brokering:** Keycloak acts as an intermediary and redirects the browser to another IdP. The diagram gains a lifeline and a nested flow, and client applications never contact the external provider.
- **User federation** (the docs call it "Using external storage"): Keycloak looks users up in LDAP, AD or a custom store on the server side. The docs mention no redirect.

This contrast makes a good toggle: same app, same token, different middle.

### Most of this is not feature flags (Proposed)

The maintainer named "feature flags of keycloak like cimd and token brokering" as especially interesting. From the current docs:

- Core brokering is not listed as a flag, only `identity-brokering-api` versions and some specific providers.
- `cimd` is a flag, and the specifications page marks it experimental.
- `token-exchange-standard:v2` is supported and on by default, but handles only the internal-to-internal case. `token-exchange:v1` is preview.

So organise the site by protocol concept and show Keycloak's status as a badge. Do not organise it around flags. "Token brokering" also needs clarifying (section 11). Details are in [research/followup-checks.md](research/followup-checks.md).

### Scope has to be bounded (Proposed)

"Whatever Keycloak can do" has no end. A feature gets in only if it teaches a concept or answers a question people actually bring you. Otherwise the site becomes a feature tour.

### Protocols drift (Proposed)

Stamp each flow with its spec version and a last-verified date. Experimental flags will mean rework. The version skew is itself teachable: CIMD is at IETF draft -02 with no last call recorded, MCP still links -00, and MCP's 2026-07-28 revision makes CIMD SHOULD and DCR MAY and deprecated.

### Combinations grow fast (Proposed)

Three independent toggles already give eight variants. Offer named presets as well as free toggles, encode invalid combinations as constraints, and test every valid one. The one detailed teaching success found also fits presets: a trainer offered a menu of recommended options per use case, and why each one solved the problem.

### Slides are a first-class use (Proposed)

This project began with presentations. Encode toggle and step state in the URL so a slide can link to an exact view, and keep a static export (generated Mermaid or SVG) for pasting into decks. People also forget details within months, so being a page you return to may matter more than a one-time walkthrough.

### Felt understanding misleads (Proposed)

In Transformer Explainer's study, video viewers felt they understood as well as others despite lower quiz scores. Consider predict-the-next-message prompts in the simple view.

### Accessibility and fallback (Proposed)

Plan early for step text outside the SVG, reduced motion, keyboard control and a static render for print and search. Wide diagrams on phones are a known risk.

### Competition and demand (Proposed)

- Plan for "what survives if Auth0 adds a toggle": the Keycloak overlay, flows verified against a real server, and version skew shown openly.
- Public demand is unproven. Recent interactive tool launches scored 3 to 19 Hacker News points while article explainers reach hundreds, though launch scores are noisy. An essay with embedded diagrams looks likelier to travel than a launch post, which is an untested inference.
- LLMs are the real competitor for answers. This site must offer what a chat answer cannot: a stable visual frame and content verified against a real server.

### Visual ambition is the main cost (Proposed)

"Visually striking" is where the effort goes. Transformer Explainer took over a year with nine authors, and Distill's editors cited burnout. A rough, unsourced estimate for a solo part-time builder is weeks to a few months for one polished flow, and closer to a year for a multi-flow site.

## 7. Candidate concepts

An order for later releases. **Proposed**, and expected to change.

| Concept | Control | Effect on the diagram |
|---|---|---|
| Actors, issuer, tokens | Concept layer | Introduces the lifelines themselves |
| Client registration, discovery | Setup phase | Steps before any user arrives |
| Authorization code | Base flow | The main flow |
| OIDC | Modifier | Adds the `openid` scope, an ID token and UserInfo |
| PKCE | Modifier | Adds `code_challenge` and `code_verifier` |
| Public or confidential client | Exclusive | Changes setup and the token request |
| Pre-registered, DCR or CIMD | Exclusive | Changes the setup phase. CIMD is the `cimd` flag, experimental |
| External IdP (brokering) | Modifier | Adds a lifeline and a nested flow |
| User federation | Modifier | Adds a server-side lookup, no redirect |
| PAR | Modifier | Adds a back-channel push and changes the front channel |
| Bearer, DPoP or mTLS | Exclusive | Cross-cutting, and DPoP adds a nonce retry |
| Token exchange | Later | `token-exchange-standard:v2`, internal-to-internal only |
| Device, client credentials | Base flow | Different shapes |
| Logout, session management | Later | Interactive coverage looks thin |
| FAPI 2.0, OAuth 2.1 | Later | A composition or a diff over existing toggles |
| Authz (RBAC, ABAC, ReBAC, UMA) | Later | Multiplies the content |

## 8. First slice

**Proposed.**

**Step 0: test the model before any visuals.** The riskiest assumption is that one data model can absorb very different kinds of change. Model three toggles that change the diagram in different ways:

- **OIDC:** adds a scope, a token and an endpoint.
- **DPoP:** touches several steps and adds a retry.
- **Brokering:** adds a lifeline and a nested flow.

If one model handles all three, the toggle idea holds. If brokering breaks it, it is better to know now. A starting sketch is in [notes/format_benchmark.md](research/notes/format_benchmark.md), under the technical approaches section.

**Then the first version:**

1. Concept scene: user, app, IdP and API, and what an issuer is.
2. Setup phase: client registration, redirect URI and discovery.
3. Authorization code flow, stepped through with only what is relevant at each step.
4. One toggle: OAuth to OIDC.

That toggle comes first because it takes on the most reported confusion with a single switch, where IdentiFlows uses separate pages.

## 9. Engineering requirements

**Decided:**

- This is a web application in its own proper repository.
- CI runs an **automated click-through** that validates the site through changes.
- **Storybook** might be beneficial. Not yet decided.

**Proposed: what CI should prove**, because the toggles make this more than a generic end-to-end suite:

| Layer | Checks |
|---|---|
| Flow model | Every valid combination builds, invalid ones are rejected, step IDs stay stable |
| Component states (Storybook or similar) | Each step, field and depth state renders in isolation |
| Click-through (Playwright or similar) | For each named preset: walk every step, flip toggles, assert the visible steps match the model, use keyboard control |
| Visual regression | Screenshots of key states, with animation frozen through reduced motion |
| Keycloak recordings | Regenerate against a pinned Keycloak in CI, and check on a schedule against new releases to detect drift |

**Proposed: stack, as a judgement rather than a finding.** Astro with MDX for prose, one SVG island for the diagram, GSAP or Motion for transitions, and flow definitions as typed data.

- No mature library does step-through plus composable toggles, so expect a small custom renderer. Sequence layout is simple, so this is smaller than it sounds.
- Mermaid has no sequence animation and a large bundle, so use it for static export rather than at runtime. D2 has the closest variant model but only looping playback.
- SeqShow, Cinegram and Token Journey are worth reading for ideas, but are young, small and were not run.
- Stepper first, scroll second, because a sequence diagram needs a stable spatial frame.
- Check Storybook against the chosen framework. As far as known and not verified, it has no first-party Astro support, so it would target the diagram island's framework, or use an alternative such as Ladle or Histoire.

## 10. Not goals, for now

- A debugger for your own server. oauth.tools, OAuth Debugger and others already do this.
- Comparing vendors or IdPs.
- A tour of Keycloak features.
- Authz, beyond keeping the structure open to it.
- Redrawing saturated topics for their own sake, such as JWT decoding and WebAuthn demos.

## 11. Open questions, and the next session's job

**The next session should work out the structure of the site.** The questions it needs to settle or raise:

- **Information architecture:** one living diagram or many pages? How do the concept layer, setup phase and flows relate? What is the URL model, given that deep links matter for slides?
- **Control model:** the schema for base flows, modifiers, exclusive choices, constraints and presets. Run step 0 from section 8.
- **Setup phase:** how to draw human steps in a sequence-style diagram.
- **Recording pipeline:** how to capture Keycloak traffic per combination, and which version to pin.
- **Stack and test tooling:** confirm or replace section 9, including Storybook.

For the maintainer to decide:

- **"Token brokering":** does this mean identity brokering, token exchange, or stored upstream tokens? They differ in Keycloak.
- **Audience and language:** team first in which language? English for the public site?
- **Visibility and licence:** the repo is private for now. Public repos get different GitHub Actions minutes, which matters once CI runs Playwright. No licence is chosen.
- **Name and domain:** `visual-auth-explainer` is a working name only.
- **Process:** whether to adopt the maintainer's [ADR and GitHub issues skills](https://github.com/vriesdemichael/skills-adr-with-gh-issues), which expect `docs/decisions/`.
- **Reuse:** whether [keycloak-gitops](https://github.com/vriesdemichael/keycloak-gitops) or [keycloak-operator](https://github.com/vriesdemichael/keycloak-operator) can provide realm configuration or CI patterns.

## 12. How to know it is working

**Proposed.** The first flow is the test, and the maintainer's next presentation is the deadline.

- If it gets reused across audience levels and colleagues return to it unprompted, add more and publish an essay with the diagram embedded.
- If it stops being opened after the talk, there is still a better slide, and stopping costs little.
- If IdentiFlows ships toggles first, drop the general mechanic as the differentiator and keep the Keycloak layer.
