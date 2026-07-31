# Visual Distribution Anchoring Paper Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish a focused VDA research project page, promote it from the homepage, and add it to the site’s Google discovery, Cloudflare analytics, and daily monitoring surfaces without publishing the manuscript or claiming KDD acceptance.

**Architecture:** Add one semantic static HTML article with a dedicated stylesheet and one optimized image derived from the manuscript’s method-board PDF. Extend the existing homepage, sitemap, action-path normalizer, scholarly-page audit policy, fixtures, and Lighthouse configuration so the new route is treated like Cloud Drive while allowing a preprint with no public identifier or PDF.

**Tech Stack:** Static HTML5, CSS, Node.js 22 built-in test runner, Cheerio-based site audit, ImageMagick/Poppler for the web image, Lighthouse CI, GitHub Pages, and the existing Cloudflare Worker analytics endpoint.

## Global Constraints

- The public route is exactly `/visual-distribution-anchoring/`.
- The visible status is exactly `Preprint · July 2026`.
- Do not claim acceptance or publication at KDD 2027.
- Do not publish or link `main.pdf`, `main-citations-verified.pdf`, the source ZIP, arXiv, DOI, or another paper URL.
- Do not add `citation_pdf_url`, `citation_arxiv_id`, JSON-LD `identifier`, JSON-LD `sameAs`, or JSON-LD `encoding` to the VDA page.
- Use only claims and numeric results present in `kdd_prompt_tuning_.zip`.
- The complete author-written abstract must be visible in ordinary HTML.
- Reuse the existing `interactive_article` analytics event; do not introduce a new event name.
- Do not add a framework, build system, dependency, database, server endpoint, simulator, or page-specific JavaScript controller.
- Preserve the existing Cloud Drive page and its current public-paper checks.
- Only extract the method-board PDF into a temporary directory; do not unpack the archive into tracked repository paths.
- Keep all archive-derived ignore patterns root-scoped so existing `docs/`, website PDFs, CSS, and images remain tracked.
- Node.js remains at version 22 or newer, with the repository’s existing dependency set.

---

## File Structure

- Create `visual-distribution-anchoring/index.html` for all VDA content,
  metadata, structured data, and accessible page structure.
- Create `css/visual-distribution-anchoring.css` for the indigo/lavender/orange
  academic visual system, responsive layout, print styles, and reduced-motion
  behavior.
- Create `images/visual-distribution-anchoring/method-overview.webp` as the
  only published archive-derived asset.
- Modify `index.html` for the new first News and Publications entries.
- Modify `.gitignore` to exclude the source ZIP and its root-level artifacts.
- Modify `sitemap.xml` to add the VDA canonical URL exactly once.
- Modify `scripts/site-analytics.mjs` to normalize the VDA route.
- Modify `monitoring/site-policy.mjs` to define the VDA page contract.
- Modify `monitoring/audit-core.mjs` to support a scholarly page without a
  public arXiv/PDF source while preserving strict Cloud Drive checks.
- Modify `lighthouserc.cjs` and `scripts/lighthouse-summary.mjs` to audit all
  three public pages.
- Modify `tests/site-content.test.js`, `tests/site-analytics.test.mjs`,
  `tests/site-audit-core.test.mjs`, `tests/site-audit-live.test.mjs`,
  `tests/monitoring-config.test.mjs`, and
  `tests/fixtures/monitoring-site.mjs` for deterministic coverage.

---

### Task 1: Protect Manuscript Artifacts and Produce the Web Image

**Files:**

- Modify: `.gitignore`
- Create: `images/visual-distribution-anchoring/method-overview.webp`
- Modify: `tests/site-content.test.js`

**Interfaces:**

- Consumes: `/Users/parsa025/codes/pouya-parsa.github.io/kdd_prompt_tuning_.zip`,
  read only.
- Produces: a root-scoped ignore contract and a 1600-pixel-wide WebP at
  `images/visual-distribution-anchoring/method-overview.webp`.

- [ ] **Step 1: Add failing artifact-hygiene and image-budget tests**

Append tests to `tests/site-content.test.js` that enforce the exact ignore
patterns, verify `docs/` is not ignored, and verify the web image exists:

```js
test("VDA manuscript artifacts are explicitly ignored without hiding site docs", () => {
  const ignore = read(".gitignore");
  const required = [
    "/kdd_prompt_tuning_.zip",
    "/main.tex",
    "/refs.bib",
    "/experiment_plan.md",
    "/cvpr.sty",
    "/ieee_fullname.bst",
    "/ACM-Reference-Format.bst",
    "/acmart.cls",
    "/related_work.tex",
    "/introduction.tex",
    "/method.tex",
    "/experiments.tex",
    "/closing_sections.tex",
    "/main.pdf",
    "/main-citations-verified.pdf",
    "/method-pages.txt",
    "/figs/",
  ];

  for (const pattern of required) {
    assert.match(ignore, new RegExp(`^${escapeRegExp(pattern)}$`, "m"));
  }
  assert.doesNotMatch(ignore, /^\/?docs\/?$/m);
});

test("VDA publishes one optimized method overview image", () => {
  const image = path.join(
    root,
    "images/visual-distribution-anchoring/method-overview.webp"
  );
  assert.equal(fs.existsSync(image), true, "VDA method overview is missing");
  assert.ok(fs.statSync(image).size > 20_000, "VDA overview is unexpectedly small");
  assert.ok(fs.statSync(image).size < 350_000, "VDA overview exceeds 350 KB");
});
```

If `escapeRegExp` is not already present near the top of the test file, add:

