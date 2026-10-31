# ADR-001: An agent builds, and the maintainer reviews and steers

Agents write the code, flow data and content here, and the maintainer reviews and steers. Work reaches `main` through a pull request the maintainer merges.

A larger new implementation is discussed with the maintainer before it is built: a new part of the engine, a new base flow, a new tool, or a change to how the application is structured. Say what would be built, what is left out and what it will show, then wait for an answer. A small change inside what is already agreed needs no discussion first.

Everything a contributor needs is written down where an agent finds it, because a session keeps nothing: `CLAUDE.md` for working in this repository, the premise for intent, and these records for rules. When you find a convention that is written nowhere, propose a record.

A large build that goes the wrong way costs more to review than it would have cost to discuss.

## Not chosen

- **Build first and discuss the result**: On a large change the review becomes the design discussion, after the work is done.
- **Let conventions be inferred from the code**: It is slower and inconsistent, and it copies whatever the code got wrong.
