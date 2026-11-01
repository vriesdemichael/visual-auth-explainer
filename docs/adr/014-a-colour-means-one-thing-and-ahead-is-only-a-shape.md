# ADR-014: A colour means one thing, and what is ahead is only a shape

Colours come from the tokens in `src/app.css`, and each means one thing everywhere: how a message travels, what it carries, where you are, or what a setting just changed. Text meets WCAG AA on what it sits on, in both themes, and `src/theme.test.ts` holds it to that. A new pair of text and background goes in that test. What each thing that gets passed around looks like is there too, one rule for each, so a new one touches no component. Two forms of one thing, such as a verifier and its challenge, share a colour.

A step shows what has happened and no more. Every message has a number. Up to the current step it has a label and its chips. Ahead it is a faint arrow with its number, and its label appears on pointing at it or when a setting has just changed it. So text is either readable or absent, never faded.

A message says how it travels: through the browser, direct, or between people. Credentials and tokens are chips on the message. Under each lifeline are chips for what it has seen so far, which `holdingsAt` works out from the fields on the steps and is never written by hand, so it cannot disagree with the flow. The heads keep room for everything they will have seen by the last step, so stepping never moves a row.

Limited context per step is the quality the maintainer asked to keep, and the numbers let someone presenting say which step they mean. What crosses the browser and what does not is the security idea of a redirect flow, and who has seen what is the question behind "why a code and then a token". Both were only in the text before, and a colour that meant two things would teach nothing.

## Not chosen

- **Draw only the messages so far, as IdentiFlows does**: A setting that changes something ahead would change nothing on screen, and that change is what this application exists to show.
- **Faded labels for what is ahead**: They fail contrast, and they are noise at the step someone is trying to read.
- **A picture of what each lifeline has seen, written per step**: It would drift from the flow, and adding a setting would mean rewriting it.
