# Authlines

Auth, line by line. An interactive web application for exploring OAuth, OIDC and authn/authz visually. It starts from the most basic concepts and one flow, then builds up through toggles on the same sequence diagram, with each step showing only what is relevant at that point. Keycloak is the reference that flows are traced against.

This is a first version. Its messages are recorded from a real Keycloak, and the rest of what it says is written by hand and checked against the specs. Open [the application](https://vriesdemichael.github.io/authlines/) or [its Storybook](https://vriesdemichael.github.io/authlines/storybook/). Both update on every merge to `main`, and each pull request gets a preview of both.

```bash
pnpm install
pnpm dev
```

`pnpm verify` runs every check CI runs, and `pnpm storybook` opens the components.

- [Premise](docs/premise.md): what this is, why, the nuances, and what happens next
- [Target states](https://github.com/vriesdemichael/authlines/issues?q=is%3Aissue+label%3A%22target+state%22): where it is going, with acceptance criteria and deliverables
- [Original brief](docs/original-brief.md): the idea in the maintainer's own words
- [Decision records](docs/adr/index.md): the rules for how it is built and worked on
- [Research](docs/research/README.md): what already exists, what is left open, and how far to trust that

## Where things live

- `src/lib/flow/`: what a base flow is, the data of each one, and what is on screen in a given state. Nothing about a view or a product.
- `src/lib/diagram/`: the geometry and the motion of the diagram, as pure functions.
- `src/lib/recordings/`: what was recorded of each flow, and how a message is known.
- `src/lib/keycloak/`: everything about one product, which the protocol layer never mentions (ADR-015).
- `src/lib/map/`: the questions on the home screen.
- `src/lib/sources/`: the specs and docs that open beside the diagram.
- `src/lib/components/`: the view, with a story for each state of each component (ADR-007).
- `scripts/record/`: the real Keycloak, the demo app and API, and what gets tried on them (ADR-005).

Adding a setting is mostly data in `flow/`, a recording and tests. A second base flow gets its own diagrams, settings, recordings and notes, and `flow/second-flow.fixture.ts` is a small one that keeps that true.

## Licence

Code is under [Apache-2.0](LICENSE) and content is under [CC BY 4.0](LICENSE-CONTENT), so you can reuse and modify both with attribution. [NOTICE](NOTICE) says what to credit, and [ADR-009](docs/adr/009-code-is-apache-and-content-is-cc-by.md) says what counts as which.
