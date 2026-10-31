# ADR-007: Every component has a Storybook story from the start

Storybook is in the repository from the first code commit. A pull request that adds or changes a component includes a story for each state the component can be in. Whole-flow states are not stories: they have URLs, and the click-through covers them. A governance test fails on a component with no stories.

The visual language is where much of the effort goes, and reviewing a component in every state should not mean walking a flow to reach it. Starting now sets the precedent, because stories rarely get written for components that already work.

## Not chosen

- **Add it later if it turns out to be needed**: Backfilling is the part that does not happen.
- **Stories for whole-flow states**: A URL already opens each one, so the stories would duplicate the click-through and drift from it.
