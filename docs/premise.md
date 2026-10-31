# Premise

Starting point as of 2026-10-31. Step 0 is built as a rough prototype (section 8). The next step is the maintainer's judgement of its transition, then the first version, and settling what is left in section 11. The way there is split into [target states](https://github.com/vriesdemichael/visual-auth-explainer/issues?q=is%3Aissue+label%3A%22target+state%22), each a GitHub issue with acceptance criteria and deliverables.

**This is an interactive web application, not an article.** Read section 2 first, because everything else depends on it.

Labels used throughout:

- **Decided:** the maintainer said this. Change it only with the maintainer's agreement.
- **Proposed:** a recommendation from the review with Claude. The maintainer asked for these nuances to be recorded but has not ruled on each one, so challenge them if the work shows they are wrong.
- **Open:** not decided.

The maintainer's own words are in [original-brief.md](original-brief.md). The evidence is in [research/](research/README.md). This file holds intent. The rules for how it is built and worked on are in the [decision records](adr/index.md).

## 1. The problem

The maintainer has become the local expert on Keycloak, OAuth, authn and authz in their team. They keep building presentations and struggle to explain the concepts at different levels. These concepts are hard to grasp from text, and sequence diagrams work much better.

**Decided.** The application is public, for a wide audience on the internet, in English only. There is no separate team audience to serve first.

Presentations are why the idea came up, not what is being built. The maintainer has not named a talk or a deadline.

## 2. The idea

**Decided.** An interactive web application for exploring OAuth and OIDC visually, and later wider authn/authz. It starts from the most basic concepts, such as what an identity provider and an issuer are, and one basic flow. Everything more advanced is added by switching it on in the same diagram, not by opening a separate page. It starts small and grows with more functionality over time.

In the maintainer's framing, it combines three things that no one site has together:

| Quality | Reference |
|---|---|
| Visually striking step-through | IdentiFlows |
| Advanced level, including executing a step | AuthPlayground |
| Basic explanation of the concepts themselves | Okta's illustrated guide |

The spirit is that of the visual guides to transformers, but authn/authz is a much more varied topic, which is why it suits an interactive site over a single article.

### It is an application, not an article

**Decided.** The maintainer asked for an interactive site and a web application with CI that clicks through it. People operate it. They do not read it from top to bottom.

**Proposed: what that means in practice.**

| | An article or blog post | This application |
|---|---|---|
| Main thing on screen | Text, with diagrams illustrating it | The diagram and its controls. Text appears for whatever is selected |
| How you move through it | Reading order, scrolling | Pick a flow, change settings, step forward and back, execute a step |
| Unit of work | A page or a piece | A state: base flow, diagram, settings, mode and current step |
| What growth means | Another post | Another toggle or flow in the same application |
| What finishing means | Publishing | It keeps growing, and each addition is a small change that CI validates |
| How quality is checked | Proofreading | Automated click-through, plus review of protocol claims |

So design the screens, controls, state and routing first. Explanations are content attached to steps and settings, not pages of prose. There is no fixed reading order. People choose where to go from a map (section 5.9).

## 3. What to take from existing work

### How it should work: interactive tools

These are the references for the form. **Decided:** the format of IdentiFlows is the one to match or improve upon. The maintainer found the others worse.

