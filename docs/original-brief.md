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