```js
const escapeRegExp = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
```

- [ ] **Step 2: Run the focused tests and confirm failure**

Run:

```bash
node --test --test-name-pattern="VDA manuscript artifacts|VDA publishes one optimized" tests/site-content.test.js
```

Expected: both new tests fail because the ignore entries and image do not yet
exist.

- [ ] **Step 3: Add the exact root-scoped ignore patterns**

Append this block to `.gitignore`:

```gitignore

# Local VDA manuscript archive and unpacked source/build artifacts
/kdd_prompt_tuning_.zip
/main.tex
/refs.bib
/experiment_plan.md
/cvpr.sty
/ieee_fullname.bst
/ACM-Reference-Format.bst
/acmart.cls
/related_work.tex
/introduction.tex
/method.tex
/experiments.tex
/closing_sections.tex
/main.pdf
/main-citations-verified.pdf
/method-pages.txt
/figs/
```

- [ ] **Step 4: Extract only the method board into a temporary directory**

Run:

```bash
vda_asset_tmp=$(mktemp -d)
unzip -j /Users/parsa025/codes/pouya-parsa.github.io/kdd_prompt_tuning_.zip \
  figs/tcp-paper-board.pdf \
  -d "$vda_asset_tmp"
mkdir -p images/visual-distribution-anchoring
printf '%s\n' "$vda_asset_tmp"
```

Expected: the archive reports one extracted file,
`$vda_asset_tmp/tcp-paper-board.pdf`. No `.tex`, `.bib`, `.md`, `.cls`, `.bst`,
or manuscript PDF appears in the repository.

- [ ] **Step 5: Convert and optimize the overview**

Run:

```bash
pdftoppm -f 1 -singlefile -png -r 180 \
  "$vda_asset_tmp/tcp-paper-board.pdf" \
  "$vda_asset_tmp/method-overview"
magick "$vda_asset_tmp/method-overview.png" \
  -background white \
  -alpha remove \
  -alpha off \
  -resize '1600x>' \
  -strip \
  -quality 82 \
  images/visual-distribution-anchoring/method-overview.webp
identify images/visual-distribution-anchoring/method-overview.webp
```

Expected: a 1600-pixel-wide WebP with a white canvas and a file size below
350 KB. If `magick` is unavailable, use `convert` with the same arguments.

- [ ] **Step 6: Run the focused tests and verify the ignore behavior**

Run:

```bash
node --test --test-name-pattern="VDA manuscript artifacts|VDA publishes one optimized" tests/site-content.test.js
git check-ignore -v kdd_prompt_tuning_.zip main.tex
git status --short
```

Expected: the tests pass; both local manuscript files are ignored; only
`.gitignore`, the test, and the WebP are relevant task changes.

- [ ] **Step 7: Commit artifact safety and the web asset**

```bash
git add .gitignore \
  tests/site-content.test.js \
  images/visual-distribution-anchoring/method-overview.webp
git diff --cached --check
git diff --cached --name-only
git commit -m "chore: protect VDA manuscript artifacts"
```

Expected staged names: exactly the three paths above. The ZIP, `main.tex`, and
any manuscript PDF must not be listed.

---

### Task 2: Build the Static VDA Research Page

**Files:**

- Create: `visual-distribution-anchoring/index.html`
- Create: `css/visual-distribution-anchoring.css`
- Modify: `tests/site-content.test.js`

**Interfaces:**

- Consumes: `images/visual-distribution-anchoring/method-overview.webp` from
  Task 1 and the existing `scripts/site-analytics.mjs` script.
- Produces: the canonical, no-JavaScript VDA article and its page-specific
  responsive visual system.

- [ ] **Step 1: Add failing page-structure, metadata, and claim-safety tests**

Append a single focused test group to `tests/site-content.test.js`:

```js
test("VDA page exposes the approved preprint content and scholarly metadata", () => {
  const html = read("visual-distribution-anchoring/index.html");
  const title = "Visual Distribution Anchoring for Efficient Prompt Tuning";

  assert.match(html, new RegExp(`<h1[^>]*>${title}</h1>`));
  assert.match(html, /Preprint <span aria-hidden="true">·<\/span> July 2026/);
  for (const author of ["Pouya Parsa", "Raoof Zare Moayedi", "Seongjin Choi"]) {
    assert.ok(html.includes(author), `missing author: ${author}`);
  }
  for (const id of ["overview", "method", "results", "evidence", "abstract", "limitations"]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(
    html,
    /src="\.\.\/images\/visual-distribution-anchoring\/method-overview\.webp"[^>]*width="1600"/
  );
  assert.match(html, /65\.82%[\s\S]*69\.21%/);
  assert.match(html, /\+3\.39/);
  assert.match(html, /9\/10/);
  assert.match(html, /K\s*=\s*32/);
  assert.match(html, /no target labels/i);
  assert.match(html, /no target-side optimization/i);
  assert.match(html, /no uniform class-prior assumption/i);
  assert.match(html, /no iterative refinement/i);
  assert.match(html, /no access to (?:test|evaluation) queries/i);

  assert.match(
    html,
    /rel="canonical" href="https:\/\/pouya-parsa\.github\.io\/visual-distribution-anchoring\/"/
  );
  assert.match(html, /name="robots" content="index, follow, max-image-preview:large"/);
  assert.match(html, new RegExp(`name="citation_title" content="${title}"`));
  assert.equal((html.match(/name="citation_author"/g) ?? []).length, 3);
  assert.match(html, /name="citation_publication_date" content="2026\/07\/30"/);
  assert.doesNotMatch(html, /citation_pdf_url|citation_arxiv_id/i);
  assert.doesNotMatch(html, /arxiv\.org|doi\.org|KDD '27|KDD 2027|Read the paper/i);

  const jsonLd = html.match(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/
  );
  assert.ok(jsonLd, "VDA JSON-LD block is missing");
  const graph = JSON.parse(jsonLd[1])["@graph"];
  const article = graph.find((node) => node["@type"] === "ScholarlyArticle");
  assert.equal(article.headline, title);
  assert.equal(article.datePublished, "2026-07-30");
  assert.equal(
    article.url,
    "https://pouya-parsa.github.io/visual-distribution-anchoring/"
  );
  for (const forbidden of ["identifier", "sameAs", "encoding"]) {
    assert.equal(forbidden in article, false, `unexpected ${forbidden}`);
  }
});

test("VDA stylesheet defines its distinct responsive academic system", () => {
  const css = read("css/visual-distribution-anchoring.css");
  assert.match(css, /--vda-indigo:\s*#1f4f9a/);
  assert.match(css, /--vda-lavender:\s*#7652b8/);
  assert.match(css, /--vda-orange:\s*#d85f00/);
  assert.match(css, /\.paper-nav\s*\{[\s\S]*position:\s*sticky/);
  assert.match(css, /\.method-grid\s*\{[\s\S]*display:\s*grid/);
  assert.match(css, /\.results-table-wrap\s*\{[\s\S]*overflow-x:\s*auto/);
  assert.match(css, /@media\s*\(max-width:\s*760px\)/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(css, /@media\s*print/);
});
```

