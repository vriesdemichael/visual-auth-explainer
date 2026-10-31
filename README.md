# visual-auth-explainer

An interactive web application for exploring OAuth, OIDC and authn/authz visually. It starts from the most basic concepts and one flow, then builds up through toggles on the same sequence diagram, with each step showing only what is relevant at that point. Keycloak is the reference that flows are traced against.

This is a rough prototype under a working name. It holds the application so far, along with the premise, the decision records and the research behind them.

```bash
pnpm install
pnpm dev
```

`pnpm verify` runs every check CI runs, and `pnpm storybook` opens the components.

- [Premise](docs/premise.md): what this is, why, the nuances, and what happens next
- [Original brief](docs/original-brief.md): the idea in the maintainer's own words
- [Decision records](docs/adr/index.md): the rules for how it is built and worked on
- [Research](docs/research/README.md): what already exists, what is left open, and how far to trust that

## Licence

Code is under [Apache-2.0](LICENSE) and content is under [CC BY 4.0](LICENSE-CONTENT), so you can reuse and modify both with attribution. [NOTICE](NOTICE) says what to credit, and [ADR-009](docs/adr/009-code-is-apache-and-content-is-cc-by.md) says what counts as which.
