# ADR-005: Payloads are recorded from a real Keycloak and never invented

Every request and response the application shows, and everything `Execute` replays, was recorded from a real Keycloak. When a combination of settings has no recording, the application says so and shows no payload. Do not assemble a payload from fragments or write one by hand.

Recordings run against a plain Keycloak container, with a client on Keycloak's defaults unless the setting under test changes it. Each recording is one real run, so the code returned in one step is the code sent in the next without any simulation.

`Execute` appears only on steps where it adds something, and each step's data says whether it does. A step with no HTTP exchange never has it.

What a chat answer or a vendor's simulation cannot offer is that what is on screen is what a real server did. A default client is what people meet: on one, the access token carries the same identity claims with or without `openid`, and a tidied-up demo client would hide that.

## Not chosen

- **Stitching together payloads for unrecorded combinations**: They would look real, and nothing would prove them.
- **A stripped demo client**: It tells a cleaner story that nobody meets in practice.
- **`Execute` on every step**: Most steps have nothing to add, and the button would stop meaning anything.
- **A live backend**: It adds something to host, secure and have abused, for the same payloads.
- **keycloak-operator or keycloak-gitops**: They are built for Kubernetes, and the maintainer does not want this project held to them.