Also extend the existing analytics annotation helper test so the VDA page’s
Portfolio link is annotated with `interactive_article` only if it points to a
site article. Do not add a nonexistent `paper_pdf` assertion.

- [ ] **Step 2: Run the focused tests and confirm failure**

Run:

```bash
node --test --test-name-pattern="VDA page exposes|VDA stylesheet defines" tests/site-content.test.js
```

Expected: failure because the VDA HTML and CSS files do not exist.

- [ ] **Step 3: Create the page head and structured data**

Create `visual-distribution-anchoring/index.html` with:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Visual Distribution Anchoring for Efficient Prompt Tuning | Pouya Parsa</title>
    <meta name="description" content="Visual Distribution Anchoring uses hard-partitioned unlabeled target images to build cacheable visual prototypes that improve zero-shot and prompt-tuned vision-language classifiers without target-side optimization.">
    <meta name="author" content="Pouya Parsa">
    <meta name="robots" content="index, follow, max-image-preview:large">
    <link rel="canonical" href="https://pouya-parsa.github.io/visual-distribution-anchoring/">

    <meta name="citation_title" content="Visual Distribution Anchoring for Efficient Prompt Tuning">
    <meta name="citation_author" content="Parsa, Pouya">
    <meta name="citation_author" content="Moayedi, Raoof Zare">
    <meta name="citation_author" content="Choi, Seongjin">
    <meta name="citation_publication_date" content="2026/07/30">

    <meta property="og:type" content="article">
    <meta property="og:url" content="https://pouya-parsa.github.io/visual-distribution-anchoring/">
    <meta property="og:title" content="Visual Distribution Anchoring for Efficient Prompt Tuning">
    <meta property="og:description" content="A training-free target adaptation method that turns an unlabeled target pool into class-specific visual anchors for frozen vision-language classifiers.">
    <meta property="og:image" content="https://pouya-parsa.github.io/images/visual-distribution-anchoring/method-overview.webp">
    <meta property="og:image:alt" content="VDA pipeline from frozen semantic priors and an unlabeled target pool to a cached classifier.">
    <meta property="article:published_time" content="2026-07-30">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="Visual Distribution Anchoring for Efficient Prompt Tuning">
    <meta name="twitter:description" content="VDA builds class-specific visual anchors from an unlabeled target pool with no target-side optimization.">
    <meta name="twitter:image" content="https://pouya-parsa.github.io/images/visual-distribution-anchoring/method-overview.webp">
    <meta name="twitter:image:alt" content="VDA pipeline from frozen priors to offline target adaptation and cached inference.">
    <meta name="site-analytics-endpoint" content="https://pouya-parsa-site-events.mail-pouyaparsa.workers.dev/event">

    <link rel="stylesheet" href="../css/visual-distribution-anchoring.css">
```

Add JSON-LD with an `@graph` containing:

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ScholarlyArticle",
      "@id": "https://pouya-parsa.github.io/visual-distribution-anchoring/#paper",
      "headline": "Visual Distribution Anchoring for Efficient Prompt Tuning",
      "name": "Visual Distribution Anchoring for Efficient Prompt Tuning",
      "description": "Visual Distribution Anchoring is a training-free target adaptation framework that estimates class-level visual prototypes from a disjoint unlabeled target pool and fuses them with a frozen semantic classifier.",
      "datePublished": "2026-07-30",
      "url": "https://pouya-parsa.github.io/visual-distribution-anchoring/",
      "image": "https://pouya-parsa.github.io/images/visual-distribution-anchoring/method-overview.webp",
      "author": [
        { "@id": "https://pouya-parsa.github.io/#pouya-parsa" },
        { "@type": "Person", "name": "Raoof Zare Moayedi" },
        { "@type": "Person", "name": "Seongjin Choi" }
      ],
      "keywords": [
        "vision-language models",
        "prompt tuning",
        "target adaptation",
        "visual prototypes",
        "CLIP",
        "training-free adaptation"
      ]
    },
    {
      "@type": "Person",
      "@id": "https://pouya-parsa.github.io/#pouya-parsa",
      "name": "Pouya Parsa",
      "url": "https://pouya-parsa.github.io/",
      "affiliation": {
        "@type": "CollegeOrUniversity",
        "name": "University of Minnesota Twin Cities"
      },
      "sameAs": "https://github.com/pouya-parsa"
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Pouya Parsa",
          "item": "https://pouya-parsa.github.io/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Visual Distribution Anchoring",
          "item": "https://pouya-parsa.github.io/visual-distribution-anchoring/"
        }
      ]
    }
  ]
}
```

