# Format benchmark: what standout visual explainers do, what they cost, and how to build an interactive sequence-diagram site

All counts were read on 2026-10-30. HN points come from the hn.algolia.com API; each link goes to the HN item. GitHub stars and push dates come from the GitHub API. npm data comes from `npm view`. Figures quoted from long pages were extracted through a summarising fetch tool, so check exact numbers and quotes against the source before publishing them.

## What are the benchmarks, and how were they received?

### Takeaway
Protocol explainers top out around 400 to 600 HN points (Illustrated TLS 568, How HTTPS Works 466, Raft 411), while Ciechanowski's mechanical pieces reach 2,000 to 4,300. The static Illustrated Transformer drew 500 points seven years after publication, so clarity sets the bar more than interactivity does. None of the benchmarks I could open uses a sequence diagram as its core medium, so that format is unproven at this level.

### Cited Findings

**Reach**

| Explainer | Format | Best HN results | Other signals |
|---|---|---|---|
| Bartosz Ciechanowski | Long articles with custom interactive demos | [Mechanical Watch 4,298](https://news.ycombinator.com/item?id=31261533), [Moon 3,128](https://news.ycombinator.com/item?id=42443229), [Sound 3,053](https://news.ycombinator.com/item?id=33249215), [Bicycle 3,014](https://news.ycombinator.com/item?id=35343495), [GPS 2,900](https://news.ycombinator.com/item?id=29981188) | [547 paid Patreon members](https://www.patreon.com/ciechanowski) |
| LLM Visualization (Bycroft) | 3D step-through of a GPT-style model | [1,592 (Dec 2023)](https://news.ycombinator.com/item?id=38505211), [640 (Sep 2025)](https://news.ycombinator.com/item?id=45130260) | [5,580 stars](https://github.com/bbycroft/llm-viz) |
| Sam Rose (samwho.dev) | Animated, interactive essays | [Memory Allocation 1,360](https://news.ycombinator.com/item?id=36029087), [Load Balancing 1,143](https://news.ycombinator.com/item?id=35588797), [Big O 691](https://news.ycombinator.com/item?id=45002182) | [376 stars on the code repo](https://github.com/samwho/visualisations) |
| Red Blob Games (Amit Patel) | Interactive guides | [Draggable Objects 1,059](https://news.ycombinator.com/item?id=37703291), [Hexagons 709 (2013)](https://news.ycombinator.com/item?id=5809724), [A* 509 (2014)](https://news.ycombinator.com/item?id=8059237) | Same pages keep re-ranking, e.g. [A* 288 (2025)](https://news.ycombinator.com/item?id=44296523) |
| Josh Comeau | Interactive tutorials in MDX | [CSS Gradients 1,075](https://news.ycombinator.com/item?id=29894608), [Flexbox 813](https://news.ycombinator.com/item?id=33718508), [SVG Paths 455](https://news.ycombinator.com/item?id=44941605) | Not checked |
| Distill | Interactive machine learning journal | [About page 930](https://news.ycombinator.com/item?id=13915808), [Research Debt 508](https://news.ycombinator.com/item?id=13932806), [Momentum 503](https://news.ycombinator.com/item?id=14034426) | [GNN intro 362 in Dec 2024](https://news.ycombinator.com/item?id=42468214), three years after publication |
| Explorabl.es | Directory of explorables | [894 (Feb 2020)](https://news.ycombinator.com/item?id=22368323) | Page shows [no dates](https://explorabl.es/) |
| Illustrated TLS (Michael Driscoll) | Byte-level annotated handshake | [TLS 1.3 568 (2018)](https://news.ycombinator.com/item?id=18400158), [278 (2022)](https://news.ycombinator.com/item?id=32333115), [TLS 1.2 133 (2020)](https://news.ycombinator.com/item?id=24167873) | Stars: [TLS 1.2 3,513](https://github.com/syncsynchalt/illustrated-tls12), [TLS 1.3 921](https://github.com/syncsynchalt/illustrated-tls13), [QUIC 243](https://github.com/syncsynchalt/illustrated-quic), [DTLS 26](https://github.com/syncsynchalt/illustrated-dtls) |
| The Illustrated Transformer (Alammar, June 2018) | Static article with GIFs, no built-in interactivity | [500 (Dec 2025)](https://news.ycombinator.com/item?id=46357675), [162 (Jul 2024)](https://news.ycombinator.com/item?id=40861148) | [13 translations; lists courses at Stanford, Harvard, MIT, Princeton, CMU](https://jalammar.github.io/illustrated-transformer/) |
| How HTTPS Works (DNSimple) | Web comic | [466 (2020)](https://news.ycombinator.com/item?id=24476469), [174 (2023)](https://news.ycombinator.com/item?id=37532736), [163 (2018)](https://news.ycombinator.com/item?id=17932728) | [Five episodes, translated](https://howhttps.works/) |
| The Secret Lives of Data (Raft) | Animated step-through of one protocol | [411 (2022)](https://news.ycombinator.com/item?id=32484584), [238 (2020)](https://news.ycombinator.com/item?id=25326645), [235 (2024)](https://news.ycombinator.com/item?id=41669850) | [3,624 stars](https://github.com/benbjohnson/thesecretlivesofdata) |
| Transformer Explainer (Georgia Tech) | Live GPT-2 in the browser | [105 (Aug 2024)](https://news.ycombinator.com/item?id=41221718) | [9,071 stars](https://github.com/poloclub/transformer-explainer); authors report [over 490,000 users, IEEE VIS 2024 Best Poster, CHI 2026 full paper](https://arxiv.org/abs/2408.04619) |
| CryptoHack | Gamified challenges, not an explainer | [52 (2021)](https://news.ycombinator.com/item?id=28180252), [20 (2020)](https://news.ycombinator.com/item?id=22806515) | [Active: solves timestamped 2026-10-30; no user count given](https://cryptohack.org/) |

**The "visual guide to transformers"**
- I found no canonical page with that exact title. The likely candidates are Alammar's post, Transformer Explainer, Bycroft's LLM Visualization, and 3Blue1Brown's lesson, whose text uses the wording ["A visual introduction to transformers"](https://www.3blue1brown.com/lessons/gpt) (April 2024, video plus text).

**What the good ones do**
- Ciechanowski builds bottom-up, one subsystem per section, alternating short prose with a demo the reader drags or slides. He starts from physical behaviour and moves to rules. Mechanical Watch has roughly 30 demos (my tool's estimate) and color-codes part names so readers need not memorise terms — [Mechanical Watch](https://ciechanow.ski/mechanical-watch/)
- Sam Rose opens each section with a limitation of the previous approach (round robin, then weighted, then dynamic weighted, then least connections, then PEWMA), ends with a playground, and states what the simulation omits — [Load Balancing](https://samwho.dev/load-balancing/)
- Illustrated TLS uses a real connection. The repo holds client, server, packet captures, and an OpenSSL patch that "removes any random aspects," so readers can reproduce every byte — [README](https://github.com/syncsynchalt/illustrated-tls13). The author also uses it as his own reference: "it's a great way to remind myself of some detail of the protocol" — [syncsynchalt on HN](https://news.ycombinator.com/item?id=31121681)
- Transformer Explainer runs a real model on the reader's own input, with temperature and sampling controls and live values — [site](https://poloclub.github.io/transformer-explainer/)
- Nicky Case's method: make the reader care about a question, climb the ladder of abstraction from concrete experience, link points with "BUT" and "THEREFORE," and end with a sandbox. He offers no evidence and says there are no "plug-and-chug formulas" — [How I Make an Explorable Explanation](https://blog.ncase.me/how-i-make-an-explorable-explanation/)

**Criticism of a benchmark**
- In the December 2025 thread on The Illustrated Transformer, praise includes "This aged like fine wine" (oofbey). Critics say word-based pictures mislead (ozgung) and that knowing the architecture "wasn't very useful at all" for applying LLMs (libraryofbabel) — [HN thread](https://news.ycombinator.com/item?id=46357675)

### Inferences
- A realistic HN target for a strong protocol explainer is 400 to 600 points, not Ciechanowski's numbers. The sample is small and HN skews towards developers, though that is also the likely audience.
- HN points are not a proxy for total reach: Transformer Explainer has only 105 points but 9,071 stars and a claimed 490,000 users.
- Sequels decay. Illustrated TLS stars fall from 3,513 to 26 across its later protocol pages, which suggests a second or third flow earns far less attention than the first, although QUIC and DTLS are also more niche topics.
- The requester's "more varied than transformers" point has support. Driscoll said the happy path alone is ["400kb of HTML"](https://news.ycombinator.com/item?id=18201894) and left out client certificates because they would make the document "even longer and denser." A linear page cannot absorb variants; that is the gap toggles would fill.

### Gaps
- The FT piece ("Generative AI exists because of the transformer") could not be fetched. It got [2 HN points](https://news.ycombinator.com/item?id=37612287), which says little about a newspaper feature.
- I read only the Raft site's home page, not its JavaScript player. "Animated step-through" comes from HN titles.
- Backlink and traffic data are unavailable, apart from the authors' own figures.

## Do they use layered depth, and do simple/advanced toggles work?

### Takeaway
None of the benchmarks I opened has a global simple/advanced mode. They layer depth through ordering (concrete to abstract), expansion in place, and separate companion pages. Research strongly supports giving novices and experts different levels of assistance, but learner control on average shows almost no effect, and I found no study testing a self-selected mode toggle directly.

### Cited Findings

**How each one handles depth**
- Ciechanowski: no modes. The only toggle is a global animation pause, and the same content serves everyone — [Mechanical Watch](https://ciechanow.ski/mechanical-watch/)
- Alammar: linear progression from a "single black box" to matrix detail, openly saying he will "oversimplify things a bit" — [post](https://jalammar.github.io/illustrated-transformer/)
- Josh Comeau: no level labels. Static callouts carry edge cases, prompts ask readers to predict first, and the intro addresses "a CSS beginner" and multi-year users alike — [Flexbox guide](https://www.joshwcomeau.com/css/interactive-guide-to-flexbox/). He also splits content and writes shorter "precursor" posts so advanced readers can skip the basics — [authoring process](https://www.joshwcomeau.com/email/authoring-process/)
- Illustrated TLS: annotated hex per record, with "Open All" and "Show Code" controls and companion pages — [site](https://tls13.xargs.org/). Key exchange "still interrupted the flow," so he moved it to its own interactive page — [syncsynchalt on HN](https://news.ycombinator.com/item?id=31275849)
- Sam Rose: one build-up path, with the playground at the end for advanced exploration — [Load Balancing](https://samwho.dev/load-balancing/)
- Red Blob: pointer-driven diagrams, a local selector ("Pick a grid type to see the corresponding code"), and a separate implementation guide. I found no global switch — [Hexagons](https://www.redblobgames.com/grids/hexagons/)
- Transformer Explainer: explicit "progressive disclosure," with structure first and math revealed on interaction, to avoid "overwhelming users." After consulting ML instructors, the authors cut layer norm, residuals, activations and dropout from the main explanation — [CHI 2026 paper](https://arxiv.org/html/2408.04619v2)
- Outside the benchmarks, the young [Token Journey](https://github.com/joevanhorn/token-journey) does have a two-view switch (Narrative and Technical). It has 0 stars, so it is no evidence that the pattern works.

**Learning evidence, strongest first**
- Expertise reversal, meta-analysis of 60 experiments and 5,924 participants: low prior knowledge learners do better with high assistance (d = 0.505), high prior knowledge learners with low assistance (d = −0.428). The authors call it robust but asymmetric: "providing novices with assistance has a stronger effect than withholding assistance from experts" — [Tetzlaff et al. 2025, abstract via OpenAlex](https://api.openalex.org/works/doi:10.1016/j.learninstruc.2025.102142)
- Learner control, meta-analysis of 18 studies: overall g = 0.05, "almost zero"; effects are "neither powerful nor consistent" and larger for behavioural than academic outcomes, though both small — [Karich et al. 2014, abstract via OpenAlex](https://api.openalex.org/works/doi:10.3102/0034654314526064); [EdWeek summary](https://edweek.org/leadership/review-casts-doubt-on-importance-of-learner-control-in-computerized-instruction/2014/05)
- Animation versus static graphics, 61 studies and N = 7,036: g = 0.226 overall, with system-paced g = 0.309, auditory commentary g = 0.336 and no accompanying text g = 0.883 reported as moderators — [Berney & Bétrancourt 2016](https://archive-ouverte.unige.ch/unige:92234)
- Interactive articles: a review by proponents concedes "limited empirical evaluation." It says animation suits state transitions and causality, though animation versus good static graphics is debated. Segmenting is supported by "multiple studies." McKenna et al. found preference for step or scroll layouts over static but no significant engagement difference between the two; Zhi et al. found better comprehension in slideshow than vertical scroll. Both studied desktop users — [Hohman et al. 2020](https://distill.pub/2020/communicating-with-interactive-articles/)
- Direct test of an explorable: Transformer Explainer, between-subjects, n = 90 after 38 exclusions, quiz accuracy 73.3% versus 59.5% (blog) and 61.9% (video), p = 0.021. It lasted one session with an immediate post-test only, used self-selected Prolific participants, reported no effect sizes, and was evaluated by its own builders. The video group reported similar understanding despite lower scores, which the authors call "illusory understanding." A separate 145-person study found 74% preferred it to a blog post — [CHI 2026 paper](https://arxiv.org/html/2408.04619v2)
- Foundational advocacy has no evidence behind it. Bret Victor's 2011 essay presents none, and his 2024 postscript says most articles using the term "are pedagogical," which is not quite what he meant — [Explorable Explanations](https://worrydream.com/ExplorableExplanations/)

### Inferences
- A depth mode is defensible, but the evidence supports the need for levels, not the mechanism of a self-selected switch. People may also misjudge their own level; note the "illusory understanding" result.
- Default to the high-assistance view. The Tetzlaff asymmetry suggests extra help costs experts less than missing help costs novices.
- Separate two ideas the brief merges. **Scenario toggles** (PKCE on or off) change the content and teach by contrast. **Depth controls** (simple or advanced) change how much is shown. Scenario toggles fit the claim that animation suits state transitions, but neither has been tested in this form.
- Prefer per-message expansion to a page-wide mode. Expert readers can use "Open All," as Illustrated TLS does.
- Build in prompts to predict the next message. Comeau's pages and the "illusory understanding" finding both point to passive watching as the risk, though this is a judgement rather than a tested result for this format.

### Gaps
- I found no study of a simple/advanced toggle on an explanatory page, and no public analytics on how many readers use such toggles.
- The Tetzlaff abstract sorts learners by assessed prior knowledge and does not address self-selected levels or web explainers. Karich's studies date from 1996 to 2012 and cover educational technology, not explanatory web pages.
- Hundhausen, Douglas & Stasko 2002 ([24 AV studies, per search listings](https://typeset.io/papers/a-meta-study-of-algorithm-visualization-effectiveness-2rfogtzhbq)) is often cited for the claim that how learners use a visualisation matters more than what they see. I could not open the abstract, so treat that claim as unverified.
- The segmenting meta-analysis (Rey et al. 2019) and the Ploetzner et al. 2021 reanalysis of animation studies were seen only as metadata or search snippets.

## What did they cost, and why did Distill stop?

### Takeaway
Almost no creator publishes hours. The available markers are months per article for Ciechanowski, over a year for Transformer Explainer, and more than 50 volunteer editor hours on some early Distill articles. Distill stopped because of the volunteer labour of running and mentoring a journal, and its editors explicitly recommended self-publication rather than abandoning the format.

### Cited Findings

**Distill**
- Hiatus announced 2 July 2021: "may be extended indefinitely." It says "the primary bottleneck is the amount of effort it takes to produce these articles," along with a rare mix of scientific and design skills — [Distill Hiatus](https://distill.pub/2021/distill-hiatus/)
- "Distill is volunteer run and these frictions have caused our team to struggle with burnout" — [Distill Hiatus](https://distill.pub/2021/distill-hiatus/)
- "For some of our early articles, we provided more than 50 hours of help with designing diagrams." This mentoring was "comparable to the work of writing a short article of one's own," and offering it to everyone who submitted was "overwhelming" — [Distill Hiatus](https://distill.pub/2021/distill-hiatus/)
- The editors do not blame the format: "the future for most types of articles is probably self-publication," which "allows for more innovation in the format," including interactive diagrams — [Distill Hiatus](https://distill.pub/2021/distill-hiatus/)
- The newest article on the front page is dated 2 Sept 2021, with no mention of a restart — [distill.pub](https://distill.pub/)
- Producing an interactive article is "closer to building a website than writing a blog post." Diagrams are often built individually from scratch, and it needs editorial, design and programming skills — [Hohman et al. 2020](https://distill.pub/2020/communicating-with-interactive-articles/)
- "Refinement of an idea can take just as much effort and deep understanding as the initial discovery" — [Research Debt](https://distill.pub/2017/research-debt/)

**Creators**
- Ciechanowski: "It's a weekend hobby of mine, so I only end up making a few articles per year" — [Patreon about](https://www.patreon.com/ciechanowski/about). The undated quote fits his earlier pace, not recent years. Gaps between articles ran about 2.5 to 5.5 months from 2020 to March 2023, then 11 and 10 months, and nothing is listed in the 22 months since Moon (Dec 2024) — computed from the [archive](https://ciechanow.ski/archives/). Funding is [547 paid members, from €3 per article](https://www.patreon.com/ciechanowski).
- Transformer Explainer: "over a year of iterative investigation and development," nine authors in an academic setting — [paper](https://arxiv.org/html/2408.04619v2)
- Amit Patel: "I collect notes for myself before I write an article, sometimes for years" — [amitp on HN](https://news.ycombinator.com/item?id=37710727). A unification of the hexagon page was something he "had been wanting to do for several years but I knew it would take a while" — [amitp on HN](https://news.ycombinator.com/item?id=37959612)
- Josh Comeau: no per-post figure. He once aimed for one post every two weeks and has about 80 posts — [authoring process](https://www.joshwcomeau.com/email/authoring-process/). The blog rebuild took "the past few months," each widget uses a reusable `<Demo>` shell, and he also runs a course platform — [How I Built My Blog v2](https://www.joshwcomeau.com/blog/how-i-built-my-blog-v2/). The Flexbox guide points readers to his paid course — [Flexbox guide](https://www.joshwcomeau.com/css/interactive-guide-to-flexbox/)
- Sam Rose: seven essays are listed between 2023 and August 2025, and the code "was largely rewritten in October 2026 to use Lit" — [README](https://github.com/samwho/visualisations); [blog index](https://samwho.dev/blog/)
- Illustrated TLS needed a working client and server, a patched OpenSSL, and captures on top of the page itself — [README](https://github.com/syncsynchalt/illustrated-tls13). He checked primitives against test vectors, using an IETF draft for TLS 1.3 — [syncsynchalt on HN](https://news.ycombinator.com/item?id=18407176)
- The only other single-protocol animated peer never expanded: The Secret Lives of Data still lists [Raft alone](https://thesecretlivesofdata.com/), and its [repo was last pushed in March 2023](https://github.com/benbjohnson/thesecretlivesofdata).

### Inferences
- The renderer is not the main cost. [Token Journey's viewer](https://github.com/joevanhorn/token-journey/tree/HEAD/viewer) is 26.5 KB of JS and 15.3 KB of CSS. Cost concentrates in the explanation, diagram design, per-flow accuracy checks, and revisions.
- Rough brackets for a solo part-time builder, all my estimate and not sourced: a first flow with real polish takes weeks to a few months; a multi-flow site with toggles and a depth layer is closer to a Transformer Explainer-scale year, minus its user studies.
- Sustainable models exist for this format: hobby plus patronage (Ciechanowski), marketing for a paid course (Comeau), and company marketing (DNSimple's comic). A protocol site could fit the last one.
- Distill's lesson for a solo project: the journal overhead is avoidable, while the effort per article is not.
- AI-assisted authoring may lower build cost. Sam Rose invites readers to [point an agent at his repo](https://github.com/samwho/visualisations), and [Cinegram](https://github.com/panset/cinegram) ships an authoring skill. I found no measured savings.

### Gaps
- I found no first-hand time-per-article figure from Ciechanowski, Rose, Comeau, Alammar or Driscoll. An [unsourced directory claim](https://unknownindex.com/tool/bartosz-ciechanowski) that Ciechanowski takes "months" is not reliable on its own.
- Patel's funding is not stated in the comments I searched.
- Dollar costs were not found for any project.

## Which explainers went stale, and how do protocols differ from timeless topics?

### Takeaway
Timeless topics keep earning traffic with little content upkeep, though code can still need rewriting. Protocol explainers rarely become wrong; they drift from what real systems do. Illustrated TLS still shows an X25519-only handshake while about 70% of browser traffic to Cloudflare uses hybrid ML-KEM. An OAuth site belongs in this second class and should plan for it.

### Cited Findings

**Timeless topics keep compounding**
- Old articles still rank in 2026: [Mechanical Watch (2022) 745 in June](https://news.ycombinator.com/item?id=48553550), [Internal Combustion Engine (2021) 334 in July](https://news.ycombinator.com/item?id=48746076), [Sound (2022) 273 in October](https://news.ycombinator.com/item?id=50045147).
- Red Blob's Hexagons page dates from March 2013 and was last modified 29 Sep 2026 — [page](https://www.redblobgames.com/grids/hexagons/). Patel calls it a ["living document"](https://news.ycombinator.com/item?id=37959612) and makes ["small changes all the time"](https://news.ycombinator.com/item?id=37710727).
- Code ages even when content does not. Sam Rose's Load Balancing moved from [PixiJS to a Lit component with SVG](https://samwho.dev/load-balancing/), and he keeps the old site at [old.samwho.dev](https://github.com/samwho/visualisations).

**Protocol and fast-moving topics**
- Illustrated TLS 1.3: the repo's `archive/` holds a previous version "based on a pre-production BoringSSL patch" — [README](https://github.com/syncsynchalt/illustrated-tls13). The eight latest commits (Aug 2023 to Jan 2026) are wording, typos, one small factual fix, a UI control and link removals — [commit history](https://github.com/syncsynchalt/illustrated-tls13/commits). A grep of the live page found X25519 mentions but none of ML-KEM, Kyber or post-quantum — [site](https://tls13.xargs.org/). Cloudflare reports "about 70% of browser-generated traffic" using hybrid ML-KEM — [Cloudflare, 29 Sept 2026](https://blog.cloudflare.com/post-quantum-visibility/). The page still documents a valid handshake, but no longer the typical browser one.
- A domain move from ulfheim.net to xargs.org was its own upkeep event — [syncsynchalt on HN](https://news.ycombinator.com/item?id=32413619).
- How HTTPS Works, sponsored by DNSimple, has kept up: its handshake now says "Nowadays, I prefer TLS 1.3" — [handshake episode](https://howhttps.works/the-handshake/) — and the site was [last updated 21 Aug 2025](https://howhttps.works/).
- The Illustrated Transformer was left mostly intact. Alammar added pointers to an expanded book chapter and a 2025 short course that brings it up to date — [post](https://jalammar.github.io/illustrated-transformer/).
- Distill's articles are frozen with the journal — [distill.pub](https://distill.pub/). The authors had already named archival maintenance, multi-device adaptation and accessibility as costs — [Hohman et al. 2020](https://distill.pub/2020/communicating-with-interactive-articles/).

**Tooling that went quiet**
- [Idyll](https://github.com/idyll-lang/idyll), the explorables framework, was last pushed in February 2023.
- [js-sequence-diagrams](https://github.com/bramp/js-sequence-diagrams) was last pushed in September 2022, and `npm view js-sequence-diagrams` returns a `0.0.1-security` placeholder.
- [ZenUml/core](https://github.com/ZenUml/core) is archived; [Code Surfer](https://github.com/pomber/code-surfer) was last pushed in May 2023.

### Inferences
- Staleness in OAuth is likely to take the Illustrated TLS form: flows remain correct but stop being recommended practice. That is worse for a teaching site than for a reference, because readers copy what they see.
- Three design consequences follow. Store flows as data, separate from rendering, so a spec change is a data edit. Stamp each flow with the spec version and a "last verified" date. Verify flows against a real authorization server, as Illustrated TLS verifies against a real connection.
- Keep dependencies few. Illustrated TLS [deploys as static files](https://github.com/syncsynchalt/illustrated-tls13/blob/HEAD/Makefile) and has needed only light upkeep since 2023. Rose rewrote his code about three and a half years after his first listed essay; he does not state why, but it shows that code can become its own project.
- Each toggle multiplies what has to stay correct, so the maintenance burden grows with the toggle count, not just the flow count.

### Gaps
- OAuth spec change rates are covered by another researcher.
- I found no postmortem from a protocol-explainer author on the cost of keeping up, and no measure of reader harm from a stale explainer.

## Which technical approaches are practical for an interactive, toggleable, animated sequence diagram site?

### Takeaway
No mature library does step-through plus composable toggles. Mermaid has no sequence animation, D2 has the closest variant model but only looping playback, and the Mermaid overlays that do step-through are months old with under 10 stars. The practical path is a small custom SVG renderer driven by flow data, plus a light animation library. The data-driven idea has partial precedents but no complete implementation that I could find.

### Cited Findings

**Text-to-diagram tools**

| Option | Status | Step-through and animation | Variants | Notes |
|---|---|---|---|---|
| [Mermaid](https://github.com/mermaid-js/mermaid) 12.2.0 | 90.9k stars, active | [Sequence docs mention no animation or stepping](https://mermaid.js.org/syntax/sequenceDiagram.html). [Flowchart edges only have `animate`](https://mermaid.js.org/syntax/flowchart.html). | `alt`, `opt`, `par`, `critical` frames draw branches but do not switch them | `mermaid.min.js` measured at 5.49 MB raw, 1.57 MB gzipped via jsDelivr |
| [D2](https://github.com/d2lang/d2) | 25.8k stars, pushed Oct 2026 | [`--animate-interval` plays boards in a loop; docs warn too many boards "may get confused"](https://d2lang.com/tour/composition-formats/) | [`layers`, `scenarios` (inherit from base), `steps` (inherit from previous)](https://d2lang.com/tour/composition/) | `@terrastruct/d2` npm package is 59.8 MB unpacked, last changed Aug 2025 |
| [PlantUML](https://github.com/plantuml/plantuml) | 13.4k stars, active | [`newpage` splits into images; animation not mentioned](https://plantuml.com/sequence-diagram) | None found | Static output |
| [js-sequence-diagrams](https://github.com/bramp/js-sequence-diagrams) | 7.8k stars, last push Sep 2022 | None built in | None | Do not use; see the npm placeholder above |
| [LikeC4](https://github.com/likec4/likec4) | 6k stars, active | [Walkthrough not on the page I read](https://likec4.dev/dsl/views/dynamic/) | [One dynamic view renders as `diagram` or `sequence`; flow control is "Experimental"; leaf elements only; no nested parallel](https://likec4.dev/dsl/views/dynamic/) | Aimed at architecture models |
| [Ilograph](https://www.ilograph.com/docs/editing/walkthroughs/) | Ilograph LLC; license not on the page | [Slides set text, select, highlight, expand, detail level, hide](https://www.ilograph.com/docs/editing/walkthroughs/) | [Sequences defined as data with `to`, `toAndBack`, `toAsync`](https://www.ilograph.com/docs/editing/perspectives/sequence-perspectives/) | [Cited in Mermaid #3029](https://github.com/mermaid-js/mermaid/issues/3029) as the model to emulate |

**Mermaid's animation limits in detail**
- [#3029](https://github.com/mermaid-js/mermaid/issues/3029), a request to step through sequence diagrams, has been open since May 2022. [#7710](https://github.com/mermaid-js/mermaid/issues/7710), asking for step-by-step display, has been open since May 2026; a maintainer replied only "An interesting idea" and asked how nodes would move.
- Ordered step animation was merged on 27 Oct 2026, for flowcharts only — [PR #8470](https://github.com/mermaid-js/mermaid/pull/8470). It postdates [release 12.2.0 (13 Oct)](https://github.com/mermaid-js/mermaid/releases).
- Rendered message lines do carry `data-et="message"`, `data-id`, `data-from` and `data-to` — [sequenceRenderer.ts, lines 570 to 573](https://github.com/mermaid-js/mermaid/blob/develop/packages/mermaid/src/diagrams/sequence/sequenceRenderer.ts). These are not on the docs page I read, so treat them as unstable. They explain why overlays are possible.

**Step-through and data-driven precedents**
- [SeqShow](https://github.com/KunxianWang/SeqShow) (MIT, 5 stars, created Oct 2026): steps through Mermaid source without a separate script. Each top-level `alt` gets its own Path selector, so it supports independent choices (its "Background job" example has two). Limits: alternatives cannot nest, conditions are not evaluated, loops show once, and changing a path returns to the overview. It keeps layout fixed, offers Focus dimming, and handles reduced motion and step announcements.
- [Cinegram](https://github.com/panset/cinegram) (MIT, 7 stars, created Aug 2026): Mermaid plus `scenario` blocks, with `stepwise` playback and sequence diagram support. `variant` and `until` let a scenario inherit a prefix from another, which is the nearest thing to one-flow-many-variants. It is a Go compiler that also runs in the browser via WASM.
- [Token Journey](https://github.com/joevanhorn/token-journey) (Apache-2.0, 0 stars, 2 commits, created Oct 2026): a [JSON format](https://github.com/joevanhorn/token-journey/blob/HEAD/docs/journey-format.md) with actors and steps, a zero-dependency viewer, Narrative and Technical views, and recorders that capture real runs. One trace describes one flow; it has no toggles. It is included here for format only.
- [mermaid-animated-sequence-diagrams](https://github.com/mostlyobvious/mermaid-animated-sequence-diagrams) (0 stars, June 2024): a one-file demo that relies on a patched Mermaid fork.
- [bpmn-js-token-simulation](https://github.com/bpmn-io/bpmn-js-token-simulation) (320 stars, active) is a related idea from another notation, described as a token simulator for BPMN. I read only its description.
- My GitHub searches for "sequence diagram player," "step by step," "walkthrough" and "animated sequence diagram" returned only SeqShow and a few zero-star projects, including two listed above.

**What the benchmarks actually use**
- Transformer Explainer: [Svelte and D3](https://arxiv.org/html/2408.04619v2), plus [GSAP, Tailwind and Vite](https://github.com/poloclub/transformer-explainer/blob/HEAD/package.json), with ONNX Runtime Web for the model.
- Sam Rose: [Lit, matter-js and Bun](https://github.com/samwho/visualisations/blob/HEAD/package.json), with SVG.
- Josh Comeau: [Next.js, MDX, React Spring and Framer Motion](https://www.joshwcomeau.com/blog/how-i-built-my-blog-v2/). He says "MDX remains the best solution I'm aware of for creating interactive content."
- Red Blob: uses IntersectionObserver ["to replace the static diagram with an interactive one"](https://news.ycombinator.com/item?id=19189050) as the reader arrives, and also to [delay diagram rendering](https://news.ycombinator.com/item?id=37959612).

**Animation and page libraries**
- [GSAP](https://github.com/greensock/GSAP) 3.15.0: 28 KB gzipped core, measured. ["100% free for all users"](https://gsap.com/pricing/) including plugins, and a Webflow product. I did not read its license terms, so check them.
- [Motion](https://github.com/motiondivision/motion) 14.9.0: 34.7k stars, active.
- [Scrollama](https://github.com/russellsamora/scrollama) 3.2.0: 6k stars, about 2 KB gzipped, measured. The repo was pushed in Nov 2025, and the npm package's last change was Oct 2022.
- [Astro](https://github.com/withastro/astro) (63.6k stars) and [Svelte](https://github.com/sveltejs/svelte) (88.5k stars) are both active. I did not find a benchmark built on Astro.
- Scrolling versus stepping has mixed evidence, covered in the depth section above; [Hohman et al.](https://distill.pub/2020/communicating-with-interactive-articles/) also suggest mobile readers may need swipe navigation.

### Inferences
- **Recommended stack (my judgement):** Astro with MDX for prose, one Svelte or vanilla SVG island for the diagram, GSAP or Motion for transitions, and flow definitions as typed data. Sequence layout is simple (lanes plus rows), which is why a custom renderer is small here even though it would not be for general graphs.
- **Why not Mermaid at runtime:** the single-file bundle is about 1.6 MB gzipped, its message hooks are undocumented, and I expect re-rendering on a toggle to make transitions between variants hard, because rows and IDs can shift (not tested). Generating Mermaid text from the flow data remains useful as a static export or for accessibility.
- **Stepper first, scroll second.** A sequence diagram needs a stable spatial frame, SeqShow's fixed layout reflects this, and Zhi's result leans the same way. Scrollama is a possible enhancement rather than the core.
- **Toggles in OAuth cut across messages,** which `alt` blocks cannot express. DPoP, for instance, adds to several steps, and PAR changes what travels on the front channel. Each step and field therefore needs its own condition:

```yaml
flow: authorization_code
toggles: [pkce, par, dpop]
steps:
  - id: par_push
    when: par
    from: client
    to: as
    label: POST /par
  - id: authorize
    from: browser
    to: as
    label: GET /authorize
    fields:
      - { name: request_uri, when: par }
      - { name: code_challenge, when: "pkce and not par" }
      - { name: redirect_uri, when: "not par" }
    depth: { simple: "Ask the user to sign in", advanced: "Full query string" }
```

- Stable step IDs let a toggle animate as a change (arrow slides in, row shifts) instead of a redraw. That direct "what changed" transition is the feature none of the precedents has, and arguably the site's main differentiator.
- Control the combination count. Three independent toggles already give eight variants, and D2's own docs warn about too many boards. Offer named presets (say, "SPA today," "high security") alongside free toggles, encode invalid combinations as constraints, and generate one test per valid combination.
- Plan accessibility and the fallback early: step text outside the SVG, reduced-motion support and keyboard control (all in SeqShow), plus a static render for print and search, following Red Blob's static-then-interactive approach. Wide diagrams on phones are a risk: Token Journey's format asks for lane labels under about 10 characters, and the scroll studies above were desktop-only.

### Gaps
- I did not run SeqShow, Cinegram, or Token Journey; their capabilities come from READMEs, and both SeqShow and Cinegram were promoted by their authors in the Mermaid thread. All three are young, so their survival is unknown.
- The D2 docs do not address `steps` combined with sequence diagrams, and I did not test it. I also did not check whether Ilograph walkthroughs work on sequence perspectives, or Ilograph's license and pricing. Its sequence syntax comes from search result text, not a page I opened.
- The 1.57 MB Mermaid figure is the single-file bundle; the ESM build loads chunks lazily, so real page weight may be lower. `@mermaid-js/tiny` was not measured.
- I found no implementation of composable independent toggles deriving a sequence diagram. GitHub search is not exhaustive, and the researcher covering OAuth tools may find OAuth-specific cases.
- A [gist combining js-sequence-diagrams with reveal.js fragments](https://gist.github.com/jzaeske/e2de8b14142818f8d8f5e74e8b6ae2b0) and a [JointJS sequence demo](https://resources.jointjs.com/demos/sequence) appeared only in search results and were not opened.
