# ADR-015: Keycloak is an overlay on a neutral protocol

What the protocol does and what Keycloak does about it are separate data. The flow, the settings and what things are called say nothing about one product, and a test fails if they do. What is specific to Keycloak is a note in `src/lib/keycloak/notes.ts`, attached to a step, saying which setting controls what that step shows. The exception is a feature flag a setting depends on, which is a badge on that setting and so lives in `settings.ts`.

A note says where the setting is in the admin console, in the console's own words, or that it is a server option. It holds for the version the recordings were made with, and it says so. A note is only written after trying it on a real server: `pnpm record` changes the setting, does a real login before and after, and writes down what happened. It also goes through a real admin console to see that each path exists. A test holds every note to those answers, so a note whose setting changes nothing cannot exist, and neither can one naming a place that is not there. `pnpm record --check` catches both on a new release.

Notes are in advanced mode, closed until opened, because the name of the setting is what most people are looking for. Feature flags show as badges on the options and notes they belong to. The application stays organised by protocol concept, with nothing organised by flag.

One switch, Server notes, on by default, takes all of it away, and it is in the URL as `keycloak=off`. With it off, the word Keycloak is not on the application screen: the recordings are "a real server", and its docs are not offered as sources. Being checked against a real server is still true then, and still worth saying.

Keycloak's own words for the parties are in that layer too, in `src/lib/keycloak/words.ts`, and are one of the three a person can choose ([#62](https://github.com/vriesdemichael/authlines/issues/62)). They go with the switch as well: with it off they are not offered, and a link asking for them gets the default.

The premise's bet is that someone on another identity provider still gets the protocol explanation, and that this layer survives if a vendor adds toggles to its own tool. Both only hold if the two stay apart. And reading the real console corrected the first draft of these notes twice, which is why none is written from memory.

## Not chosen

- **Notes in the step text**: Someone on Entra would get Keycloak in every explanation, and the two could not be held apart by a test.
- **Notes in simple mode**: Newcomers would meet console paths before they know what a client is. They are one click away, in advanced mode.
- **Open by default**: A step with three notes would push the real traffic off the screen. The name of the setting is visible closed.
- **Organising by feature flag**: Most of what people look for is not behind a flag, and the application would become a tour of Keycloak.
- **A separate Keycloak page**: It would be a variant with a page of its own, which ADR-003 rules out, and the point is seeing the setting on the message it controls.
- **Calling the switch "Keycloak notes"**: With it off, the word would still be on the screen.
