# ADR-005: Payloads are recorded from a real Keycloak and never invented

Every request and response the application shows, and everything `Execute` replays, was recorded from a real Keycloak. When a combination of settings has no recording, the application says so and shows no payload. Do not assemble a payload from fragments or write one by hand.

Recordings run against a plain Keycloak container, with a client on Keycloak's defaults unless the setting under test changes it. Each recording is one real run, so the code returned in one step is the code sent in the next without any simulation. `pnpm record` makes one per named state in `static/recordings/`, with a small demo app and API driven by a headless browser, a second realm as the upstream IdP, and a proxy to capture what Keycloak sends that upstream. It also tries the things the diagram makes a claim about and writes down what happened, in `questions.json`.

The demo app and API do what the steps say they do: the app looks up its endpoints from the issuer, compares `state` and validates the ID token, and the API checks the signature, the issuer, the expiry, the audience and a DPoP proof. Those checks are in `scripts/record/checks.ts`, with tests that try to get past them, and a run stops if one fails, so a success in a recording means they looked. Each run gets a new client and provider with these settings and otherwise Keycloak's defaults, so a setting that is off really is off.

A test holds the flow data to the recordings in both directions: every message and field the diagram draws is in the recording, nothing else is there apart from what is only Keycloak's business, and each credential and token appears in exactly the messages the diagram says. When a real Keycloak does not do something the spec allows, the step says `specOnly` and the application marks it, because a message that was not recorded must not look like one that was.

The screen claims no more than that. In advanced mode a message says how it is known: from the server when the identity provider took part in it, from the demo app and API when it did not, recorded with other settings when this combination has no recording, or from the spec. Simple mode leaves this out, because it means nothing yet to someone new, apart from a message that is only from the spec. A note in the Keycloak overlay says what was done to back it, in its own words.

A workflow records against the latest Keycloak every week and on demand, compares the shape with what is committed, and opens an issue when it differs. The shape is which steps happened, which names they carried and which claims the tokens held, because codes, tokens and timestamps change on every run.

`Execute` appears only on steps where it adds something, in advanced mode, and each step's data says whether it does. That means a step that sends something, where a later step uses what comes back. A step with no HTTP exchange never has it. Running one moves to the step with the answer and keeps nothing else, so the URL still only needs the step, and it says that nothing is really sent.

A recording belongs to exactly one set of settings, and is never adapted to another. What the application shows is formatted from the file and nothing else, and the click-through compares the screen with the file for every step of every named state. Recordings load when first asked for, so simple mode downloads none.

What a chat answer or a vendor's simulation cannot offer is that what is on screen is what a real server did. A default client is what people meet: on one, the access token carries the same identity claims with or without `openid`, and a tidied-up demo client would hide that.

## Not chosen

- **Stitching together payloads for unrecorded combinations**: They would look real, and nothing would prove them.
- **A stripped demo client**: It tells a cleaner story that nobody meets in practice.
- **A recording per valid combination**: There are 76 and counting, while each message already appears in a named state. A combination with no recording says so.
- **`Execute` on every step**: Most steps have nothing to add, and the button would stop meaning anything.
- **A live backend**: It adds something to host, secure and have abused, for the same payloads.
- **keycloak-operator or keycloak-gitops**: They are built for Kubernetes, and the maintainer does not want this project held to them.
