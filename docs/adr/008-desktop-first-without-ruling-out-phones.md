# ADR-008: Desktop comes first, and nothing may rule out phones

Until the phone version exists, a phone opening any link gets a note that this is made for a bigger screen, and the step text, the controls and the settings, without the diagram and with no sideways scrolling.

The application is designed for desktop first. Phone support comes later, as a deliberate reduction to what fits a smaller workspace and not as a shrunken desktop layout.

Until then, no change may make it impossible. Keep settings and step detail separable from the diagram, keep every state reachable by URL so a phone can open it, and render lifelines from data so that a smaller screen can show fewer of them.

Phones matter more and more, but minimising the functionality properly needs an application to minimise. Nothing is lost by waiting, as long as the structure stays open to it.

## Not chosen

- **Phone first**: It would decide what gets cut before it is clear what the application is.
- **Shrink the desktop layout to fit**: A wide diagram is unusable at that size.
