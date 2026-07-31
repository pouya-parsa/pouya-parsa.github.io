# Visual Distribution Anchoring Paper Page Design

**Date:** July 30, 2026

**Paper:** “Visual Distribution Anchoring for Efficient Prompt Tuning”

**Public route:** `https://pouya-parsa.github.io/visual-distribution-anchoring/`

## Goal

Publish a focused visual project page for Pouya Parsa’s new Visual Distribution
Anchoring (VDA) preprint, promote it from the portfolio homepage, and give it
the same Google discovery, Cloudflare analytics, and daily monitoring coverage
as the existing Cloud Drive paper page.

The page will be based only on claims and assets in `kdd_prompt_tuning_.zip`.
The archive, manuscript sources, internal experiment notes, and manuscript PDFs
will not be published or committed.

## Publication Status and Public Claims

The page will describe the work as:

- “Preprint · July 2026”
- authored by Pouya Parsa, Raoof Zare Moayedi, and Seongjin Choi; and
- affiliated with the University of Minnesota.

The page will not claim acceptance or publication at KDD 2027. It will not
include a paper-download button, arXiv link, DOI, arXiv identifier, conference
identifier, or PDF metadata while arXiv is processing the manuscript.

When an arXiv URL becomes available, it can be added later without changing the
page architecture.

## Scope

The implementation will:

1. Add a new static paper page at `/visual-distribution-anchoring/`.
2. Add a 2026 homepage news item and a first publication entry for the paper.
3. Convert the manuscript’s method-board PDF into one optimized, accessible web
   image stored under `images/visual-distribution-anchoring/`.
4. Add page-specific CSS that follows the Cloud Drive paper-page conventions
   while establishing a distinct VDA visual identity.
5. Add canonical, social, citation, and structured scholarly metadata.
6. Add the canonical page to `sitemap.xml`.
7. Add the page to the daily SEO/GEO audit and mobile Lighthouse runs.
8. Include the new route in the existing site-action analytics normalization so
   Cloudflare-backed action reporting recognizes it.
9. Add tests for content, metadata, discovery, monitoring, and artifact hygiene.
10. Ignore the source archive and any root-level files that could be unpacked
    from it.

The implementation will not:

- publish either manuscript PDF;
- unpack the complete archive into the repository;
- add an interactive simulator;
- add a framework, build system, dependency, database, or server-side endpoint;
- invent results, claims, links, identifiers, or publication status; or
- change the Cloud Drive article’s content or visual design.

## Page Architecture

The page will be a semantic, progressively enhanced static HTML article. All
meaningful content will be readable without JavaScript. The existing shared
site-action script may be loaded for link analytics, but the page will not
require a page-specific controller.

The route will contain:

### 1. Paper Hero

The centered hero will include:

- a small “Research preprint” label;
- the complete paper title;
- the three authors, with Pouya Parsa emphasized;
- University of Minnesota;
- “Preprint · July 2026”; and
- links to “Method,” “Results,” and “Portfolio.”

There will be no disabled or placeholder paper button. Omitting the resource is
clearer and avoids exposing a private or unstable manuscript URL.

### 2. Research Overview

The manuscript’s method-board figure will appear immediately after the hero as
the visual overview. Its caption and alt text will explain the three-stage
flow:

1. frozen source and domain priors;
2. offline adaptation using a disjoint unlabeled target pool; and
3. ordinary inference with a cached classifier on disjoint test data.

The page will use a responsive WebP or PNG rendering rather than embedding the
source PDF. The browser image will preserve the figure’s labels and colored
stage boundaries at desktop and mobile widths.

### 3. Core Idea

A concise answer section will explain that class names identify semantic
identity but not target-domain appearance. VDA estimates class-correlated visual
prototypes from an unlabeled target pool and uses them as conservative
corrections to a frozen semantic classifier.

### 4. Three-Stage Method

Three compact cards will describe:

- **Partition:** average frozen semantic and domain-template logits, then assign
  each target image to one class with hard argmax;
- **Anchor:** confidence-rank each predicted class bin, retain at most `K = 32`
  supports, and average normalized image features into a visual prototype; and
- **Fuse:** combine each prototype with the semantic classifier using one fixed
  global weight, producing a cacheable classifier.

This section will state the important exclusions from the manuscript: no target
labels, target-side optimization, uniform class-prior assumption, iterative
refinement, or access to evaluation queries.

### 5. Headline Results

A result band and accessible table will report only manuscript-supported
aggregate results:

| Semantic classifier | Base | + VDA | Gain | Datasets improved |
| --- | ---: | ---: | ---: | ---: |
| Zero-shot CLIP | 65.34 | 68.56 | +3.22 | 9/10 |
| TCP | 65.82 | 69.21 | +3.39 | 9/10 |
| MaPLe, 3 seeds | 66.25 ± 0.42 | 69.60 ± 0.22 | +3.35 ± 0.37 | 9/10 |
| PromptKD, 3 seeds | 70.80 ± 0.40 | 73.59 ± 0.28 | +2.79 ± 0.38 | 9/10 |

The TCP result will be the primary visual callout. Nearby copy will explain
that the main matched comparison improves the mean from `65.82%` to `69.21%`
and improves nine of ten target datasets.

### 6. Why It Works

This section will summarize the manuscript’s controlled findings:

- semantic and visual information are complementary;
- hard class correspondence matters more than generic target statistics;
- exact pseudo-label correctness is not the only measure of useful visual
  support; and
- the final classifier can remain fixed and cacheable after one offline pass.

The copy will distinguish matched comparisons from cross-architecture
attachments and will not imply identical optimization or inference budgets for
MaPLe or PromptKD.

### 7. Abstract

The complete author-written manuscript abstract will be visible as normal HTML
content. It will not be hidden behind a disclosure, tab, modal, or client-side
interaction. This supports both readers and scholarly crawlers.

### 8. Limitations

A short limitations section will disclose that VDA depends on:

- a representative unlabeled target-training pool;
- a manually specified coarse domain description;
- CLIP visual space in the reported experiments;
- adequate predicted support for difficult classes; and
- a fixed global fusion weight.

The section will also state that the experiments do not establish transfer to
arbitrary backbones.

### 9. Footer

The footer will link back to the portfolio and identify the page as a July 2026
preprint project page. It will not contain citation copy or download controls
until a public paper identifier exists.

## Visual Direction

The page will preserve the strongest Cloud Drive conventions:

- centered academic hero;
- restrained system typography;
- narrow reading width;
- pill-shaped navigation links;
- sticky section navigation;
- accessible semantic sections;
- generous whitespace; and
- responsive, performance-conscious media.

It will differ from Cloud Drive through:

- deep indigo as the primary color;
- lavender for frozen-prior and semantic elements;
- warm orange for offline target adaptation;
- softly tinted panels derived from the method figure;
- a more asymmetric overview/result layout;
- squared cards with clipped corner accents instead of uniformly rounded cards;
  and
- a shorter editorial rhythm with no simulator or figure gallery.

The source method figure will guide the palette so that the page and research
diagram read as one visual system.

## Responsive and Accessible Behavior

- The hero and body will remain readable from 320 px viewport width upward.
- Multi-column sections will collapse into one column on narrow screens.
- The result table will use an accessible overflow container rather than
  shrinking text below a readable size.
- The sticky section navigation will scroll horizontally when necessary.
- All links and focusable elements will have visible focus states.
- Color will not be the only way the three method stages are identified.
- The overview image will have meaningful alt text, explicit dimensions, and a
  lightweight file size.
- Reduced-motion preferences will be respected; no essential content will
  depend on animation.

## Homepage Integration

The homepage will receive:

- a new first 2026 news item announcing the VDA preprint and linking to the
  project page; and
- a new first publication article containing the full title, authors,
  “Preprint, July 2026,” a concise result-oriented summary, and an “Explore the
  project page” link.

No “Read the paper” link will be rendered until arXiv is public.

The Cloud Drive news item and publication will remain immediately below the new
VDA entries.

## Search and Scholarly Discovery

The page head will include:

- a unique descriptive `<title>`;
- a concise description based on the manuscript abstract;
- `robots` set to `index, follow, max-image-preview:large`;
- canonical URL
  `https://pouya-parsa.github.io/visual-distribution-anchoring/`;
- Open Graph and Twitter metadata using the optimized method overview image;
- `citation_title`;
- one `citation_author` tag per author;
- `citation_publication_date` set to `2026/07/30`; and
- no `citation_pdf_url`, `citation_arxiv_id`, or invented identifier.

JSON-LD will use an `@graph` containing:

- a `ScholarlyArticle` with the paper title, description, date, canonical URL,
  authors, keywords, and overview image;
- the existing stable `Person` identity at
  `https://pouya-parsa.github.io/#pouya-parsa`; and
- a `BreadcrumbList` connecting the homepage to the VDA page.

The `ScholarlyArticle` will not include `sameAs`, `identifier`, or `encoding`
until a public paper record exists.

The canonical URL will be added exactly once to `sitemap.xml`. `robots.txt`
already allows all crawlers and declares the canonical sitemap, so it requires
no content change.