Close the head after the JSON-LD. Do not add the forbidden publication
properties listed in Global Constraints.

- [ ] **Step 4: Create the complete semantic article body**

Inside `<body>`, add the skip link first and wrap the article in
`<main id="main-content"><article>`. Use this exact child order:

1. `header.paper-hero#top`
2. `section.overview-section#overview[aria-labelledby="overview-heading"]`
3. `nav.paper-nav[aria-label="Paper sections"]`
4. `section.article-section.core-section#core-idea[aria-labelledby="core-heading"]`
5. `section.article-section.method-section#method[aria-labelledby="method-heading"]`
6. `section.article-section.results-section#results[aria-labelledby="results-heading"]`
7. `section.article-section.evidence-section#evidence[aria-labelledby="evidence-heading"]`
8. `section.article-section.abstract-section#abstract[aria-labelledby="abstract-heading"]`
9. `section.article-section.limitations-section#limitations[aria-labelledby="limitations-heading"]`
10. `footer.paper-footer`

After the article and main closing tags, load:

```html
<script type="module" src="../scripts/site-analytics.mjs"></script>
```

The hero must use the exact full title in one `<h1>` and the exact visible
status:

```html
<span class="project-badge">Research preprint</span>
<h1>Visual Distribution Anchoring for Efficient Prompt Tuning</h1>
<p class="paper-subtitle">Target-domain appearance, distilled into a fixed visual correction for frozen vision–language classifiers.</p>
<p class="paper-authors"><strong>Pouya Parsa</strong>, Raoof Zare Moayedi, and Seongjin Choi</p>
<p class="paper-affiliation">University of Minnesota</p>
<p class="paper-venue">Preprint <span aria-hidden="true">·</span> July 2026</p>
<div class="resource-links" aria-label="Project sections">
  <a class="button button-primary" href="#method">Method</a>
  <a class="button" href="#results">Results</a>
  <a class="button" href="../">Portfolio</a>
</div>
```

The overview image must be:

```html
<figure class="overview-figure">
  <img
    src="../images/visual-distribution-anchoring/method-overview.webp"
    alt="Three-stage VDA pipeline: frozen source and domain priors hard-partition a disjoint unlabeled target pool, confidence-ranked supports form normalized class prototypes, and their fusion produces a cached classifier for disjoint test images."
    width="1600"
    height="906"
    fetchpriority="high">
  <figcaption>VDA estimates class-specific visual anchors once, before evaluation, and then uses an ordinary fixed classifier at inference.</figcaption>
</figure>
```

The sticky navigation must use:

```html
<nav class="paper-nav" aria-label="Paper sections">
  <div class="paper-nav-inner">
    <a href="#overview">Overview</a>
    <a href="#method">Method</a>
    <a href="#results">Results</a>
    <a href="#evidence">Evidence</a>
    <a href="#abstract">Abstract</a>
    <a href="#limitations">Limitations</a>
  </div>
</nav>
```

Use three method cards titled `Partition`, `Anchor`, and `Fuse`. Include the
exact result table from the approved design:

```html
<div class="results-table-wrap" tabindex="0" aria-label="VDA results table">
  <table>
    <caption>Mean cross-dataset top-1 accuracy reported in the manuscript.</caption>
    <thead>
      <tr>
        <th scope="col">Semantic classifier</th>
        <th scope="col">Base</th>
        <th scope="col">+ VDA</th>
        <th scope="col">Gain</th>
        <th scope="col">Improved</th>
      </tr>
    </thead>
    <tbody>
      <tr><th scope="row">Zero-shot CLIP</th><td>65.34</td><td>68.56</td><td>+3.22</td><td>9/10</td></tr>
      <tr><th scope="row">TCP</th><td>65.82</td><td>69.21</td><td>+3.39</td><td>9/10</td></tr>
      <tr><th scope="row">MaPLe, 3 seeds</th><td>66.25 ± 0.42</td><td>69.60 ± 0.22</td><td>+3.35 ± 0.37</td><td>9/10</td></tr>
      <tr><th scope="row">PromptKD, 3 seeds</th><td>70.80 ± 0.40</td><td>73.59 ± 0.28</td><td>+2.79 ± 0.38</td><td>9/10</td></tr>
    </tbody>
  </table>
</div>
```

Copy the complete abstract verbatim in meaning and numbers from the
`\begin{abstract}` block in the ZIP’s `main.tex`, converting LaTeX punctuation
and symbols to readable HTML. Keep it as visible paragraph text; do not wrap it
in `<details>`.

Summarize the five approved limitations in a semantic list. Include the
matched-comparison caveat for MaPLe and PromptKD in the evidence section.

- [ ] **Step 5: Create the distinct VDA stylesheet**

Create `css/visual-distribution-anchoring.css` with these exact design tokens:

