# Static OAuth/OIDC explainers and evidence of demand

Checked on 2026-10-30. Hacker News figures come from the Algolia HN API. YouTube figures come from YouTube watch and search pages. Stack Overflow figures come from the Stack Exchange API. "HN 431/74" means 431 points, 74 comments.

**Quoting note:** comments are closely paraphrased and linked rather than quoted, apart from one short quote, because of a limit on reproducing source text verbatim. Each link goes to the exact comment, so the writer can check the original wording.

## What are the canonical explainers?

### Takeaway
The field is crowded and well attended: seven OAuth-specific YouTube videos total about 6.8M views, and an OAuth explainer or explanation has drawn 139+ HN points in every year from 2019 to 2026. Julia Evans is the one name in the brief that does not hold up. I found no OAuth explainer by her, only a development diary entry.

### Cited Findings

#### Written and illustrated

| Explainer | Author / publisher | Date | Format | Level | Reach | Opened? |
|---|---|---|---|---|---|---|
| [An Illustrated Guide to OAuth and OpenID Connect](https://developer.okta.com/blog/2019/10/21/illustrated-guide-to-oauth-and-oidc) | David Neal / Okta | 2019-10-21 | Cartoon-illustrated post, also a video | Beginner | [HN 431/74](https://news.ycombinator.com/item?id=21352045) | Yes |
| [An illustrated guide to OAuth](https://www.ducktyped.org/p/an-illustrated-guide-to-oauth) | Aditya Bhargava / DuckTyped | 2025-08-25 | Illustrated Substack post | Beginner to intermediate | [HN 355/62](https://news.ycombinator.com/item?id=45013131) | Yes |
| [OAuth 2 Simplified](https://aaronparecki.com/oauth-2-simplified/) | Aaron Parecki | 2012, later revised, revision undated | Long article with request examples | Developers implementing OAuth | HN [4/0 (2017)](https://news.ycombinator.com/item?id=14733913), [4/0 (2012)](https://news.ycombinator.com/item?id=4378768) | Yes |
| [OAuth 2.0 Simplified (online)](https://www.oauth.com/) | Parecki, sponsored by Okta | Undated | Web guide | Server builders | No data | Yes |
| [OAuth from First Principles](https://www.hexclave.com/blog/oauth-from-first-principles) | Zai Shi / Stack Auth, now Hexclave | 2024-08-24 | Story told through seven attacks, with diagrams | Developers who learn by breaking things | [HN 490/104](https://news.ycombinator.com/item?id=41420783) | Yes |
| [What's OAuth2, anyway?](https://www.romaglushko.com/blog/whats-aouth2/) | Roman Glushko | 2025-01-26 | 44-minute post with diagrams and HTTP examples | Engineers building clients or providers | [HN 341/88](https://news.ycombinator.com/item?id=42829149) | Yes |
| [What Is OAuth?](https://leaflet.pub/p/did:plc:3vdrgzr2zybocs45yfhcr6ur/3mfd2oxx5v22b) | Blaine, who wrote the first OAuth spec sketch | 2026-02-20 | Essay on purpose and history | People who want the why | [HN 231/83](https://news.ycombinator.com/item?id=47096520) | Yes |
| [The Modern Guide to OAuth](https://fusionauth.io/learn/expert-advice/oauth/modern-guide-to-oauth/) | Pontarelli, Hashesh, Moore / FusionAuth | Undated on page; on HN 2021-12-31 | Long guide with code | Implementers | [HN 295/60](https://news.ycombinator.com/item?id=29752918) | Yes (first 100k characters of 112k) |
| [An Introduction to OAuth 2](https://www.digitalocean.com/community/tutorials/an-introduction-to-oauth-2) | Mitchell Anicas, Vinayak Baranwal / DigitalOcean | 2014-07-21, modified 2026-01-27 | Tutorial | Not verified; an introduction by title | [HN 4/0 (2014)](https://news.ycombinator.com/item?id=8081696) | Raw HTML metadata and excerpts only |
| [Diagrams and Movies of All the OAuth 2.0 Flows](https://darutk.medium.com/diagrams-and-movies-of-all-the-oauth-2-0-flows-194f3c3ade85) | Takahiko Kawasaki (Darutk), Authlete co-founder | On HN by 2017-05-26 | Diagrams plus [animated flow videos](https://authlete.webflow.io/resources/videos/oauth2-flows) | Developers | [HN 6/0](https://news.ycombinator.com/item?id=14427122) | Article refused (403); Authlete video page opened |
| [OAuth 2 Explained With Simple Terms](https://bytebytego.com/guides/oauth-2-explained-with-siple-terms/) | ByteByteGo | Undated | One diagram and about 150-200 words | Beginner | [HN 2/0 (image link, 2023)](https://news.ycombinator.com/item?id=37143276); video below | Yes |
| [Day 22: getting OAuth to work in Rails](https://jvns.ca/blog/2020/12/08/day-22--getting-oauth-to-work-in-rails/) | Julia Evans | 2020-12-08 | Development diary, not an explainer | n/a | No data | Yes |

Popular on HN, but I read only the HN metadata, not the articles:
- A guide to Oauth2, Milap Neupane — [HN 254/53, 2019](https://news.ycombinator.com/item?id=20856443).
- The complete guide to protecting your APIs with OAuth2, Stack Overflow Blog — [HN 289/65, 2022](https://news.ycombinator.com/item?id=31004928).
- Everything you need to know about OAuth 2.0, Gravitational — [HN 207/28, 2020](https://news.ycombinator.com/item?id=23851870).
- Understanding OAuth2 and OpenID Connect, Polarsparc — [HN 139/64, 2020](https://news.ycombinator.com/item?id=24391612).
- Why use OpenID Connect instead of plain OAuth2?, a Security Stack Exchange answer — [HN 215/78, 2023](https://news.ycombinator.com/item?id=36481470).
- OAuth2 Explained with Cute Shapes, Back Market — HN [4/0](https://news.ycombinator.com/item?id=32989426) and [2/0](https://news.ycombinator.com/item?id=32913133), 2022. The article [refused the fetch](https://engineering.backmarket.com/oauth2-explained-with-cute-shapes-7eae51f20d38).

Other explainers that commenters recommended (not opened):
- [Auth0's Learn Identity video series](https://auth0.com/docs/videos/learn-identity-series) — [recommended in 2022](https://news.ycombinator.com/item?id=32519760).
- Sascha Preibisch's OIDC and OAuth videos — [recommended in 2025](https://news.ycombinator.com/item?id=42860147).
- A beer-garden analogy from Steve Tech Arch — [recommended in 2025](https://news.ycombinator.com/item?id=45013950).
- Microsoft Entra's flow diagrams — [called clearer than the alternatives in 2026](https://news.ycombinator.com/item?id=47119353).
- Sections I and II of the [OpenPubkey paper](https://eprint.iacr.org/2023/296) — [recommended in 2025](https://news.ycombinator.com/item?id=45014923).

#### Video (views read 2026-10-30)

| Video | Channel | Published | Length | Views |
|---|---|---|---|---|
| [OAuth 2.0 and OpenID Connect (in plain English)](https://www.youtube.com/watch?v=996OiexHze0) (Nate Barbettini) | OktaDev | 2018-02-05 | 1:02:17 | 2,048,569 |
| [OAuth 2.0: An Overview](https://www.youtube.com/watch?v=CPbvxxslDTU) | InterSystems Learning Services | 2016-10-05 | 6:34 | 1,271,285 |
| [OAuth 2 Explained In Simple Terms](https://www.youtube.com/watch?v=ZV5yTm4pT8g) | ByteByteGo | 2023-06-29 | 4:32 | 899,196 |
| [What is OAuth really all about](https://www.youtube.com/watch?v=t4-416mg6iU) | Java Brains | 2019-11-22 | 10:56 | 876,751 |
| [An Illustrated Guide to OAuth and OpenID Connect](https://www.youtube.com/watch?v=t18YB3xDfXI) | OktaDev | 2019-11-05 | 16:36 | 825,148 |
| [OAuth terminologies and flows explained](https://www.youtube.com/watch?v=3pZ3Nh8tgTE) | Java Brains | 2019-11-30 | 23:34 | 429,838 |
| [OAuth 2.0 explained with examples](https://www.youtube.com/watch?v=ZDuRmhLSLOY) | ByteMonk | 2023-09-13 | 10:03 | 417,106 |
| [What is OAuth and why does it matter?](https://www.youtube.com/watch?v=KT8ybowdyr0) | OktaDev | 2020-01-21 | not captured | 182,124 |

- The seven largest OAuth-specific videos above total about 6.8M views, over as long as ten years. Views are not unique people, and I reviewed the metadata, not the content.
- Broader auth explainers are still pulling large audiences. YouTube's [view-sorted search](https://www.youtube.com/results?search_query=oauth+explained&sp=CAM%253D) shows Hayk Simonyan's [7 Authentication Concepts](https://www.youtube.com/watch?v=iX8g4LqF8p8) at 852,874 views in about 8 months, Fireship's [Session vs Token](https://www.youtube.com/watch?v=UBUNrFtufWo) at 1,461,309 and ByteByteGo's [SSO video](https://www.youtube.com/watch?v=O1cRJWYF-g4) at 907,012.

#### Books and courses

| Resource | Author | Date | Format | Audience | Reach / price |
|---|---|---|---|---|---|
| [OAuth 2 in Action](https://www.manning.com/books/oauth-2-in-action) | Justin Richer, Antonio Sanso | March 2017, no second edition mentioned | 360-page book | Basic programming, HTTP and JSON | No sales data; [the 2015 HN announcement got 3 points](https://news.ycombinator.com/item?id=10234221) |
| [OAuth 2.0 Simplified](https://oauth2simplified.com/) | Aaron Parecki | 4th edition, updated November 2021 | Paperback, PDF, Kindle, ePub | Architects, developers, project managers, casual programmers | No sales data |
| [Introduction to OAuth 2.0 and OpenID Connect](https://courses.pragmaticwebsecurity.com/) | Pragmatic Web Security (Philippe De Ryck) | No course dates shown | 72-lesson online course | [People new to it who must make design decisions](https://pragmaticwebsecurity.com/courses/introduction-oauth-oidc.html) | Free; no enrolment figures |
| [Mastering OAuth 2.0 and OpenID Connect](https://courses.pragmaticwebsecurity.com/) | Pragmatic Web Security | No course dates shown | Three-course bundle | Not stated on the listing page | $659; no enrolment figures |

#### GitHub
- GitHub is a poor measure here. The largest result in a [repository search for OAuth explainers](https://github.com/search?q=oauth+explained&type=repositories) was [LukasNiessen/oauth-explained](https://github.com/LukasNiessen/oauth-explained), with 68 stars and a last push on 2025-05-07. It drew [HN 5/0](https://news.ycombinator.com/item?id=43759135).

#### Julia Evans
- The [Wizard Zines catalogue](https://wizardzines.com/zines/) has no OAuth or auth zine; the nearest is the HTTP zine.
- The [comics index](https://wizardzines.com/comics/) mentions OAuth only once, in a line about the 403 status code.
- Her [2020 diary entry](https://jvns.ca/blog/2020/12/08/day-22--getting-oauth-to-work-in-rails/) says she followed the steps without really understanding them and had only a rough grasp of OAuth.
- Her [feed](https://jvns.ca/atom.xml) also includes implementation notes on OAuth for Bluesky in the browser, which are not an explainer.

### Inferences
- HN points badly undercount reach for some canonical work. Parecki's article and Darutk's diagrams scored single digits, yet the brief treats both as canonical. HN measures what caught attention on a given day, not lasting use.
- Beginner and conceptual material dominates the largest audiences. Depth-specific material has smaller audiences, or none that can be measured.

### Gaps
- No book sales, Udemy enrolments or Pragmatic Web Security student numbers. [Parecki's Udemy page](https://www.udemy.com/course/oauth-2-simplified/) refused the fetch.
- I could not open the Darutk article or the Back Market article, so their content, dates and read counts are unverified. The Darutk summary rests on a search snippet and the 2017 HN submission.
- Julia Evans may have posted OAuth comics on social media. I checked her zines, comics index and feed, not every social post.

## What are the shared limitations of these explainers?

### Takeaway
Most fix one depth and one narrative, usually the authorization code flow, and most come from a vendor or stop short of current practice. Outdated implicit-flow material is less common than the brief assumed, since the prominent ones have been corrected or labelled. Coverage of OAuth 2.1 and newer extensions is the clearer weakness.

### Cited Findings

**Single depth**
- Okta's author [said on HN in 2019](https://news.ycombinator.com/item?id=21355965) that his post is a high-level overview, not meant to be complete.
- A commenter on the 2025 DuckTyped guide [called it largely conceptual](https://news.ycombinator.com/item?id=45016810): not enough on its own to write an integration.
- Another [said the guide leaves readers to work out what is missing and where to find it](https://news.ycombinator.com/item?id=45023397).
- At the other end, [Hexclave's piece says it is not for production implementers](https://www.hexclave.com/blog/oauth-from-first-principles), and ByteByteGo's [guide stays at about 200 words](https://bytebytego.com/guides/oauth-2-explained-with-siple-terms/).

**One flow, others deferred**
- [Okta's guide](https://developer.okta.com/blog/2019/10/21/illustrated-guide-to-oauth-and-oidc) walks through the authorization code flow plus the OIDC addition. Its body has no PKCE or implicit discussion; PKCE appears only as a further-reading link.
- [DuckTyped](https://www.ducktyped.org/p/an-illustrated-guide-to-oauth) covers PKCE, refresh flows and OIDC only briefly, and says PKCE may get a later post. Readers [asked for other flows](https://news.ycombinator.com/item?id=45018512) and [a PKCE edition](https://news.ycombinator.com/item?id=45014186).
- [Hexclave](https://www.hexclave.com/blog/oauth-from-first-principles) omits client secrets, refresh tokens, client credentials and other grants.

**Static format**
- All of the above are text, images or linear video. The closest to animation is [Authlete's animated flow charts](https://authlete.webflow.io/resources/videos/oauth2-flows), and those are YouTube videos.
- A DuckTyped reader [said even a rough animated GIF or slideshow would have helped](https://news.ycombinator.com/item?id=45018604).

**Mobile and readability**
- Readers reported that the [Okta post](https://news.ycombinator.com/item?id=21360903) and [Stack Auth post](https://news.ycombinator.com/item?id=41459341) rendered badly on phones.
- One [found the handwritten comic lettering hard to read](https://news.ycombinator.com/item?id=21357051).

**Outdated implicit flow: real but mostly labelled**
- [Barbettini's video description](https://www.youtube.com/watch?v=996OiexHze0) itself warns that the 2018 recording is partly out of date, mainly on the implicit flow. Its 2M views therefore include a known-stale section.
- [Authlete's video page](https://authlete.webflow.io/resources/videos/oauth2-flows) files implicit and password grants under obsolete flows and says they are not recommended. It does not mention PKCE.
- [DigitalOcean's tutorial](https://www.digitalocean.com/community/tutorials/an-introduction-to-oauth-2), from 2014, was modified in January 2026 and now carries a deprecated-grants warning and PKCE material.
- [Parecki's article](https://aaronparecki.com/oauth-2-simplified/) describes implicit as superseded by authorization code with PKCE, but still has a password grant section, limited to first-party apps.
- Alex Bilbie's grant guide was [called fairly out of date in 2025](https://news.ycombinator.com/item?id=45015654), with [RFC 9700](https://datatracker.ietf.org/doc/html/rfc9700) recommended instead. That [URL](https://alexbilbie.github.io/guide-to-oauth-2-grants/) now returns 404.

**OAuth 2.1 and modern extensions**
- No mention of OAuth 2.1 found: [Parecki's article](https://aaronparecki.com/oauth-2-simplified/), [oauth.com](https://www.oauth.com/), [Okta's guide](https://developer.okta.com/blog/2019/10/21/illustrated-guide-to-oauth-and-oidc), [ByteByteGo](https://bytebytego.com/guides/oauth-2-explained-with-siple-terms/) and [Hexclave](https://www.hexclave.com/blog/oauth-from-first-principles). The same holds for the [DigitalOcean page](https://www.digitalocean.com/community/tutorials/an-introduction-to-oauth-2), based on a text search of its raw HTML.
- Mentioned as a draft: [Glushko](https://www.romaglushko.com/blog/whats-aouth2/), who also covers DPoP briefly, and [FusionAuth](https://fusionauth.io/learn/expert-advice/oauth/modern-guide-to-oauth/), which mentions DPoP only in passing. Glushko does not cover PAR and barely explains OIDC.
- [OAuth 2 in Action](https://www.manning.com/books/oauth-2-in-action) dates from 2017 and [OAuth 2.0 Simplified](https://oauth2simplified.com/) was last updated in 2021.

**Vendor framing**
- Okta sponsors or publishes [the illustrated guide](https://developer.okta.com/blog/2019/10/21/illustrated-guide-to-oauth-and-oidc), [the Barbettini video](https://www.youtube.com/watch?v=996OiexHze0) and [oauth.com](https://www.oauth.com/).
- [FusionAuth's guide](https://fusionauth.io/learn/expert-advice/oauth/modern-guide-to-oauth/) uses its own endpoints and features in examples.
- [Hexclave](https://www.hexclave.com/blog/oauth-from-first-principles) promotes its product, and Authlete's co-founder [discloses his interest](https://darutk.medium.com/diagrams-and-movies-of-all-the-oauth-2-0-flows-194f3c3ade85) (search snippet only).
- Okta's guide itself stays mostly vendor-neutral in its explanation, so the branding is not necessarily a content flaw.

**Link rot**
- The [Polarsparc article](https://www.polarsparc.com/xhtml/OAuth2-OIDC.html) URL returned 404, and [Stack Auth's post](https://stack-auth.com/blog/oauth-from-first-principles) now redirects to a renamed company.

### Inferences
- The defensible gap is not that existing explainers are wrong. It is that a reader cannot move between depths within one explanation, or between flows, or see how one choice changes the exchange.
- Pitching against the implicit flow would be weak positioning, because the leading sources already flag it.
- I saw no static explainer here that spans executive, developer and security depths. This covers only what I opened; the interactive field belongs to another researcher.

### Gaps
- I did not systematically check DuckTyped or the HN-metadata-only articles for OAuth 2.1.
- I did not check the books' contents, so their PKCE and extension coverage is unknown. Manning's page simply does not mention PKCE or proof of possession.

## Which parts of OAuth do practitioners report as most confusing?

### Takeaway
The most consistent confusion is conceptual: OAuth versus OIDC and authentication versus authorization, then token types and why the flow has so many steps. Stack Overflow's view counts point the same way as the HN comments, which makes this the best-supported finding here.

### Cited Findings

**Authentication vs authorization; OAuth vs OIDC**
- [What's the difference between OpenID and OAuth?](https://stackoverflow.com/questions/1087031/whats-the-difference-between-openid-and-oauth) is the top question under openid-connect: score 1,200, about 391k views. It was asked in 2009, before OIDC existed, so it concerns the older OpenID.
- A commenter [said in 2025](https://news.ycombinator.com/item?id=42862081) that after years, and after writing an OAuth2 client, the OIDC difference is still unclear to them.
- In 2019, on Okta's guide, one reader [argued no guide really explains this difference](https://news.ycombinator.com/item?id=21352844).
- A commenter who has taught OAuth [described this misconception as central](https://news.ycombinator.com/item?id=35722036), and others [blamed the terminology](https://news.ycombinator.com/item?id=35721345) or [the name](https://news.ycombinator.com/item?id=24392345).

**Token types and JWT**
- [Why does OAuth v2 have both access and refresh tokens?](https://stackoverflow.com/questions/3487991/why-does-oauth-v2-have-both-access-and-refresh-tokens): score 852, about 315k views.
- [What are the main differences between JWT and OAuth?](https://stackoverflow.com/questions/39909419/what-are-the-main-differences-between-jwt-and-oauth-authentication): about 571k views.
- [What is the purpose of a refresh token?](https://stackoverflow.com/questions/38986005/what-is-the-purpose-of-a-refresh-token): about 176k views.
- [Clarification on id_token vs access_token](https://stackoverflow.com/questions/46681889/clarification-on-id-token-vs-access-token): about 37k views.

**Why the steps exist, and which flow to choose**
- [Why is there an authorization code flow when implicit works so well?](https://stackoverflow.com/questions/13387698/why-is-there-an-authorization-code-flow-in-oauth2-when-implicit-flow-works-s): about 96k views.
- A commenter [said beginners need to be told why the seemingly unnecessary hoops exist](https://news.ycombinator.com/item?id=24392914).
- Another [listed how each new constraint adds another grant or extension](https://news.ycombinator.com/item?id=47101133): no human present, limited input, public clients, unknown clients.

**Public clients and PKCE**
- A developer who had read docs for a month [was still puzzled how it works without a client secret](https://news.ycombinator.com/item?id=35719939).
- Another, returning after years away, [found PKCE entirely new](https://news.ycombinator.com/item?id=41459561).
- [State vs nonce](https://stackoverflow.com/questions/46844285/difference-between-oauth-2-0-state-and-openid-nonce-parameter-why-state-cou) has about 128k views.

**Terminology**
- A commenter [said write-ups often assume you already know the vocabulary](https://news.ycombinator.com/item?id=29755801), such as a server-side app being a client.
- Another [described misreading roles when writing a Mastodon client](https://news.ycombinator.com/item?id=35720832).
- A reader [praised one document simply for having a clear terminology section](https://news.ycombinator.com/item?id=35724443).
- [Pragmatic Web Security](https://pragmaticwebsecurity.com/courses/introduction-oauth-oidc.html) says that all newcomers are confused and cites dozens of specifications with uncommon terminology. It sells training, so this is partly marketing.

**Spec sprawl**
- [Parts spread across many RFCs](https://news.ycombinator.com/item?id=45015705), and [knowing which specs apply is itself difficult](https://news.ycombinator.com/item?id=42862952).
- [Nango](https://www.nango.dev/blog/why-is-oauth-still-hard) (a vendor, article updated 2026-04-01) adds provider-specific variation, vague errors and refresh-token handling. It claims about 80% of the flows it implements need debugging at first.

**Configuration and debugging**
- [redirect_uri_mismatch](https://stackoverflow.com/questions/11485271/google-oauth-2-authorization-error-redirect-uri-mismatch) has about 1.32M views, the most in this set. This is troubleshooting more than a conceptual gap.

**Keycloak specifically**
- [Invalid redirect_uri](https://stackoverflow.com/questions/45352880/keycloak-invalid-parameter-redirect-uri): about 505k views.
- [Keycloak's OAuth2/OIDC endpoints](https://stackoverflow.com/questions/28658735/what-are-keycloaks-oauth2-openid-connect-endpoints): about 375k.
- [Do Keycloak clients have a client secret?](https://stackoverflow.com/questions/44752273/do-keycloak-clients-have-a-client-secret): about 230k.
- [Resources, scopes, permissions and policies](https://stackoverflow.com/questions/42186537/resources-scopes-permissions-and-policies-in-keycloak): about 181k.
- [Logout through the REST API](https://stackoverflow.com/questions/46689034/logout-user-via-keycloak-rest-api-doesnt-work): about 163k.

**User-facing security**
- Several commenters [question](https://news.ycombinator.com/item?id=21357370) how a redirect-and-log-in flow [differs from phishing](https://news.ycombinator.com/item?id=35720378) in users' eyes.

**Retention**
- People report [reading it and forgetting within six months](https://news.ycombinator.com/item?id=42843464), or [forgetting the details after implementing unless they use it regularly](https://news.ycombinator.com/item?id=42862908).

### Inferences
- Many of the top Stack Overflow questions ask why something exists rather than how to do it, and many date from 2010-2012. This supports explaining the rationale rather than only the sequence.
- Forgetting is a distinct need from first-time learning. A reference someone returns to may matter more than a one-time walkthrough.
- A Keycloak layer looks useful: its most-viewed questions map protocol ideas to product configuration, which generic explainers do not address.

### Gaps
- Stack Overflow views accumulate over up to 16 years and are not a measure of current confusion. I did not compute a trend.
- No survey ranks these topics. The order here is my reading of the view counts and comments.

## Do practitioners still find OAuth hard, and what do they say is missing?

### Takeaway
Yes, and this is well supported, though the evidence is qualitative and self-selected. People repeatedly ask for more than the basics, for the rationale, and for concrete examples. Some commenters say it isn't hard, and several now use LLMs to fill the gap, which competes directly with any new explainer.

### Cited Findings

**Attention (measured, HN)**
- [Why is OAuth still hard in 2023?](https://news.ycombinator.com/item?id=35713518) got HN 642/282, among the highest OAuth stories I found, and its [author updated it for 2026](https://www.nango.dev/blog/why-is-oauth-still-hard).
- Explainers or discussions reached 139+ points in 2019 ([254](https://news.ycombinator.com/item?id=20856443), [431](https://news.ycombinator.com/item?id=21352045)), 2020 ([207](https://news.ycombinator.com/item?id=23851870), [139](https://news.ycombinator.com/item?id=24391612)), 2021 ([295](https://news.ycombinator.com/item?id=29752918)), 2022 ([289](https://news.ycombinator.com/item?id=31004928)), 2023 ([215](https://news.ycombinator.com/item?id=36481470)), 2024 ([490](https://news.ycombinator.com/item?id=41420783)), 2025 ([341](https://news.ycombinator.com/item?id=42829149), [355](https://news.ycombinator.com/item?id=45013131)) and 2026 ([231](https://news.ycombinator.com/item?id=47096520)).
- [Stack Overflow tag totals](https://api.stackexchange.com/2.3/tags/oauth-2.0;oauth;openid-connect;keycloak;jwt;pkce;oauth-2.1/info?site=stackoverflow): oauth-2.0 has 24,521 questions, oauth 20,248, jwt 18,197, keycloak 7,895, openid-connect 5,679, pkce 275 and oauth-2.1 just 11.

**People reporting difficulty (anecdote)**
- Someone who taught OAuth classes to hundreds of developers [concluded](https://news.ycombinator.com/item?id=35721079): "OAuth confuses people, and for completely understandable reasons." Their point is that habits from passwords and API keys do not transfer. This is one person's experience, but a large sample for an anecdote.
- An application security practitioner [said that even after repeatedly reading the specs they don't fully understand it](https://news.ycombinator.com/item?id=36490346), and argued the complexity is itself a vulnerability.
- An engineer who uses OAuth daily [still finds it hard to grasp](https://news.ycombinator.com/item?id=47097117) (2026).
- The person who wrote the first OAuth spec sketch [argues in 2026](https://leaflet.pub/p/did:plc:3vdrgzr2zybocs45yfhcr6ur/3mfd2oxx5v22b) that the machinery hides the goals. The post responds to Geoffrey Litt's request for a Matt Levine-style account of why OAuth is the way it is.
- A common path: [read docs, get confused, install an opaque library, get stuck troubleshooting](https://news.ycombinator.com/item?id=35718456).

**What they say is missing**
- More than the basics: [articles stop at the surface](https://news.ycombinator.com/item?id=45013786), and [actual implementation facts are hard to find](https://news.ycombinator.com/item?id=45013667).
- Concrete examples: [curl requests within the explanation](https://news.ycombinator.com/item?id=45020422).
- Rationale: [why each step exists](https://news.ycombinator.com/item?id=24392914), and [an explanation that defines its terms before using them](https://news.ycombinator.com/item?id=47098959).
- Visuals: [a developer who says they are largely a visual learner asked for diagrams](https://news.ycombinator.com/item?id=35719646), and [one credited clear diagrams for making OAuth understandable](https://news.ycombinator.com/item?id=47119353).
- Use-case tailoring: [documents are not specific to your case, which LLMs can provide](https://news.ycombinator.com/item?id=45018132).
- Teaching aids people make themselves: an engineer [built slides and notes for personal use, and still consults a paper written partly for that purpose](https://news.ycombinator.com/item?id=45014923). This closely matches the requester's own experience.

**What has already worked (anecdote)**
- [Barbettini's video](https://www.youtube.com/watch?v=996OiexHze0) keeps being recommended by name, in [2020](https://news.ycombinator.com/item?id=24393517), [2023](https://news.ycombinator.com/item?id=35719545) and [2026](https://news.ycombinator.com/item?id=47099176).
- The trainer above [says their materials worked because they offered a menu of recommended options per use case and explained why each one solved the problem](https://news.ycombinator.com/item?id=35722151).

**Counter-evidence**
- Some say it is simple and [needs about 10 minutes of focused reading](https://news.ycombinator.com/item?id=35721079) (the parent comment there), or that [only the documentation is bad](https://news.ycombinator.com/item?id=35720006).
- Others found the [RFCs straightforward once used to them](https://news.ycombinator.com/item?id=45017703) and [readable enough to implement](https://news.ycombinator.com/item?id=45021086).
- Several now use LLMs instead of guides: [Grok](https://news.ycombinator.com/item?id=45013667), [ChatGPT checked against the specs](https://news.ycombinator.com/item?id=45018132), and [a 2026 reader who preferred LLM answers to the article itself](https://news.ycombinator.com/item?id=47103809).

### Inferences
- **Difficulty: strong evidence.** It is consistent across years, roles and sources.
- **Appetite for explanations: moderate to strong.** The HN and YouTube numbers show repeated attention, though not whether readers are satisfied.
- **Willingness to pay: weak.** A [$659 bundle](https://courses.pragmaticwebsecurity.com/) and books exist, but I found no sales figures.
- LLMs are the main competitor to a new explainer, because they offer depth and use-case tailoring on request. A visual, trustworthy, reference-quality explanation would need to do something a chat answer does not.

### Gaps
- All of this comes from HN and Stack Overflow, which skew to English-speaking developers already interested in the topic. People who found it easy, or never engaged, are underrepresented.
- I found no survey or quantitative study on OAuth comprehension or on LLM substitution.
- **Reddit is missing entirely.** Both the search and fetch tools refuse reddit.com (a crawler block), and I did not try to route around it with a spoofed client or mirror sites. r/webdev, r/programming, r/oauth, r/KeyCloak, r/devops and r/selfhosted were therefore not read. This is a meaningful hole, especially for r/KeyCloak and r/selfhosted.

## Are there threads asking for, or launching, a better visual explainer, and how were they received?

### Takeaway
I found no HN thread with real traction that explicitly asks for a better visual explainer, only scattered single comments. Launches of interactive or visual tools scored 3 to 19 points with at most one comment, while article-format explainers scored in the hundreds. This is weak evidence against tool-style launches on HN, not proof of no demand.

### Cited Findings

**Launches and visual attempts**

| Launch | HN date | HN result | Status on 2026-10-30 |
|---|---|---|---|
| [AuthPlay: Visualize, Debug and Play with Flows](https://news.ycombinator.com/item?id=42618161) | 2025-01-07 | 3 points, 0 comments | [authplay.io](https://authplay.io/) responds with HTTP 200 |
| [ProtocolSoup: interactive sandbox for OAuth, OIDC, SAML and more](https://news.ycombinator.com/item?id=46615649) | 2026-01-14 | 4 points, 0 comments | [HTTP 200](https://protocolsoup.com/) |
| [Toolkit: visual simulators for protocols, including OAuth](https://news.ycombinator.com/item?id=47301023) | 2026-03-08 | 6 points, 1 comment | [No response](https://toolkit.whysonil.dev/) on a single attempt; could be temporary |
| [AAuth interactive knowledge graph](https://news.ycombinator.com/item?id=47877287) | 2026-04-23 | 3 points, 0 comments | [HTTP 200](https://mcp-shark.github.io/aauth-explorer/) |
| [OAuth 2.0 Flows, workflows.guru](https://news.ycombinator.com/item?id=44154281) | 2025-06-01 | 19 points, 1 comment | [HTTP 200](https://www.workflows.guru/resources/oauth2-flows-explained) |
| [Flavors of OAuth: A Visual Tasting Menu](https://news.ycombinator.com/item?id=41466923) (video) | 2024-09-06 | 5 points, 0 comments | [Retitled, 62,229 views](https://www.youtube.com/watch?v=tpIXmmV4ib4) |
| [OAuth Explained repo](https://news.ycombinator.com/item?id=43759135) | 2025-04-22 | 5 points, 0 comments | [68 stars, last push 2025-05-07](https://github.com/LukasNiessen/oauth-explained) |

HTTP 200 shows only that a site is still online, not that it is maintained or used. I did not open these sites, so I have not confirmed their formats. The workflows.guru page in particular may be a static article, not a tool.

**Explicit requests**
- [Ask HN: Recommendations for a comprehensive and deep guide to OAuth?](https://news.ycombinator.com/item?id=32519082) (2022): 4 points, 1 comment. The poster says docs are not how they learn best and that they need the workflows and terminology first.
- [Ask HN: Why is OAuth still hard in 2023?](https://news.ycombinator.com/item?id=36090465): 4 points, 3 comments.
- [Ask HN: Cookies vs. JWT vs. OAuth](https://news.ycombinator.com/item?id=16517412) (2018): 260 points, 93 comments. This asks for a decision, not a visual explainer, but shows interest in the choice itself.

**Scattered favourable comments (each is one person)**
- [There ought to be a gamified way to make OAuth stick](https://news.ycombinator.com/item?id=42843464) (2025).
- [A crude animated GIF or slideshow would have helped](https://news.ycombinator.com/item?id=45018604) (2025).
- [Sites that walked through the process one step at a time got one implementer through it](https://news.ycombinator.com/item?id=47097501) (2026).
- [Interactive explainers stick better than RFCs, and the visual redirect flow was bookmarked](https://news.ycombinator.com/item?id=47301091) (2026). This is the sole comment on a Show HN, from a little-known account, and it reads like general encouragement, so I give it little weight.

**Weak negative searches**
- HN comment searches returned very little: [OAuth interactive visualization](https://hn.algolia.com/api/v1/search?query=OAuth%20interactive%20visualization&tags=comment) 1 hit, [OAuth animated diagram](https://hn.algolia.com/api/v1/search?query=OAuth%20animated%20diagram&tags=comment) 0. These searches match all terms, so differently worded comments would be missed.

**Why low HN scores are weak evidence**
- Okta's guide itself got [3 points](https://news.ycombinator.com/item?id=21313826) and [5 points](https://news.ycombinator.com/item?id=21321394) on its first two submissions, days before [431](https://news.ycombinator.com/item?id=21352045). A single low score mostly reflects timing and luck.
- Parecki's work also scored [4 points](https://news.ycombinator.com/item?id=14733913) despite its standing.

### Inferences
- The contrast between essays and tools is suggestive. Every OAuth explainer I found with hundreds of points is an article, and every self-described interactive tool I found stayed in single digits. The sample is small, and as far as these searches show, each tool had just one submission.
- A launch as a strong essay with embedded interactive parts seems more likely to travel on HN than a Show HN for a tool. This is my inference and I have not tested it.
- The evidence does not show that people want an interactive site specifically. It shows they want explanations, and a handful mention animation or stepping through.

### Gaps
- Reddit was not read, so launches and requests there are unknown (see above). Product Hunt, X and LinkedIn were not checked either.
- No traffic or usage data for any launched tool. HN points cannot show whether a tool found a quiet audience through search.
- Quality and scope of these tools belong to the interactive-playground researcher.

## Is there evidence of an audience beyond developers?

### Takeaway
There is some, but it is thin and mostly anecdotal. Internal enablement and security staff have the best support, with first-hand accounts of training and of security people struggling. Product managers have a few supply-side signals and no evidence of demand.

### Cited Findings

**Internal enablement and IT generalists**
- One HN commenter [taught hundreds of developers within an employer's ecosystem through classes and labs](https://news.ycombinator.com/item?id=35721079). They [describe IT generalists meeting OAuth out of necessity when management buys a platform that must be integrated](https://news.ycombinator.com/item?id=35722151).
- [Codecentric's Florian Wiech (2022)](https://www.codecentric.de/wissens-hub/blog/my-keycloak-learning-journey) describes learning Keycloak with the help of an internal Keycloak Fundamentals workshop. He says the docs do not explain IAM or how OIDC works internally, and that a Keycloak book's OAuth2 coverage was not enough for him.
- [A 2023 retrospective by brandur](https://brandur.org/atoms/gkoxmy2) describes Keycloak as a black box operationally when things went wrong, with documentation too thin to integrate features without trial and error.
- Practitioners keep building their own talks and slides: [a 2018 conference talk](https://news.ycombinator.com/item?id=41459395), [a 2023 talk on OAuth vs OIDC](https://news.ycombinator.com/item?id=35721491), and [personal slide decks](https://news.ycombinator.com/item?id=45014923).
- One commenter [says colleagues' eyes glaze over when security reasoning is explained, so it is easier to mandate OAuth and a library](https://news.ycombinator.com/item?id=18981415). This suggests explaining fails as often as it succeeds in teams.

**Security staff**
- The [application security practitioner](https://news.ycombinator.com/item?id=36490346) mentioned above.
- A [cybersecurity manager](https://news.ycombinator.com/item?id=45017889) describes investigations lacking information because of what gets logged, which is an operations angle rather than a comprehension one.
- [PortSwigger's OAuth vulnerabilities material](https://portswigger.net/web-security/oauth) drew [HN 174/67 in 2021](https://news.ycombinator.com/item?id=26603259), showing interest in the security angle (metadata only).

**Administrators**
- One commenter [says OAuth is more confusing than SAML from an administration and user perspective](https://news.ycombinator.com/item?id=41038639), and has [said similar about OIDC and OAuth in general](https://news.ycombinator.com/item?id=41678287).

**Product and project managers**
- [Department of Product's OAuth explainer](https://departmentofproduct.substack.com/p/oauth-explained) (Rich Holmes, 2024-10-20) targets product teams and business staff. It is paywalled, and I could not confirm its engagement numbers.
- [Parecki's book](https://oauth2simplified.com/) lists project managers among its audience, alongside developers and architects.
- A very small [Show HN explaining tech terms such as SSO to sellers and marketers](https://news.ycombinator.com/item?id=7218563) scored 1 point in 2014.

**End users, a different audience**
- A commenter [describes a consent dialog costing a 30-minute phone call with ageing parents](https://news.ycombinator.com/item?id=37034836), and [another found consent prompts confusing even personally](https://news.ycombinator.com/item?id=26606838). These concern consent screens rather than learning the protocol.

### Inferences
- The clearest case for a non-public audience is the requester's own: a team expert who presents repeatedly. The evidence shows this kind of person exists (trainers, talk-givers, slide-deck authors), but not how many there are or whether they would adopt a shared tool.
- "One expert teaching colleagues at several levels" may be a better first target than "the OAuth-curious public". It sidesteps the HN launch problem and matches the only success story with detail (the use-case menu). It is also a narrow base of one anecdote plus the requester's own need.
- Internal use could justify the project even if public demand never appears. That is a judgement for the report writer to weigh.

### Gaps
- No survey or data on how many security, product or support staff need OAuth knowledge, or whether teams would pay for enablement.
- **Keycloak community forum not verified.** [Book, course or tutorial?](https://forum.keycloak.org/t/book-course-or-tutorial/21106) and [Feedback re: dealing with Keycloak experience](https://forum.keycloak.org/t/feedback-re-dealing-with-keycloak-experience/3625) look directly relevant, and search snippets suggest users find the guides thorough but hard to learn from. The forum refused the fetch (403), so I report no content from them. They are worth reading by hand.
- **Unopened leads from search only:** [a non-technical-stakeholder interview question](https://dataford.io/questions/can-you-explain-how-oauth-20-works-to-a-non-technical-stakeholder), and [hoop.dev on OAuth runbooks for non-engineering teams](https://hoop.dev/blog/oauth-2-0-runbooks-for-non-engineering-teams-2), which looks like vendor SEO content. Neither should count as evidence.
- Pragmatic Web Security's team or enterprise terms could not be confirmed from the pages I opened.
