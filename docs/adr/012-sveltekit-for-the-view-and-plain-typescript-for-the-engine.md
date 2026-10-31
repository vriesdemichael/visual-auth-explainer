# ADR-012: SvelteKit for the view, and plain TypeScript for the engine

The view is Svelte on SvelteKit with its static adapter. The flow model, the diagram layout and the transitions are plain TypeScript under `src/lib/flow` and `src/lib/diagram`, with no imports from Svelte or SvelteKit, and are tested as pure functions.

Only route files under `src/routes` import `$app/*`. A component takes its state as props and reports changes through callbacks, because Storybook on Kit 3 cannot render a component that imports `$app/*`. A governance test fails on one that does.

Named states are prerendered, so each one is a real page with its own title and a diagram that shows without JavaScript. The query string does not exist while prerendering, so a page starts from its default state and applies the query once it has hydrated, without animating. A short inline script hides the page until then, so a link with settings does not flash the wrong diagram.

A public audience has to find and share these states, and that needs per-state HTML on a host with no rewrite rules. `docs/research/followup-checks.md` has the test against plain Svelte on Vite.

## Not chosen

- **Plain Svelte on Vite**: A link to a state returns 404 on GitHub Pages. Avoiding that means putting all state in the query string, which leaves search engines an empty page, or writing a prerender script that rebuilds what SvelteKit already does.
- **GSAP or Motion for transitions**: A transition here is a pure function from two frames and a time, which needs no library and can be tested at any moment. Revisit this if the choreography outgrows it.
- **Mermaid at runtime**: It has no sequence animation, and a redraw cannot show a change.