| Source | Take | Leave |
|---|---|---|
| [IdentiFlows](https://identiflows.dev/) (Auth0) | Step-through where each step shows only what is relevant at that point, in detail. **The maintainer's favourite quality.** | A separate page per variant. In depth from the first step. Auth0 branding. |
| [roadmap.sh](https://roadmap.sh/) | An entry where you navigate to what you want to learn about. | Accounts and ads. |
| [AuthPlayground](https://www.authplayground.dev/) (Ping) | `Execute`, a fake execution with raw request and response. Advanced topics. | `Execute` on every step. A static diagram that does not follow execution. No user options. |
| [ProtocolSoup](https://protocolsoup.com/) | Evidence of how much a toggle can teach: on Client Credentials, Bearer gave 12 events and DPoP gave 27, including the nonce retry. | Options change a timeline, not the lifeline diagram. |
| [MCPJam](https://docs.mcpjam.com/inspector/guided-oauth) | Proof that a function from options to diagram steps works. Its diagram depends on protocol version and registration method. | MCP only, and needs a live server. |
| [Authlete Playground](https://github.com/authlete/oauth-playground) | The widest option surface, with a live preview of the wire request. | No sequence diagram. |

### What to say and how to verify it: articles

These are references for content only, not templates for the form.

| Source | Take | Leave |
|---|---|---|
| [Okta's illustrated guide](https://developer.okta.com/blog/2019/10/21/illustrated-guide-to-oauth-and-oidc) | Basic concepts in plain language for newcomers. | Static, one depth, mostly one flow. |
| [The Illustrated Transformer](https://jalammar.github.io/illustrated-transformer/) | Clear explanation matters. It drew 500 Hacker News points seven years after publication. | The linear article format. |
| [Illustrated TLS](https://tls13.xargs.org/) | Every byte reproduces from a working client, server and captures in the repo. | It drifted from practice: still X25519 only. |

## 4. The gaps being aimed at

The maintainer's assessment, with how well each one is supported. "Not found" means not found in limited searching and is not proof of absence.

1. **Step-through tools skip the basics.** They are in depth immediately. Well supported: the research found no step-through tool with a concept layer, and the most reported confusion is conceptual (OAuth vs OIDC, token types, why the steps exist).
2. **Nobody shows setup from the application's point of view.** Existing tools explain how the flow works from the end user's perspective, but part of OAuth is getting the handshake between the application and the IdP in place. Plausible but lightly checked: the original research did not look at this, and one follow-up search found only glossaries and vendor docs. Stack Overflow supports it: Keycloak's invalid `redirect_uri` (505k views), endpoints (375k) and client secrets (230k) are all setup questions.
3. **External IdPs are not covered.** Plausible but lightly checked: not in IdentiFlows' 13 flows, and searching found [Authlete's tutorial](https://www.authlete.com/developers/tutorial/idp) and one static figure in Keycloak's guide, nothing interactive.
4. **Parts that could be toggles are presented as separate concepts.** Well supported: no general OAuth tool found changes one diagram as you flip options. AuthPlayground does chain PAR, RAR, PKCE, DPoP and token exchange in one fixed flow, but a visitor cannot compose it.
5. **Nothing maps protocol to Keycloak.** Well supported: no tool found maps a protocol option to the realm or client setting that controls it.

**"Not present anywhere" is still a bet.** What is unoccupied is the combination, not each part. IdentiFlows is adding flows and could add toggles, which would close gap 4 with one product decision.

## 5. Core design ideas

### 5.1 Start from OAuth and OIDC

**Decided.** The earlier research report recommended starting with the registration flow and sending people to IdentiFlows for the basics. **That recommendation is superseded**, for three reasons: toggles need a base flow to change, the original problem is explaining at different levels, and the basics are the reported confusion.

The caveat is that the basic code flow is also the most saturated area, and a wave of near-identical simulators in 2026 suggests a plain animated flow is now cheap. The first version must therefore already show what is different: the concept layer, the setup diagram and at least one working toggle.

### 5.2 One diagram, many toggles

**Decided.** Others treat toggleable parts as separate concepts. Here they are a set of toggles on one diagram, so a visitor can see that DPoP is a change to the flow they already understand, not a new flow.

**Proposed: the transition is the centrepiece.** Stable step IDs let a toggle animate as a change, with an arrow sliding in and rows shifting, instead of a redraw. No precedent found does this for general OAuth, and it is the moment the idea either lands or does not. It has to work inside a message as well as between messages: OAuth to OIDC adds at most one arrow, and most of the change is in fields.

### 5.3 Setup has its own diagram

**Decided:** the application's view of setup is in scope, and it is a diagram of its own next to the user flow ([ADR-013](adr/013-a-flow-is-one-ordered-list-of-conditional-steps.md)). The maintainer ruled out combining them, because "it makes it look like the setup is something the user does". The toggles in section 5.2 still act on one diagram at a time, and settings apply to both.

The handshake runs in both directions:

| Side | What it must learn |
|---|---|
| The IdP learns about the app | Client ID, client type, redirect URIs, allowed scopes |
| The app learns about the IdP | Issuer URL, endpoints via discovery, signing keys via JWKS |

Three things follow:

- **Registration is the setup.** Manual registration, DCR and CIMD are three answers to one question: how does the IdP get to know this app? So the CIMD toggle lives in the setup diagram and fits the story rather than being an advanced extra.
- **Setup and login are linked.** The redirect URI registered in setup is checked during login, and those two steps link to each other. That explains the most-viewed Keycloak error.
- **The setup diagram differs from runtime.** Manual setup is mostly people, an application team and an IdP admin copying values between consoles, not HTTP messages. So those people are lifelines on it, each next to the system they look after, and their hand-offs are drawn differently from HTTP. **Proposed:** DCR and CIMD take the people off the diagram, so that the hand-offs turn into HTTP arrows as a transition.

### 5.4 Limited context per step

**Decided as the quality to keep.** Each step shows only what is relevant at that point, in detail. This is what the maintainer liked about IdentiFlows.

### 5.5 Simple mode and advanced mode

**Decided:** the application has a simple mode and an advanced mode. In the maintainer's words, the advanced mode is there "to toggle more settings", at "the advanced level as in authplayground". So this is an application-wide mode that changes which settings are on offer and how much each step shows.

**Proposed: what each mode offers.**

| | Simple mode (the default) | Advanced mode |
|---|---|---|
| Settings on offer | A few, in plain language | All of them, with Keycloak feature flags as badges |
| Each step shows | The concept and why it happens | Parameters and raw request and response |
| `Execute` | Only where it adds something (section 5.6) | Only where it adds something (section 5.6) |

- Default to simple. A meta-analysis of 60 experiments found novices gain from high assistance (d = 0.505) and experts from low (d = −0.428), with help for novices the stronger effect. It did not test this kind of mode, so this is reasoning from adjacent evidence.
- A step can also expand for more detail within a mode. That supplements the modes and does not replace them.
- Keep **settings** (PKCE on or off) separate from the **mode**. A setting changes the flow, and the mode changes how much is exposed. Switching mode does not change which flow is on screen ([ADR-004](adr/004-modes-never-change-the-flow.md)). **Decided:** an advanced setting stays on when someone switches back to simple, as a chip they can remove, and the text drops to concept level. So DPoP can be shown simply.

### 5.6 Execute

**Decided as desirable:** the maintainer liked AuthPlayground's fake execution. **Decided:** it appears only on steps where it adds something, and it is honest: a combination with no recording says so and shows no payload ([ADR-005](adr/005-payloads-are-recorded-never-invented.md)).

**Proposed:**

- It is application behaviour, not a code sample. Executing a step produces values that later steps use, so the code returned in one step is the code sent in the next, and that state carries through the flow.
- It replays traffic recorded from a real Keycloak. That gives the same feel with real payloads and no backend to host, secure or have abused. Re-recording on each Keycloak release also catches drift. Illustrated TLS is the precedent for reproducibility, and it uses real captures.
- A recording is one real run, so values carry across steps without simulation. Earlier steps always count as executed, so a link only needs the step.

### 5.7 Keycloak as the reference

**Decided:** tracing what Keycloak can do is the edge, because it is a universal open source product that is not sold like the other IdPs.

**Proposed refinement of the reasoning:**

- "Not sold" is only partly true, as Red Hat sells a supported build. To someone on Entra, a Keycloak-centred site can look as vendor-focused as the sites criticised here.
- Neutrality alone does not differentiate, because ProtocolSoup and oauthflows are already independent and open source.
- The stronger edge is that **anyone can run it**. Every diagram can be reproduced against a real server, and vendors have little reason to build this layer.
- So keep the **protocol layer neutral, with Keycloak as an overlay** on each message: this setting controls this behaviour. Someone on another IdP still gets the protocol explanation.

**Decided:** recordings use a default Keycloak client, which is what people meet. On one, the access token carries the same identity claims with or without `openid`, so the overlay has to explain client scopes. Details are in [research/followup-checks.md](research/followup-checks.md).

### 5.8 Grow from a small start

**Decided.** It starts small and builds itself up with more and more functionality, all within the same application. Growth is the point, so the first version is the start of the product and not a one-off piece.

**Proposed:** build the engine so that adding a toggle is mostly flow data, recordings and tests. If each new toggle forces changes to the engine, the model is wrong.

### 5.9 The entry and the application screen

**Decided:** the entry is more like [roadmap.sh](https://roadmap.sh/), where you navigate to what you want to learn about. Everything else happens on one application screen, with settings on the left, the diagram in the centre, step detail on the right, and step controls below.

**Proposed: how the two relate.**

- The map is the home screen.
- A node is a named state, not a page: it opens the application screen at a base flow, settings, mode and step. So variants still never get a new page, and adding a toggle adds a node.
- The way back to the map stays one click away, and the node matching the current state is marked.
- A state reached by flipping settings by hand still has a URL, with or without a node.

## 6. Nuances that must not get lost

### Not everything is a toggle (Proposed)

The controls need more than on/off switches:

| Kind | Examples |
|---|---|
| Base-flow picker (different shapes) | Authorization code, device, client credentials |
| On/off modifiers | OIDC, PKCE, PAR, refresh tokens |
| Exclusive choices | Pre-registered, DCR or CIMD. Bearer, DPoP or mTLS. Public or confidential client |
| Constraints | Which combinations are invalid, and why |

Variants never get a new page. A different base flow can be a different view, but it stays in the same application with its state in the URL.

Toggles cut across messages. DPoP touches several steps and PAR changes what crosses the front channel, so conditions must sit on each step and field. `alt` frames cannot express this.

### A toggle shows what changed, not why (Proposed)

Turning on PKCE adds parameters, and the learner still does not know what they are for. "Why" is the most reported confusion, so each toggle must show the problem it solves, ideally what goes wrong when it is off. Showing an attacker's path when a protection is off is one way to do this.

### User federation and brokering are different (Proposed, from Keycloak's docs)

- **Identity brokering:** Keycloak acts as an intermediary and redirects the browser to another IdP. The diagram gains a lifeline and a nested flow, and client applications never contact the external provider.
- **User federation** (the docs call it "Using external storage"): Keycloak looks users up in LDAP, AD or a custom store on the server side. The docs mention no redirect.

This contrast makes a good toggle: same app, same token, different middle.

### Most of this is not feature flags (Proposed)

The maintainer named "feature flags of keycloak like cimd and token brokering" as especially interesting. From the current docs:

- Core brokering is not listed as a flag. **Decided:** by "token brokering" the maintainer means upstream token storage, and that is what the `identity-brokering-api` flags govern: `v1` is deprecated and on by default, `v2` is supported and off by default. Identity brokering and token exchange remain relevant too.
- `cimd` is a flag, and the specifications page marks it experimental.
- `token-exchange-standard:v2` is supported and on by default, but handles only the internal-to-internal case. `token-exchange:v1` is preview.

So organise the site by protocol concept and show Keycloak's status as a badge. Do not organise it around flags. The maintainer agrees with a badge for now, and the details get settled during implementation. More is in [research/followup-checks.md](research/followup-checks.md).

### Scope has to be bounded (Proposed)

"Whatever Keycloak can do" has no end. A feature gets in only if it teaches a concept or answers a question people actually bring you. Otherwise the site becomes a feature tour.

### Protocols drift (Proposed)

Stamp each flow with its spec version and a last-verified date. Experimental flags will mean rework. The version skew is itself teachable: CIMD is at IETF draft -02 with no last call recorded, MCP still links -00, and MCP's 2026-07-28 revision makes CIMD SHOULD and DCR MAY and deprecated.

### Combinations grow fast (Proposed)

Three independent toggles already give eight variants. Offer named presets as well as free toggles, encode invalid combinations as constraints, and test every valid one. The one detailed teaching success found also fits presets: a trainer offered a menu of recommended options per use case, and why each one solved the problem.

### Presentations are one use of the application (Proposed)

The maintainer can present with it by opening an exact state, so flow, settings, mode and step all belong in the URL, which an application needs anyway. A presenter view and slide exports are not requirements. People also forget details within months, so being somewhere they return to may matter more than a one-time walkthrough.

### Felt understanding misleads (Proposed)

In Transformer Explainer's study, video viewers felt they understood as well as others despite lower quiz scores. Consider predict-the-next-message prompts in simple mode.

### Accessibility and fallback (Proposed)

Plan early for step text outside the SVG, reduced motion, keyboard control and a static render for print and search. Wide diagrams on phones are a known risk. **Decided:** desktop comes first, and phone support comes later once it is clear which functionality fits a smaller workspace. Nothing may make that impossible ([ADR-008](adr/008-desktop-first-without-ruling-out-phones.md)).

### Competition and demand (Proposed)

- Plan for "what survives if Auth0 adds a toggle": the Keycloak overlay, flows verified against a real server, and version skew shown openly.
- Public demand is unproven. Recent interactive tool launches scored 3 to 19 Hacker News points while article explainers reach hundreds, though launch scores are noisy. A blog post may be how people first hear about it, and that belongs in the maintainer's blogs repo. It is distribution and does not change what is being built.
- LLMs are the real competitor for answers. This application must offer what a chat answer cannot: a stable visual frame and content verified against a real server.

### Visual ambition is a requirement and a cost (Proposed)

"Visually striking" is part of the Decided idea, so it is not the first thing to cut. Effort should go up front into the engine and visual language, with each later toggle costing much less. Transformer Explainer, the closest comparison as an interactive tool, took over a year with nine authors. There is no reliable estimate for this project, so do not plan around one.

## 7. Candidate concepts

An order for later releases. **Proposed**, and expected to change.

| Concept | Control | Effect on the diagram |
|---|---|---|
| Actors, issuer, tokens | Concept layer | Explained on the lifelines themselves |
| Client registration, discovery | Setup diagram | Steps before any user arrives |
| Authorization code | Base flow | The main flow |
| OIDC | Modifier | Adds the `openid` scope, an ID token and UserInfo. The access token does not change on a default Keycloak client |
| PKCE | Modifier | Adds `code_challenge` and `code_verifier` |
| Public or confidential client | Exclusive | Changes setup and the token request |
| Pre-registered, DCR or CIMD | Exclusive | Changes the setup diagram. CIMD is the `cimd` flag, experimental |
| External IdP (brokering) | Modifier | Adds a lifeline and a nested flow |
| Stored upstream tokens | Modifier on brokering, then API V1 or V2 | Adds a retrieval call after login. V2 needs a confidential client |
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

**Step 0: test the model and the transition before polish.** The riskiest assumption is that one data model can absorb very different kinds of change. Model toggles that change the diagram in different ways:

- **OIDC:** adds a scope, a token and an endpoint.
- **DPoP:** touches several steps and adds a retry.
- **Brokering:** adds a lifeline and a nested flow.
- **Stored upstream tokens:** only valid with brokering, with an exclusive choice of API version, so it tests constraints.

Then build a rough animated prototype, because the data model alone will not show whether the transition lands. If one model handles all three, the toggle idea holds. If brokering breaks it, it is better to know now. A starting sketch is in [notes/format_benchmark.md](research/notes/format_benchmark.md), under the technical approaches section. These are test cases for the prototype, and brokering is not part of the first version.

**Result of step 0.** One model handled all of them with no special cases, across 42 valid combinations ([ADR-013](adr/013-a-flow-is-one-ordered-list-of-conditional-steps.md)). Whether the transition lands is the maintainer's call and is still open. The message shapes come from the specs and docs named on each setting, and most have not been run against a real server (see [research/followup-checks.md](research/followup-checks.md)).

**Then the first version, as a working application:**

1. **Entry map:** the home screen, with a node for each state this version offers.
2. **Application shell:** the diagram, step controls, settings, simple and advanced mode, and all state in the URL.
3. **Concept layer on the diagram:** select a lifeline to learn what the user, app, IdP and API are, and what an issuer is.
4. **Setup diagram:** client registration, redirect URI and discovery.
5. **Authorization code flow:** stepped through with only what is relevant at each step.
6. **One toggle, OAuth to OIDC:** with the animated transition.
7. **Advanced mode:** parameters and raw request and response for these steps, with `Execute` where it adds something.
8. **Keycloak overlay:** a first few settings, such as valid redirect URIs and client scopes.
9. **CI and Storybook from the first code commit:** build, type checks, flow model tests, the Storybook build and the automated click-through, all blocking merges.

OAuth to OIDC comes first because it takes on the most reported confusion with a single switch, where IdentiFlows uses separate pages.

## 9. Engineering requirements

**Decided:**

- This is a web application in its own proper repository.
- CI runs an **automated click-through** that validates the site through changes.
- CI blocks merges from the first code commit ([ADR-006](adr/006-ci-gates-every-change-from-the-first-commit.md)).
- **Storybook** is there from the start, to set the precedent ([ADR-007](adr/007-every-component-has-a-story.md)).
- The repository is public, with a licence that allows reuse and modification and requires attribution ([ADR-009](adr/009-code-is-apache-and-content-is-cc-by.md)).
- The site is completely static, with no state outside the visitor's browser, and on GitHub Pages for now ([ADR-010](adr/010-static-files-on-github-pages.md)).
- Tooling is whatever suits the JavaScript ecosystem, so no Taskfile ([ADR-011](adr/011-tooling-follows-the-javascript-ecosystem.md)).

**Proposed: what CI should prove**, because the toggles make this more than a generic end-to-end suite:

| Layer | Checks |
|---|---|
| Flow model | Every valid combination builds, invalid ones are rejected, step IDs stay stable |
| Component states (Storybook) | Each component renders in each of its states in isolation, such as step, field and mode |
| Click-through (Playwright) | For each named state: walk every step, flip toggles, switch mode, assert the visible steps match the model, use keyboard control, and open a fixed list of URLs that must keep showing the same state |
| Visual regression | Screenshots of key states, with animation frozen through reduced motion. Added once the visual language has settled |
| Keycloak recordings | Regenerate on demand against a pinned Keycloak, 26.8.1 for now, and check weekly against new releases to detect drift. Not on every pull request |

**Decided: the stack.** SvelteKit for the view, with its static adapter, and plain TypeScript for the flow model and engine ([ADR-012](adr/012-sveltekit-for-the-view-and-plain-typescript-for-the-engine.md)). The maintainer first doubted that SvelteKit hosts easily as static files, and chose it after a test on a Pages-style server, in [research/followup-checks.md](research/followup-checks.md).

A content-site setup, with prose pages and the diagram as one embedded island, is what the research suggested. It is not the default, because it treats the diagram as an illustration.

- No mature library does step-through plus composable toggles, so expect a small custom renderer. Sequence layout is simple, so this is smaller than it sounds.
- Mermaid has no sequence animation and a large bundle, so do not use it at runtime. D2 has the closest variant model but only looping playback.
- SeqShow, Cinegram and Token Journey are worth reading for ideas, but are young, small and were not run.
- Use a stepper, not scroll-driven storytelling, because a sequence diagram needs a stable spatial frame.

## 10. Not goals, for now

- An article, blog post, scrolling essay or slide deck.
- A presenter view or slide export.
- Designing for phones first (section 6).
- A debugger for your own server. oauth.tools, OAuth Debugger and others already do this.
- Comparing vendors or IdPs.
- A tour of Keycloak features.
- Authz, beyond keeping the structure open to it.
- Redrawing saturated topics for their own sake, such as JWT decoding and WebAuthn demos.

## 11. Open questions, and the next session's job

Still to settle:

- **Entry map:** whether a node is a named state as proposed in section 5.9, which nodes the first version has, and whether it shows planned ones.
- **First use of the application screen:** **Proposed:** the user flow first, faint arrows, the cast of lifelines in the step detail, and Next as the obvious action.
- **Keycloak overlay:** whether visitors can turn it off.
- **State and routing:** the rest of the URL shape. The base flow and diagram are in the path, with the rest in the query ([ADR-003](adr/003-state-is-in-the-url-and-variants-get-no-page.md)). **Proposed:** a path of their own for named states so they can be prerendered. Moving between steps replaces the history entry, and changing a setting, mode or diagram adds one.
- **Control model:** base flows and how presets relate to map nodes. Modifiers, exclusive choices and constraints are settled by [ADR-013](adr/013-a-flow-is-one-ordered-list-of-conditional-steps.md).
- **Recording pipeline:** how to capture Keycloak traffic per combination, including the questions step 0 raised in [research/followup-checks.md](research/followup-checks.md).
- **Name and domain:** `visual-auth-explainer` is a working name only.

## 12. How to know it is working

**Proposed.** No deadline has been set. Success means people use the application and it stays cheap to grow.

- The maintainer reaches for it instead of drawing a new diagram, including when presenting.
- People find it, come back to it unprompted, and can get to the settings that match their question.
- Adding a toggle is a small change of flow data, recordings and tests, and the click-through still passes.
- If new toggles keep forcing engine changes, rethink the model before adding more.
- If IdentiFlows ships toggles first, drop the general mechanic as the differentiator and keep the Keycloak layer.
