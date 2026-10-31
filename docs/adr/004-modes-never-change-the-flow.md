# ADR-004: A mode changes what is on offer, never the flow on screen

Simple and advanced mode apply to the whole application, and simple is the default. A mode changes which settings are offered and how much each step shows. It does not change the flow, the settings that are on, or the steps in the diagram.

An advanced setting that is on stays on when someone switches back to simple mode. It shows as a chip they can remove, and the step text drops to concept level.

A setting changes the flow, and a mode changes how much of it is exposed. Keeping the two apart lets DPoP be shown at concept level, and a mode switch never moves the diagram under someone.

## Not chosen

- **Reset advanced settings on leaving advanced mode**: The diagram would change on a mode switch, and the setting would be gone on the way back.
- **Keep the setting applied but hide it**: The diagram would show something no control explains.
- **Per-step expansion instead of modes**: The maintainer asked for a simple and an advanced mode. A step can still expand within a mode.