```css
:root {
  --vda-background: #fbfcff;
  --vda-surface: #f3f6fb;
  --vda-ink: #172033;
  --vda-muted: #59657a;
  --vda-line: #dce3ef;
  --vda-indigo: #1f4f9a;
  --vda-lavender: #7652b8;
  --vda-orange: #d85f00;
  --vda-indigo-soft: #eaf1fb;
  --vda-lavender-soft: #f2edfb;
  --vda-orange-soft: #fff1e7;
  --vda-max-width: 1060px;
  --vda-reading-width: 760px;
  --vda-radius: 10px;
}
```

Implement:

- global `box-sizing`, readable system typography, focus rings, and skip link;
- a centered hero with an indigo/lavender radial background;
- pill resource links and horizontally scrollable sticky `.paper-nav`;
- a constrained `.paper-wrap` and `.reading-wrap`;
- bordered `.overview-figure` with a white canvas;
- an asymmetric `.core-layout`;
- `.method-grid { display: grid; grid-template-columns: repeat(3, 1fr); }`;
- visually distinct `.partition`, `.anchor`, and `.fuse` card accents using
  text labels in addition to color;
- a four-cell headline-results band;
- `.results-table-wrap { overflow-x: auto; }` with readable table cells;
- evidence and limitation card layouts;
- clipped-corner accents using pseudo-elements rather than excessive rounded
  boxes;
- a `max-width: 760px` breakpoint that collapses multi-column grids;
- a reduced-motion block that disables smooth scrolling/transitions;
- print styles that hide navigation/buttons and preserve black text on white.

Do not import third-party fonts or reuse `css/cloud-drive.css`.

- [ ] **Step 6: Run page tests**

Run:

```bash
node --test --test-name-pattern="VDA page exposes|VDA stylesheet defines" tests/site-content.test.js
```

Expected: both tests pass.

- [ ] **Step 7: Validate semantic HTML and internal references**

Run:

```bash
node --check scripts/site-analytics.mjs
rg -n "arxiv|doi|KDD|citation_pdf_url|citation_arxiv_id|main\\.pdf" \
  visual-distribution-anchoring/index.html
```

Expected: JavaScript syntax passes; `rg` returns no matches.

- [ ] **Step 8: Commit the VDA page**

```bash
git add \
  visual-distribution-anchoring/index.html \
  css/visual-distribution-anchoring.css \
  tests/site-content.test.js
git diff --cached --check
git commit -m "feat: add VDA research page"
```

---

### Task 3: Promote and Discover the VDA Page

**Files:**

- Modify: `index.html`
- Modify: `sitemap.xml`
- Modify: `scripts/site-analytics.mjs`
- Modify: `tests/site-content.test.js`
- Modify: `tests/site-analytics.test.mjs`

**Interfaces:**

- Consumes: canonical route `/visual-distribution-anchoring/` from Task 2.
- Produces: two homepage entry points, sitemap discovery, and analytics payloads
  normalized to `/visual-distribution-anchoring/`.

- [ ] **Step 1: Add failing homepage, sitemap, and analytics tests**

Add to `tests/site-content.test.js`:

```js
test("homepage promotes the VDA preprint without a paper download", () => {
  const html = read("index.html");
  const route = "visual-distribution-anchoring/";
  assert.match(html, /Visual Distribution Anchoring for Efficient Prompt Tuning/);
  assert.match(html, /Preprint, July 2026/);
  assert.match(html, /65\.82% to 69\.21%/);
  assert.equal((html.match(new RegExp(`href="${route}"`, "g")) ?? []).length, 3);
  const publication = html.match(
    /<article>\s*<h3><a href="visual-distribution-anchoring\/"[\s\S]*?<\/article>/
  );
  assert.ok(publication, "VDA publication entry is missing");
  assert.doesNotMatch(publication[0], /Read the paper|arxiv\.org|doi\.org/);
});

test("sitemap lists the VDA canonical exactly once", () => {
  const sitemap = read("sitemap.xml");
  const canonical =
    "https://pouya-parsa.github.io/visual-distribution-anchoring/";
  assert.equal(sitemap.split(canonical).length - 1, 1);
});
```

Extend the first test in `tests/site-analytics.test.mjs`:

```js
assert.equal(
  normalizePagePath("/visual-distribution-anchoring/index.html"),
  "/visual-distribution-anchoring/"
);
assert.deepEqual(
  createActionPayload(
    "interactive_article",
    "/visual-distribution-anchoring/"
  ),
  {
    event: "interactive_article",
    pagePath: "/visual-distribution-anchoring/",
  }
);
```

- [ ] **Step 2: Run the focused tests and confirm failure**

Run:

```bash
node --test --test-name-pattern="homepage promotes the VDA|sitemap lists the VDA" tests/site-content.test.js
node --test --test-name-pattern="action payload is limited" tests/site-analytics.test.mjs
```

Expected: all new assertions fail.

- [ ] **Step 3: Add the first homepage news item**

Insert this before the Cloud Drive news item:

```html
<li><strong>2026:</strong> New preprint: <a href="visual-distribution-anchoring/" data-analytics-event="interactive_article">Visual Distribution Anchoring</a> uses an unlabeled target pool to build fixed visual corrections for frozen vision–language classifiers, improving TCP from 65.82% to 69.21% across ten target datasets.</li>
```

- [ ] **Step 4: Add the first publication entry**

Insert this before the Cloud Drive publication:

```html
<article>
  <h3><a href="visual-distribution-anchoring/" data-analytics-event="interactive_article">Visual Distribution Anchoring for Efficient Prompt Tuning</a></h3>
  <p><strong>Pouya Parsa</strong>, Raoof Zare Moayedi, and Seongjin Choi. Preprint, July 2026.</p>
  <p>VDA turns a disjoint unlabeled target pool into class-specific visual prototypes and fuses them with frozen semantic classifiers. The primary matched result improves mean accuracy from 65.82% to 69.21% while requiring no target-side optimization or test-query access.</p>
  <p><a href="visual-distribution-anchoring/" data-analytics-event="interactive_article">Explore the project page</a></p>
</article>
```

