# ADR-002: The premise holds intent, and decision records hold rules

How the application is built and how work is done are rules, and each rule has one record in `docs/adr/`. What the application is, who it is for, why, and what comes next are intent, and stay in `docs/premise.md`. A statement lives in one of the two, and the other links to it.

A record states a rule as it holds now. It is `NNN-slug.md` and opens with `# ADR-NNN: Title`. It gives the rule first and then why it holds, in prose, and may end with a `## Not chosen` list of `- **Alternative**: why not`. Say each thing once, and keep it short: every sentence states a rule, a reason it holds, or what to do.

When a rule changes, change the record, because git holds how it came to change. When a rule no longer holds, delete the record and every mention of its number, and never use the number again. Add or remove its line in `index.md` in the same change. A governance test holds the records to this shape and fails on a mention of a number with no record.

An agent reads a record as authoritative and cannot tell a stale one from a live one, so a record that stops holding is never left standing. A rule stated in two places drifts.

## Not chosen

- **The ADR and GitHub issues skills**: The maintainer chose the record format used in bitbucket-data-center-cli and mm-mcp, without the skills' workflow.
- **Status fields and superseded records**: They leave stale rules in the directory for an agent to read as live.
- **Every decision in the premise**: Its labels track what has been agreed about intent, and rules to hold code to would drown that out.
