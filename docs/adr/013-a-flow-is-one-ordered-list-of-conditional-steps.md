# ADR-013: A flow is one ordered list of conditional steps

A flow is data: one ordered list of steps, each with an optional condition, and each with fields that can have conditions of their own. Lifelines and groups can be conditional too. Evaluating a flow against the settings gives the diagram, so a setting can add, remove or reword, but it can never reorder. A condition is data rather than a function, so the application can say which setting caused what. Adding a setting means a line in `Settings`, a definition in `settingDefs`, and conditions in the flow.

What a setting needs is a requirement on the setting or on one of its options, with the reason to show when it fails. When a change takes away what another setting needs, that setting falls back to its default and the application says why. Each valid combination has to build a coherent diagram, which the tests check for every one of them.

A step is usually a message, a person passing something on, or something inside one system. It can also be time passing, where nothing is sent, which is drawn as a gap in every line and not as an arrow, because a refresh token only makes sense once time has gone by. A step can also end something, such as a session, which then goes from under every name that held it.

A field that differs from the base flow is shown on the message itself, and so is a field that carries a credential or token. Every other field is only in the step detail. So what is on the diagram is what the settings changed and what is being handed over.

A base flow has two diagrams, the user flow and its setup, and each is one such list on the same engine. Setup is apart because no user does it: the people who do are lifelines on its diagram, and no user or browser is. Settings apply to both. Back and Next stay inside a diagram, switching between them does not animate, and a step can link to a related step in the other.

OIDC, DPoP with a nonce retry, brokering with its nested flow, and stored upstream tokens with two API versions all fit this model without special cases. So did PKCE, the first setting added after the model settled, and with the settings added since they give 168 valid combinations. The order is what makes it work: because the list is fixed, a step that disappears has a nearest earlier step to fall back to, and a transition never has to move a row past another. If a later toggle needs to reorder steps, this record has to change first.

## Not chosen

- **`alt` frames or a tree of branches**: DPoP touches several steps and has no single place to branch.
- **A separate list of steps per variant**: Stable step IDs would have nothing to hold them together, and the variants would drift.
- **Conditions as functions**: They read well, but the application could not say which setting caused a step.
- **Setup at the top of the user flow's diagram**: It reads as something the user does, and the people who do it would have no lifeline.