The title, News link, and call-to-action produce exactly three homepage links to
the VDA route.

- [ ] **Step 5: Add the sitemap entry**

Insert after the homepage URL:

```xml
  <url>
    <loc>https://pouya-parsa.github.io/visual-distribution-anchoring/</loc>
    <lastmod>2026-07-30</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
```

Keep the Cloud Drive URL unchanged and update the homepage `<lastmod>` to
`2026-07-30`.

- [ ] **Step 6: Normalize the new page path**

Refactor `normalizePagePath` in `scripts/site-analytics.mjs` to:

```js
export function normalizePagePath(pathname) {
  if (pathname === "/") return "/";
  for (const route of [
    "/cloud-drive/",
    "/visual-distribution-anchoring/",
  ]) {
    if (pathname === route || pathname === `${route}index.html`) return route;
  }
  return null;
}
```

- [ ] **Step 7: Run the focused tests**

Run:

```bash
node --test --test-name-pattern="homepage promotes the VDA|sitemap lists the VDA" tests/site-content.test.js
node --test --test-name-pattern="action payload is limited" tests/site-analytics.test.mjs
```

Expected: all focused tests pass.

- [ ] **Step 8: Commit homepage discovery and analytics**

```bash
git add index.html sitemap.xml scripts/site-analytics.mjs \
  tests/site-content.test.js tests/site-analytics.test.mjs
git diff --cached --check
git commit -m "feat: promote VDA preprint"
```

---

### Task 4: Generalize Scholarly Auditing and Monitor the VDA Route

**Files:**

- Modify: `monitoring/site-policy.mjs`
- Modify: `monitoring/audit-core.mjs`
- Modify: `tests/fixtures/monitoring-site.mjs`
- Modify: `tests/site-audit-core.test.mjs`
- Modify: `tests/site-audit-live.test.mjs`

**Interfaces:**

- Consumes: VDA canonical metadata and one figure from Tasks 1–3.
- Produces: `policy.paper` contracts in which `arxivId`, `pdfUrl`, and
  `sourceUrl` are optional, while title/author/date/figure checks remain strict.

- [ ] **Step 1: Add a valid no-public-source scholarly fixture**

In `tests/fixtures/monitoring-site.mjs`, add this complete fixture:

```js
export const validVdaArticleHtml = page({
  canonical:
    "https://pouya-parsa.github.io/visual-distribution-anchoring/",
  title:
    "Visual Distribution Anchoring for Efficient Prompt Tuning | Pouya Parsa",
  schema: {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ScholarlyArticle",
        headline:
          "Visual Distribution Anchoring for Efficient Prompt Tuning",
        datePublished: "2026-07-30",
        url:
          "https://pouya-parsa.github.io/visual-distribution-anchoring/",
        image:
          "https://pouya-parsa.github.io/images/visual-distribution-anchoring/method-overview.webp",
        author: [
          { "@id": "https://pouya-parsa.github.io/#pouya-parsa" },
          { "@type": "Person", name: "Raoof Zare Moayedi" },
          { "@type": "Person", name: "Seongjin Choi" },
        ],
      },
      personNode,
      { "@type": "BreadcrumbList", itemListElement: [] },
    ],
  },
  extraHead: `
    <meta name="citation_title" content="Visual Distribution Anchoring for Efficient Prompt Tuning">
    <meta name="citation_author" content="Parsa, Pouya">
    <meta name="citation_author" content="Moayedi, Raoof Zare">
    <meta name="citation_author" content="Choi, Seongjin">
    <meta name="citation_publication_date" content="2026/07/30">`,
  body: `<main>
    <h1>Visual Distribution Anchoring for Efficient Prompt Tuning</h1>
    <h2>Paper overview</h2>
    <figure id="figure-1">
      <img src="/images/visual-distribution-anchoring/method-overview.webp" alt="VDA method overview">
      <figcaption>Figure 1: Visual Distribution Anchoring method overview.</figcaption>
    </figure>
  </main>`,
});
```

Update `validSitemap` to include:

```xml
<url><loc>https://pouya-parsa.github.io/visual-distribution-anchoring/</loc></url>
```

- [ ] **Step 2: Add failing audit-core tests for optional source metadata**

Import `validVdaArticleHtml`, find the VDA policy by path, and add:

```js
test("valid VDA preprint passes without invented public source metadata", () => {
  const result = auditHtmlPage({
    html: validVdaArticleHtml,
    fetchUrl: vdaPolicy.fetchUrl,
    policy: vdaPolicy,
  });
  assert.deepEqual(failedIds(result), []);
  assert.deepEqual(result.internalUrls, [
    "https://pouya-parsa.github.io/images/visual-distribution-anchoring/method-overview.webp",
  ]);
});

test("VDA preprint fails when public source metadata is invented", () => {
  const invented = validVdaArticleHtml.replace(
    "</head>",
    '<meta name="citation_arxiv_id" content="0000.00000"></head>'
  );
  const result = auditHtmlPage({
    html: invented,
    fetchUrl: vdaPolicy.fetchUrl,
    policy: vdaPolicy,
  });
  assert.ok(failedIds(result).includes("geo.paper-identity"));
});
```

Also update the sitemap test so the required VDA canonical is removed in the
broken fixture alongside the Cloud Drive canonical.

