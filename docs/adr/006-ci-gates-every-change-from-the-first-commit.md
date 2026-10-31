# ADR-006: CI gates every change from the first code commit

From the first code commit, a pull request can merge only when the formatting and lint checks, the type checks, the unit tests, the Storybook build and an automated click-through pass. Branch protection on `main` enforces this, for the maintainer too, and a merge goes live only after the same checks pass on it. `pnpm verify` runs the same checks locally. The click-through runs against the real static build, served the way GitHub Pages serves it. It walks every step, flips the settings, switches mode once there are modes, uses the keyboard, opens a fixed list of URLs that must keep showing the same state, and renders every story in the Storybook inside that build.

Re-recording Keycloak traffic runs on demand and weekly, not on every pull request. Visual regression is added once the visual language has settled.

An automated click-through is why this repository exists. States multiply with every setting, and nobody can check them by hand.

## Not chosen

- **Add CI once the application has settled**: Each setting added before then is one more state nothing has ever checked.
- **Re-record on every pull request**: A change to the view would fail for reasons that come from booting Keycloak.
- **Visual regression from the start**: While the look is still moving, every change would fail it.
