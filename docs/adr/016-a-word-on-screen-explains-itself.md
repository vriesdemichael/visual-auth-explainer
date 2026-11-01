# ADR-016: A word on screen explains itself

Every term that needs explaining has one entry in `src/lib/flow/glossary.ts`: what it means in plain words, what else it is called, and where on the diagram it is, with the settings it needs. A renderer finds those terms in step text and marks the first use on each step with a dotted underline, so nobody writes a mark by hand. Selecting one explains it and lights up its place on the diagram, or links to where it can be seen. It has an address, `explain=term.scope`, like everything else on the screen ([ADR-003](003-state-is-in-the-url-and-variants-get-no-page.md)).

A test walks all simple-mode text in every valid combination, and fails on an acronym, a name from the wire or a word on its watch list that has no entry. So a new term cannot go in without its explanation, because every round adds words and nothing else would stop the next one.

The diagram is its own language too, so "How to read this" names its parts the same way, and each one lights up as it is selected.

What is only about one server is marked as such, and goes when the notes about that server do ([ADR-015](015-keycloak-is-an-overlay-on-a-neutral-protocol.md)).

Someone new has to learn these words anyway, because the docs use them. A plain alternative for every one would leave them lost the moment they open those docs, so a word can be used once it can be asked about. A review found words used and never explained, and people leaving without ever learning what Keycloak is. This application has a diagram to point at, and a glossary page would waste that.

## Not chosen

- **A glossary page**: It takes someone away from what they were reading, and cannot point at the diagram.
- **Marking every use**: The same word underlined six times on a step is noise.
- **Marks written by hand in the text**: They would be forgotten, and the flow data would stop being plain words.
- **Marks in the settings rail**: Five short descriptions repeat the same words, and a setting already has its Why.
