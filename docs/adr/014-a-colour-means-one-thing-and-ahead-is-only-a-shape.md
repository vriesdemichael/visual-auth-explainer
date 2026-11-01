# ADR-014: A colour means one thing, and what is ahead is only a shape

Colours come from the tokens in `src/app.css`, and each means one thing everywhere: how a message travels, what it carries, where you are, or who has no business here. There are few of them, because one thing should stand out at a time, and the test holds the list. What it carries is three quiet groups, what proves something, what gets something and what remembers, because the chip already says which it is. What a setting just changed is an outline that goes again, with no hue of its own. Text meets WCAG AA on what it sits on, in both themes, and `src/theme.test.ts` holds it to that. A new pair of text and background goes in that test. What each thing that gets passed around looks like is there too, one rule for each, so a new one touches no component. Two forms of one thing, such as a verifier and its challenge, share a colour.

Only the current step stands out: its arrow is heavier and its number is filled in. What has happened stays readable and quiet.

A step shows what has happened and no more. Every message has a number. Up to the current step it has a label and its chips. Ahead it is a faint arrow with its number, and its label appears on pointing at it or when a setting has just changed it. So text is either readable or absent, never faded. That faint arrow is below the 3:1 WCAG 1.4.11 asks of what someone needs, on purpose: it is a preview and not a thing to read, its number is AA, and a stronger one would compete with the current step, which the maintainer has asked to stand out alone.

A message says how it travels: through the browser, direct, or between people. Credentials and tokens are chips on the message, on the line of its label, and that label wraps rather than overrun its arrow. A test holds that in every combination. Under each lifeline are chips for what it has seen so far, which `holdingsAt` works out from the fields on the steps and is never written by hand, so it cannot disagree with the flow. The heads keep room for the most they will hold at any step, so stepping never moves a row.

Limited context per step is the quality the maintainer asked to keep, and the numbers let someone presenting say which step they mean. What crosses the browser and what does not is the security idea of a redirect flow, and who has seen what is the question behind "why a code and then a token". Both were only in the text before, and a colour that meant two things would teach nothing.

## Not chosen

- **Draw only the messages so far, as IdentiFlows does**: A setting that changes something ahead would change nothing on screen, and that change is what this application exists to show.
- **Faded labels for what is ahead**: They fail contrast, and they are noise at the step someone is trying to read.
- **A picture of what each lifeline has seen, written per step**: It would drift from the flow, and adding a setting would mean rewriting it.