- [ ] **Step 3: Run the audit-core tests and confirm failure**

Run:

```bash
node --test --test-name-pattern="valid VDA preprint|VDA preprint fails" tests/site-audit-core.test.mjs
```

Expected: failure because no VDA policy exists and the current paper identity
logic always requires arXiv/PDF fields.

- [ ] **Step 4: Add the VDA policy**

Append this page to `buildSitePolicy().pages`:

```js
{
  ...shared,
  path: "/visual-distribution-anchoring/",
  fetchUrl: absolute("/visual-distribution-anchoring/", fetchBase),
  canonicalUrl: absolute("/visual-distribution-anchoring/", canonicalBase),
  requiredSchemaTypes: [
    "ScholarlyArticle",
    "Person",
    "BreadcrumbList",
  ],
  personId: `${canonicalBase}#pouya-parsa`,
  paper: {
    title: "Visual Distribution Anchoring for Efficient Prompt Tuning",
    authors: [
      "Parsa, Pouya",
      "Moayedi, Raoof Zare",
      "Choi, Seongjin",
    ],
    datePublished: "2026-07-30",
    citationDate: "2026/07/30",
    figureCount: 1,
  },
},
```

Do not add source identifiers to this policy.

- [ ] **Step 5: Generalize the paper identity checks**

In `auditHtmlPage`, keep these conditions mandatory for every paper:

```js
const baseIdentityMatches =
  article?.headline === policy.paper.title &&
  article?.datePublished === policy.paper.datePublished &&
  article?.url === policy.canonicalUrl &&
  articleAuthorIds.includes(policy.personId) &&
  visibleHeading === policy.paper.title &&
  citationTitle === policy.paper.title &&
  JSON.stringify(citationAuthors) ===
    JSON.stringify(policy.paper.authors) &&
  citationDate === policy.paper.citationDate;
```

Add strict optional-source conditions:

```js
const arxivMatches = policy.paper.arxivId
  ? article?.identifier === `arXiv:${policy.paper.arxivId}` &&
    citationArxiv === policy.paper.arxivId
  : article?.identifier === undefined && citationArxiv === "";

const sourceMatches = policy.paper.sourceUrl
  ? article?.sameAs === policy.paper.sourceUrl
  : article?.sameAs === undefined;

const pdfMatches = policy.paper.pdfUrl
  ? citationPdf === policy.paper.pdfUrl
  : citationPdf === "" && article?.encoding === undefined;
```

Set `geo.paper-identity` to
`baseIdentityMatches && arxivMatches && sourceMatches && pdfMatches`.

Only create the PDF-link check when a PDF is required:

```js
if (policy.paper.pdfUrl) {
  const paperLinked =
    $(`a[href="${policy.paper.pdfUrl}"]`).length > 0;
  checks.push(
    makeCheck(
      "geo.paper-source",
      paperLinked,
      "Article links to the primary paper PDF",
      { url: fetchUrl }
    )
  );
}
```

Keep the existing `geo.figures` check strict for both papers. This preserves all
Cloud Drive requirements and verifies that VDA has exactly one captioned
figure.

- [ ] **Step 6: Run audit-core tests**

Run:

```bash
node --test tests/site-audit-core.test.mjs
```

Expected: all audit-core tests pass, including the existing Cloud Drive
identifier mismatch test.

- [ ] **Step 7: Add VDA routes to the live-audit fixture**

In `tests/site-audit-live.test.mjs`:

- import `validVdaArticleHtml`;
- find policies by `page.path` rather than relying on array indexes;
- add the VDA page response to `routes`;
- add the VDA WebP response to `routes`; and
- update the expected `resource.http` count from 11 to 12.

Use:

```js
const homePolicy = policy.pages.find((page) => page.path === "/");
const cloudDrivePolicy = policy.pages.find(
  (page) => page.path === "/cloud-drive/"
);
const vdaPolicy = policy.pages.find(
  (page) => page.path === "/visual-distribution-anchoring/"
);
```

The routes must include:

```js
[homePolicy.fetchUrl, { body: validHomepageHtml }],
[cloudDrivePolicy.fetchUrl, { body: validArticleHtml }],
[vdaPolicy.fetchUrl, { body: validVdaArticleHtml }],
[
  "https://pouya-parsa.github.io/images/visual-distribution-anchoring/method-overview.webp",
  { body: "webp" },
],
```

- [ ] **Step 8: Run live-audit tests**

Run:

```bash
node --test tests/site-audit-live.test.mjs
```

Expected: every test passes; the complete-site fixture audits all three pages
and 12 internal resources.

- [ ] **Step 9: Commit the generalized scholarly monitor**

```bash
git add monitoring/site-policy.mjs monitoring/audit-core.mjs \
  tests/fixtures/monitoring-site.mjs \
  tests/site-audit-core.test.mjs tests/site-audit-live.test.mjs
