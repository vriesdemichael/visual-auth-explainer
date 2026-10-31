# Original brief

The maintainer's messages from the conversation that started this project on 2026-10-30, kept verbatim. When [premise.md](premise.md) and these words seem to disagree on intent, ask the maintainer.

## The idea

> Recently i have been working a lot on keycloak and various oauth, authn and authz.
> It got to the point htat im the local expert in my team for auth and keycloak.
>
> I keep building presentations to explain concepts but im having a hard time explaining everything on the different levels.
>
> It got my brain cooking up the idea for a visual explainer website for authn/authz
>
> All the concepts are weird and hard to grasp from text.
> Visual explanation with sequence diagrams are much better.
>
> It would be something like a visual explainer for various concepts.
> Perhaps even with toggles for oauth concepts as cimd, dcr
> A simple mode and an advanced mode to toggle more settings.
>
> It would be similar to the visual guide to transformers. Because it is a much more varied topic it is better suited in an interactive site.
>
> Before i commit to something like this, doesnt it exist yet?
> Do research on the various explainers for oauth

## Response to the research

> Wow those are some really strong examples.
> What i like about identiflows is the step through with limited context in every step, it shows only what is relevant at that point in detail.
> The ping one (authplayground) is also strong with the `execute` that does a fake execution of that step.
>
> They are all quite in depth immediately and focussed on a vendor (which i get, they sell their own product).
>
> What im missing in the step through and flows explainers is the basic info that you do have in something like oktas visual guide.
>
> What also isnt in any of them is how you setup your oauth connection from the point of view of an application, they all try to explain how the flow itself works from an end user perspective, but a part of oauth setup is also getting the handshake between the application and the idp.
>
> The concept of an external idp which you can do with keycloak or user federation is also not covered in the sources i checked (didnt check them all)
>
> Something visually striking like identiflows, with the advanced level as in authplayground and the even more basic explainer of the concept of an idp, issuer etc would be beneficial and i think not present anywhere yet.
> Our edge can be tracing out whatever keycloak can do, as it is a universal opensource product that is not sold like the other idps.
>
> What i would like to do is create the most basic concept:
> oauth, oidc
>
> And build on it with toggles, the others have those toggleable parts as separate concepts instead of a set of toggles.
>
> It would start out small and build itself with more and more functionality.
> Some of the more interesting ones are the feature flags of keycloak like cimd and token brokering..

## Creating this repository

> Since this well be a web application i want a proper repo to do the ci with automated click through to validate it through changes.
> Might even benefit from something like a storybook.
>
> Can you put the premise in the repository so session can be triggered from there (instead of this repo focussed on blogs)
>
> Then in the other session, with the premise clear it could start working out details such as the structure of the site.

## After the first session read the premise

> There is a new session that read your premise and read it like a blog instead of an interactive website.

## Answers to that session's questions

Given on 2026-10-31, by number. The left column summarises the question, and the right column is verbatim.

| Question | Answer |
|---|---|
| One screen with settings, diagram and step detail | sure |
| Phone as a first-class target | sure desktop first, phone is becoming more important, but requires properly minimizing the functionality that would work on the smaller workspace, let's add mobile later. Keep it in mind though so we don't make it impossible to add it later |
| Opening straight into the application, with no landing page | I'm not sure about it, i think the entry sound be more like roadmap.sh where you navigate to what you want to learn about |
| Where the Keycloak overlay sits | I'm not sure what you mean with this |
| Feature flags as badges | as settings i think a badge is fine, but we'll figure this out il during the implementation |
| An advanced setting staying on as a chip in simple mode | good suggestion |
| Whether simple mode gets `Execute` | execute only where it adds something |
| Saying so when a combination has no recording | yes be honest |
| Recording against a default client | sure |
| CI blocking merges from the first code commit | sure |
| Skipping Storybook at first | would you not recommend it at all then? Otherwise do it from the start to set a good precedent |
| The team and its Keycloak version | no team: this app is public so it is a wide audience on the internet |
| Who builds | you build, i review and steer. For larger new implementation i want to discuss it with you forst |
| What "token brokering" means | upstream token storage, but the others are also relevant |
| Going public, and the licence | public: yes, with a license that allows reuse and modification but with attribution required |
| Language | English only |
| Which sites look right | the format of identiflows is definitely the one to match or improve upon, thr rest was worse |
| The ADR skills | not the skills, but i do want an adr like with bitbucket-data-center-cli or mm-mcp |
| Depending on the Keycloak repos | no let's not force ourselves into that straightjacket |

## On the stack and hosting

> Im not sure about sveltekit, i believe it is a bit harder to host as static code (feel free to prove me wrong if this is my misconception).
> The site could be completely static, there is no need for any statefulness outside of the users browser.
>
> I'd tend to github pages for the ease of use at this stage, later perhaps a dedicated place.
> Reviewing PRs could be a separate sub page or a local preview on my machine.
>
> Taskfile fits the go ecosystem, no need to pick that one here as well, pick whatever suits the ecosystem.

## After using the first deployed version

> For the rfcs, it would be nice to click them open with a summary + link (although, if the rfc is just text render it int he app instead)
>
> I also dont think we should combine the setup and the user flow in one graph, that makes no sense.. it makes it look like the setup is something the user does.
