# ADR-003: The state is in the URL, and a variant gets no page of its own

Everything on the application screen follows from one state: base flow, diagram, settings, mode, current step, any open source, and whatever someone asked to have explained. All of it is in the URL, so an exact view can be opened, shared and tested. The base flow and diagram are in the path, with setup at `/{flow}/setup/`, so each diagram is prerendered. The rest is in the query, and only what differs from the defaults. A variant of a flow never gets a page of its own. A different base flow or diagram can be a different view, inside the same application.

Steps are addressed by stable ID, not by number, because rows shift when a setting changes. When a setting removes the current step, the state moves to the nearest earlier step that remains. An ID that has shipped keeps working, so a link stays exact: renaming a step or setting means keeping the old ID as an alias. A link in an older form opens the same step and then replaces itself with the current form, as `?setup=1` and a setup step on the user flow's path do.

Opening a source adds a history entry and moving between its sections replaces it, so Back closes the source. A link naming a source or setting that does not exist opens nothing, like any other unknown value.

The unit of work in this application is a state, and stable IDs are also what let a toggle animate as a change instead of a redraw.

## Not chosen

- **A page per variant**: It is what this application exists to improve on, and it cannot show one diagram changing.
- **Step numbers in the URL**: A toggle renumbers the steps, so a link would open the wrong one.
- **State held only in memory**: No link could open an exact view, and a test would have to click its way to every state.