git diff --cached --check
git commit -m "feat: monitor VDA scholarly page"
```

---

### Task 5: Add VDA to Lighthouse and Complete End-to-End Verification

**Files:**

- Modify: `lighthouserc.cjs`
- Modify: `scripts/lighthouse-summary.mjs`
- Modify: `tests/monitoring-config.test.mjs`
- Modify: `docs/monitoring.md`

**Interfaces:**

- Consumes: the three canonical page routes from `monitoring/site-policy.mjs`.
- Produces: three-run mobile Lighthouse coverage and documented daily
  monitoring for the homepage, Cloud Drive, and VDA.

- [ ] **Step 1: Add failing Lighthouse configuration assertions**

Update the first test in `tests/monitoring-config.test.mjs`:

```js
test("Lighthouse config monitors all three pages with approved thresholds", () => {
  const config = require("../lighthouserc.cjs");
  const { collect, assert: assertion } = config.ci;

  assert.equal(collect.numberOfRuns, 3);
  assert.deepEqual(collect.url, [
    "https://pouya-parsa.github.io/",
    "https://pouya-parsa.github.io/cloud-drive/",
    "https://pouya-parsa.github.io/visual-distribution-anchoring/",
  ]);
  assert.deepEqual(assertion.assertions["categories:seo"], [
    "error",
    { minScore: 0.95, aggregationMethod: "median" },
  ]);
  assert.deepEqual(
    assertion.assertions["largest-contentful-paint"],
    ["error", { maxNumericValue: 3000, aggregationMethod: "median" }]
  );
});
```

Add a source check for the summary script:

```js
test("Lighthouse summary requires three runs for the VDA page", () => {
  const source = fs.readFileSync(
    new URL("../scripts/lighthouse-summary.mjs", import.meta.url),
    "utf8"
  );
  assert.match(source, /new URL\("\\/visual-distribution-anchoring\\/", base\)\.href/);
  assert.match(source, /count !== 3/);
});
```

- [ ] **Step 2: Run the focused tests and confirm failure**

Run:

```bash
node --test --test-name-pattern="Lighthouse config monitors|Lighthouse summary requires" tests/monitoring-config.test.mjs
```

Expected: failure because Lighthouse only lists the homepage and Cloud Drive.

- [ ] **Step 3: Add the VDA URL to Lighthouse collection**

Change the `collect.url` array in `lighthouserc.cjs` to:

```js
url: [
  new URL("/", baseUrl).href,
  new URL("/cloud-drive/", baseUrl).href,
  new URL("/visual-distribution-anchoring/", baseUrl).href,
],
```

Keep `numberOfRuns: 3` and all existing thresholds unchanged.

- [ ] **Step 4: Require VDA reports in the summary**

Change `expectedUrls` in `scripts/lighthouse-summary.mjs` to:

```js
const expectedUrls = [
  new URL("/", base).href,
  new URL("/cloud-drive/", base).href,
  new URL("/visual-distribution-anchoring/", base).href,
];
```

- [ ] **Step 5: Update monitoring documentation**

Change the first paragraph of `docs/monitoring.md` to say the daily workflow
checks the homepage, Cloud Drive article, and Visual Distribution Anchoring
preprint page. Do not change thresholds, credentials, or workflow behavior.

- [ ] **Step 6: Run configuration and full repository tests**

Run:

```bash
node --test tests/monitoring-config.test.mjs
npm test
```

Expected: all tests pass with zero failures.

- [ ] **Step 7: Run the deterministic audit against a local server**

Start the site:

```bash
python3 -m http.server 4173
```

In a second shell, run:

```bash
SITE_BASE_URL=http://127.0.0.1:4173/ \
SITE_CANONICAL_BASE_URL=https://pouya-parsa.github.io/ \
npm run monitor:site
```

Expected: overall PASS for all three monitored pages, crawler access, metadata,
sitemap membership, fragments, and internal resources.

- [ ] **Step 8: Run mobile Lighthouse for the VDA page**

With the local server still running:

```bash
LHCI_BASE_URL=http://127.0.0.1:4173/ npm run monitor:lighthouse:collect
LHCI_BASE_URL=http://127.0.0.1:4173/ npm run monitor:lighthouse:assert
LHCI_BASE_URL=http://127.0.0.1:4173/ npm run monitor:lighthouse:summary
```

Expected medians for every page:

- SEO at least 0.95;
- accessibility at least 0.90;
- best practices at least 0.90;
- performance at least 0.80;
- LCP at most 3000 ms;
- CLS at most 0.10; and
- TBT at most 300 ms.

- [ ] **Step 9: Perform visual QA at desktop and mobile widths**

Open:

```text
http://127.0.0.1:4173/visual-distribution-anchoring/
```

Capture and inspect:

- desktop at 1440 × 1000;
- mobile at 390 × 844;
- the complete hero;
- method image label legibility;
- sticky navigation;
- method cards;
- horizontally scrollable results table;
- visible full abstract;
- focus styles; and
- the absence of a paper-download button.

Fix only issues that violate the approved design or verification thresholds,
then rerun the affected focused test and Lighthouse command.

- [ ] **Step 10: Audit staged files and ignored artifacts**

Run:

```bash
git status --short --ignored
git ls-files kdd_prompt_tuning_.zip main.tex main.pdf experiment_plan.md
git diff --check
git diff --name-only
```

Expected:

- the four `git ls-files` paths produce no output;
- the ZIP and `main.tex` appear only as ignored files;
- no archive source/build artifact is modified or staged; and
- the diff contains only the planned website, test, monitoring, and
  documentation files.

- [ ] **Step 11: Commit Lighthouse and monitoring documentation**

```bash
git add lighthouserc.cjs scripts/lighthouse-summary.mjs \
  tests/monitoring-config.test.mjs docs/monitoring.md
git diff --cached --check
git commit -m "chore: audit VDA page daily"
```

- [ ] **Step 12: Run final verification from a clean index**

Run:

```bash
npm test
git status --short --ignored
git log --oneline -6
```

Expected:

- the full test suite passes;
- no tracked implementation change remains uncommitted;
- the ZIP and manuscript sources remain ignored and untracked; and
- the new commits cover artifact hygiene, the VDA page, homepage/discovery,
  scholarly monitoring, and Lighthouse coverage.
