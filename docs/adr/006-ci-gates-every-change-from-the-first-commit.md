# ADR-006: CI gates every change from the first code commit

From the first code commit, a pull request can merge only when the build, the type checks, the flow model tests, the Storybook build and an automated click-through pass. The click-through walks every step, flips the settings, switches mode, uses the keyboard, and opens a fixed list of URLs that must keep showing the same state.

Re-recording Keycloak traffic runs on demand and weekly, not on every pull request. Visual regression is added once the visual language has settled.

An automated click-through is why this repository exists. States multiply with every setting, and nobody can check them by hand.

## Not chosen

- **Add CI once the application has settled**: Each setting added before then is one more state nothing has ever checked.
- **Re-record on every pull request**: A change to the view would fail for reasons that come from booting Keycloak.
- **Visual regression from the start**: While the look is still moving, every change would fail it.