These measures make the page crawlable and eligible for discovery; they do not
claim or guarantee when Google will index or rank it.

## Cloudflare Analytics and Daily Monitoring

The existing custom action-tracking script sends selected interactions to the
Cloudflare Worker. Its page-path normalization will recognize:

- `/visual-distribution-anchoring/`; and
- `/visual-distribution-anchoring/index.html`.

The new homepage and page links will reuse the existing
`interactive_article` action event. Cloudflare’s site-wide traffic collection
and the existing traffic report already aggregate arbitrary top paths, so the
new canonical page will appear naturally once it receives traffic.

The deterministic site policy will add the VDA page as a monitored
`ScholarlyArticle`, without requiring an arXiv identifier or PDF URL. The audit
implementation will support scholarly pages whose public identifiers are
intentionally absent.

Daily monitoring will cover:

- live HTTP availability;
- canonical and sitemap identity;
- Googlebot, OAI-SearchBot, and PerplexityBot access;
- social and scholarly metadata;
- stable author attribution;
- internal image and fragment availability;
- mobile Lighthouse SEO, accessibility, best practices, and performance; and
- Search Console and Cloudflare reporting through the existing traffic job.

The VDA canonical URL will be included in Lighthouse collection and summary
expectations.

## Artifact Hygiene

The implementation will inspect files from `kdd_prompt_tuning_.zip` without
unpacking the archive into tracked repository paths. Only the method-board PDF
will be extracted to a temporary directory for conversion to a web image.

`.gitignore` will receive explicit root-level patterns for the archive’s source
and build artifacts:

- `/kdd_prompt_tuning_.zip`
- `/main.tex`
- `/refs.bib`
- `/experiment_plan.md`
- `/cvpr.sty`
- `/ieee_fullname.bst`
- `/ACM-Reference-Format.bst`
- `/acmart.cls`
- `/related_work.tex`
- `/introduction.tex`
- `/method.tex`
- `/experiments.tex`
- `/closing_sections.tex`
- `/main.pdf`
- `/main-citations-verified.pdf`
- `/method-pages.txt`
- `/figs/`

The patterns are root-scoped so existing website PDFs, `docs/`, CSS, and images
remain tracked. The final commit will be reviewed with `git status` and
`git diff --cached` to ensure no archive, manuscript source, internal note, or
manuscript PDF is staged.

## Files and Responsibilities

- `visual-distribution-anchoring/index.html`: all semantic page content and
  metadata.
- `css/visual-distribution-anchoring.css`: the page-specific visual system and
  responsive behavior.
- `images/visual-distribution-anchoring/method-overview.webp`: optimized
  manuscript overview image.
- `index.html`: homepage news and publication additions.
- `.gitignore`: explicit archive and manuscript-artifact exclusions.
- `sitemap.xml`: canonical discovery entry.
- `monitoring/site-policy.mjs`: monitored VDA scholarly-page contract.
- `scripts/site-analytics.mjs`: VDA route normalization for Cloudflare-backed
  action events.
- `lighthouserc.cjs`: VDA mobile Lighthouse collection.
- `scripts/lighthouse-summary.mjs`: expected VDA Lighthouse report count.
- `tests/site-content.test.js`: page, homepage, metadata, sitemap, and artifact
  assertions.
- `tests/site-analytics.test.mjs`: VDA path normalization and action payload
  assertions.
- `tests/site-audit-core.test.mjs`: VDA policy and identifier-optional scholarly
  audit coverage.
- `tests/site-audit-live.test.mjs`: VDA page and internal-image live-audit
  fixtures.
- `tests/monitoring-config.test.mjs`: VDA Lighthouse and workflow coverage.
- `tests/fixtures/monitoring-site.mjs`: valid VDA fixture markup and sitemap
  data.

Tests may be consolidated into the existing files where that keeps the current
test organization clearer. No new production dependency is required.

## Verification

Implementation is complete only when:

1. the new page renders correctly from a local HTTP server at desktop and mobile
   widths;
2. the method overview remains legible and within its performance budget;
3. the homepage links to the page from both News and Publications;
4. no public PDF, arXiv, DOI, or KDD acceptance claim appears;
5. the canonical URL appears once in the sitemap;
6. the page passes the deterministic local site audit;
7. the full Node test suite passes;
8. mobile Lighthouse meets the repository’s existing thresholds;
9. the staged diff contains no ZIP, LaTeX source, experiment notes, manuscript
   PDF, or unrequested archive artifact; and
10. the new page is committed with its web assets, tests, discovery metadata,
    and monitoring configuration.
