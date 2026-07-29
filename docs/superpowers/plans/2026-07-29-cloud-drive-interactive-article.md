# Cloud Drive Interactive Article Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the new “Can the Cloud Drive?” paper to the portfolio and publish a paper-faithful, searchable interactive article with a guided story, constrained simulator, and all ten official figures.

**Architecture:** Preserve the repository's static GitHub Pages architecture. Build one semantic HTML article at `cloud-drive/index.html`, one article stylesheet, a pure browser-and-Node-compatible analytical model, and a small progressive-enhancement controller. Keep scientific constants/calculations separate from DOM behavior so reference scenarios can be unit tested without a browser.

**Tech Stack:** HTML5, CSS3, vanilla JavaScript, Node's built-in `node:test`, existing browser-based smoke tests, Poppler/LaTeX for official figure extraction, GitHub Pages.

## Global Constraints

- Preserve the existing homepage's sections, profile layout, package-free architecture, and `css/main.css` visual language.
- Do not add a framework, package manager, build system, analytics platform, database, or server-side API.
- Keep the simulator inside the paper's categorical scenario space: E2E/VLM/VLA; S1/S2/S3; 5G/5G-Advanced/6G; 100/300 ms; the eight published penetration values; the six published utilization values; and integer GPU years 2025–2040.
- Label simulator values as analytical estimates based on `arXiv:2607.09045v1`; never present them as a production deployment or safety-certification result.
- Never display an economic recommendation for a branch that fails communication or latency.
- Include all ten official figures, complete captions, result-oriented alt text, “Why it matters” notes, and stable `#figure-N` anchors.
- The 300 ms deliberative tier must always state that it presumes an onboard 100 ms reactive fallback.
- Use progressive enhancement: narrative, figure captions, FAQ, citation, and a static reference-scenario result must work without JavaScript.
- Meet WCAG 2.2 AA expectations for semantic structure, keyboard access, focus visibility, contrast, reduced motion, and 44 px touch targets.
- Use the canonical article URL `https://pouya-parsa.github.io/cloud-drive/`.
- Preserve the user's unrelated untracked `main.tex`; never stage, modify, or delete it.
- Use `apply_patch` for repository text-file edits. Temporary paper/source extraction may live only under `tmp/pdfs/` and must not be committed.

---

## File Map

- Modify `index.html` — homepage news and first publication entry.
- Modify `tests/homepage-smoke.html` — homepage discovery/link regression checks.
- Create `tests/site-content.test.js` — dependency-free automated checks for homepage/article structure, metadata, assets, and structured data.
- Create `cloud-drive/index.html` — complete semantic article, simulator form/results, figure explorer, FAQ, and citation.
- Create `css/cloud-drive.css` — article visual system, responsive layout, figure dialog, simulator states, and reduced-motion rules.
- Create `scripts/cloud-drive-model.js` — immutable paper inputs and pure scenario evaluation.
- Create `scripts/cloud-drive.js` — form/controller, figure filters, dialog, citation copy, and progressive enhancement.
- Create `tests/cloud-drive-model.test.js` — scientific reference and validation tests.
- Create `images/cloud-drive/figure-01.svg` through `figure-10.svg` — official paper figures; Figure 8 may internally combine the two official panels.
- Create `images/cloud-drive/og-cloud-drive.png` — article-specific social preview.
- Create `robots.txt` — public crawler policy and sitemap pointer.
- Create `sitemap.xml` — canonical homepage and article URLs.

---

### Task 1: Make the paper discoverable from the homepage

**Files:**

- Modify: `index.html`
- Modify: `tests/homepage-smoke.html`
- Create: `tests/site-content.test.js`

**Interfaces:**

- Consumes: the existing `#news` and `#publications` section structure.
- Produces: two descriptive links to `cloud-drive/` and one official arXiv PDF link used by later navigation checks.

- [ ] **Step 1: Add a failing automated homepage test**

Create `tests/site-content.test.js` with Node's built-in test runner:

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), "utf8");

test("homepage promotes the Cloud Drive paper and article", () => {
  const html = read("index.html");
  assert.match(
    html,
    /Can the Cloud Drive\? Infrastructure Feasibility of Offloading Autonomous Driving Across 5G and 6G/
  );
  assert.equal((html.match(/href="cloud-drive\/"/g) || []).length, 3);
  assert.match(html, /href="https:\/\/arxiv\.org\/pdf\/2607\.09045"/);
  assert.match(html, /arXiv:2607\.09045/);
});
```

- [ ] **Step 2: Run the test to verify the homepage requirement fails**

Run:

```bash
node --test tests/site-content.test.js
```

Expected: FAIL because the homepage does not contain the new title or links.

- [ ] **Step 3: Add the new first News and Publications entries**

Insert this as the first `#news li`:

```html
<li>
  <strong>2026:</strong> New preprint:
  <a href="cloud-drive/">Can the Cloud Drive?</a> explores when 5G/6G,
  cloud GPUs, and vehicle utilization make autonomous-driving offloading
  feasible.
</li>
```

Insert this as the first `#publications article`:

```html
<article>
  <h3>
    <a href="cloud-drive/">Can the Cloud Drive? Infrastructure Feasibility
    of Offloading Autonomous Driving Across 5G and 6G</a>
  </h3>
  <p><strong>Pouya Parsa</strong>, Kawon Han, and Seongjin Choi.
    arXiv:2607.09045, 2026.</p>
  <p>The study connects autonomous-driving model splits, cellular uplink
    limits, cloud GPU latency, and utilization-aware cost in a New York City
    case study.</p>
  <p>
    <a href="cloud-drive/">Explore the interactive article</a>
    &middot;
    <a href="https://arxiv.org/pdf/2607.09045">Read the paper</a>
  </p>
</article>
```

Update `tests/homepage-smoke.html` with matching DOM assertions:

```js
if (!text.includes("Can the Cloud Drive?")) {
  failures.push("Expected Cloud Drive publication title");
}
if (doc.querySelectorAll('a[href="cloud-drive/"]').length !== 3) {
  failures.push("Expected three links to the interactive Cloud Drive article");
}
if (!doc.querySelector('a[href="https://arxiv.org/pdf/2607.09045"]')) {
  failures.push("Expected official Cloud Drive paper link");
}
```

- [ ] **Step 4: Run homepage tests**

Run:

```bash
node --test tests/site-content.test.js
git diff --check
```

Expected: Node test PASS and no whitespace errors.

- [ ] **Step 5: Commit the homepage entry**

```bash
git add index.html tests/homepage-smoke.html tests/site-content.test.js
git commit -m "content: feature cloud drive paper on homepage"
```

---

### Task 2: Extract and validate all ten official paper figures

**Files:**

- Create: `images/cloud-drive/figure-01.svg`
- Create: `images/cloud-drive/figure-02.svg`
- Create: `images/cloud-drive/figure-03.svg`
- Create: `images/cloud-drive/figure-04.svg`
- Create: `images/cloud-drive/figure-05.svg`
- Create: `images/cloud-drive/figure-06.svg`
- Create: `images/cloud-drive/figure-07.svg`
- Create: `images/cloud-drive/figure-08.svg`
- Create: `images/cloud-drive/figure-09.svg`
- Create: `images/cloud-drive/figure-10.svg`
- Modify: `tests/site-content.test.js`

**Interfaces:**

- Consumes: official arXiv source archive `https://arxiv.org/e-print/2607.09045`.
- Produces: ten local, scalable, page-independent assets at stable names consumed by `cloud-drive/index.html`.

- [ ] **Step 1: Add a failing asset integrity test**

Append to `tests/site-content.test.js`:

```js
test("all ten official paper figures are present and non-empty", () => {
  for (let index = 1; index <= 10; index += 1) {
    const name = `images/cloud-drive/figure-${String(index).padStart(2, "0")}.svg`;
    const absolute = path.join(root, name);
    assert.equal(fs.existsSync(absolute), true, `${name} is missing`);
    assert.ok(fs.statSync(absolute).size > 1_000, `${name} is unexpectedly small`);
    assert.match(fs.readFileSync(absolute, "utf8"), /<svg[\s>]/);
  }
});
```

- [ ] **Step 2: Run the test to verify the figure assets are missing**

Run:

```bash
node --test tests/site-content.test.js
```

Expected: FAIL with `figure-01.svg is missing`.

- [ ] **Step 3: Fetch the official source and render source-PDF figures**

Use only the arXiv source, not screenshots or recreated artwork:

```bash
mkdir -p tmp/pdfs/source images/cloud-drive
curl -L https://arxiv.org/e-print/2607.09045 -o tmp/pdfs/cloud-drive-source.tar.gz
tar -xzf tmp/pdfs/cloud-drive-source.tar.gz -C tmp/pdfs/source
pdftocairo -svg tmp/pdfs/source/figures/Framework_Diagram.pdf images/cloud-drive/figure-01.svg
pdftocairo -svg tmp/pdfs/source/figures/bandwidth_capacity.pdf images/cloud-drive/figure-03.svg
pdftocairo -svg tmp/pdfs/source/figures/latency_budget_dual.pdf images/cloud-drive/figure-05.svg
pdftocairo -svg tmp/pdfs/source/figures/nyc/urban_penetration_frontier.pdf images/cloud-drive/figure-06.svg
pdftocairo -svg tmp/pdfs/source/figures/nyc/nyc_generation_requirement.pdf images/cloud-drive/figure-07.svg
pdftocairo -svg tmp/pdfs/source/figures/nyc/nyc_cost_crossover_100ms.pdf images/cloud-drive/figure-09.svg
pdftocairo -svg tmp/pdfs/source/figures/nyc/nyc_cost_ratio_grid_300ms_2028.pdf images/cloud-drive/figure-10.svg
```

For Figure 8, place the two official source PDFs side-by-side and convert the combined PDF to one SVG:

```bash
pdfjam --nup 2x1 --landscape --outfile tmp/pdfs/figure-08.pdf \
  tmp/pdfs/source/figures/compute_bound_floor_a.pdf \
  tmp/pdfs/source/figures/compute_bound_floor_b.pdf
pdftocairo -svg tmp/pdfs/figure-08.pdf images/cloud-drive/figure-08.svg
```

If `pdfjam` is unavailable, use ImageMagick only to append lossless 300 dpi panel renders and save Figure 8 as `figure-08.png`; update only Figure 8's HTML source and integrity assertion to the PNG path. Do not redraw chart paths or change data labels.

- [ ] **Step 4: Compile the two TikZ figures from official source**

Create two temporary standalone wrappers under `tmp/pdfs/source/` using `apply_patch`.

Figure 2 wrapper:

```tex
\documentclass[tikz,border=8pt]{standalone}
\usepackage{tikz}
\usepackage{pifont}
\usetikzlibrary{positioning,fit,arrows.meta,backgrounds,calc}
\begin{document}
\input{figures/offloading_spectrum.tex}
\end{document}
```

Figure 4 wrapper:

```tex
\documentclass[tikz,border=8pt]{standalone}
\usepackage{tikz}
\usepackage{amsmath}
\usetikzlibrary{positioning,fit,arrows.meta,backgrounds,calc}
\newcommand{\twemoji}[1]{}
\begin{document}
\input{latencyfig.tex}
\end{document}
```

Compile and convert:

```bash
latexmk -pdf -interaction=nonstopmode -halt-on-error tmp/pdfs/source/figure-02-wrapper.tex
latexmk -pdf -interaction=nonstopmode -halt-on-error tmp/pdfs/source/figure-04-wrapper.tex
pdftocairo -svg tmp/pdfs/source/figure-02-wrapper.pdf images/cloud-drive/figure-02.svg
pdftocairo -svg tmp/pdfs/source/figure-04-wrapper.pdf images/cloud-drive/figure-04.svg
```

If `standalone.cls` is unavailable, compile with `article`, `\pagestyle{empty}`, and `\usepackage[active,tightpage]{preview}` using `\PreviewEnvironment{tikzpicture}`; do not install a new TeX distribution.

- [ ] **Step 5: Run the asset integrity test**

Run:

```bash
node --test tests/site-content.test.js
```

Expected: homepage and all-ten-figures tests PASS.

- [ ] **Step 6: Commit only final figure assets and tests**

```bash
git add images/cloud-drive/figure-*.svg tests/site-content.test.js
git commit -m "assets: add official cloud drive paper figures"
```

Confirm `tmp/pdfs/` and the unrelated `main.tex` are not staged.

---

### Task 3: Build the semantic article, narrative, figure explorer, and scholarly metadata

**Files:**

- Create: `cloud-drive/index.html`
- Create: `css/cloud-drive.css`
- Modify: `tests/site-content.test.js`

**Interfaces:**

- Consumes: `images/cloud-drive/figure-01.svg` through `figure-10.svg`.
- Produces: stable section IDs, simulator DOM hooks, ten figure cards, FAQ content, JSON-LD, citation metadata, and no-JavaScript fallback content for Tasks 5–7.

- [ ] **Step 1: Add failing article structure and metadata tests**

Append:

```js
test("Cloud Drive article exposes semantic research and discovery metadata", () => {
  const html = read("cloud-drive/index.html");
  assert.match(html, /<title>Can the Cloud Drive\? Interactive 5G\/6G Study \| Pouya Parsa<\/title>/);
  assert.match(html, /rel="canonical" href="https:\/\/pouya-parsa\.github\.io\/cloud-drive\/"/);
  assert.match(html, /name="citation_title"/);
  assert.match(html, /name="citation_arxiv_id" content="2607\.09045"/);
  assert.match(html, /"@type":\s*"ScholarlyArticle"/);
  assert.match(html, /"@type":\s*"FAQPage"/);
  for (const id of [
    "answer", "three-gates", "simulator", "strategies",
    "figures", "findings", "limitations", "faq", "citation"
  ]) {
    assert.match(html, new RegExp(`id="${id}"`), `missing #${id}`);
  }
});

test("Cloud Drive article includes all ten captioned figures", () => {
  const html = read("cloud-drive/index.html");
  for (let index = 1; index <= 10; index += 1) {
    const padded = String(index).padStart(2, "0");
    assert.match(html, new RegExp(`id="figure-${index}"`));
    assert.match(html, new RegExp(`src="../images/cloud-drive/figure-${padded}\\.svg"`));
    assert.match(html, new RegExp(`Figure ${index}:`));
  }
  assert.equal((html.match(/<figure\b/g) || []).length, 10);
  assert.equal((html.match(/class="figure-why"/g) || []).length, 10);
});
```

- [ ] **Step 2: Run tests to verify the route is missing**

Run:

```bash
node --test tests/site-content.test.js
```

Expected: FAIL with `ENOENT` for `cloud-drive/index.html`.

- [ ] **Step 3: Create the complete no-JavaScript article**

Create `cloud-drive/index.html` with:

- a skip link and article-specific header with links to `#simulator`, `#figures`, the official PDF, and `../`;
- hero eyebrow `Interactive research article · July 2026`;
- the full paper title and author list;
- direct answer in `#answer`:

```html
<p class="answer-lead"><strong>Yes—but only conditionally, and in a specific
order.</strong> In dense cities, the uplink must carry the offloaded workload
first. The cloud must then return a decision within either a 100&nbsp;ms
reactive loop or a 300&nbsp;ms deliberative tier backed by a local reactive
controller. Only after both gates pass does shared cloud compute become an
economic question.</p>
```

- three `article.gate-story` sections ordered Communication → Compute → Cost;
- an accessible simulator form shell and static reference result matching the interface in Task 5;
- a three-column S1/S2/S3 comparison table with 100/25/3 Mbps uplink values and the paper's residual TOPS;
- all ten `<figure>` blocks using the complete captions from the approved design specification and paper;
- a unique result-oriented `alt` and a `p.figure-why` for each figure;
- concise findings, explicit limitations, and the reactive-fallback caveat;
- visible FAQ questions mirrored exactly in JSON-LD;
- a selectable BibTeX block:

```bibtex
@article{parsa2026cloud,
  title={Can the Cloud Drive? Infrastructure Feasibility of Offloading Autonomous Driving Across 5G and 6G},
  author={Parsa, Pouya and Han, Kawon and Choi, Seongjin},
  journal={arXiv preprint arXiv:2607.09045},
  year={2026}
}
```

- stylesheet link `../css/cloud-drive.css`;
- deferred scripts in this order:

```html
<script src="../scripts/cloud-drive-model.js" defer></script>
<script src="../scripts/cloud-drive.js" defer></script>
```

Use a JSON-LD `@graph` containing `ScholarlyArticle`, `Person`, `BreadcrumbList`, and `FAQPage`. Use `datePublished: "2026-07-10"`, `identifier: "arXiv:2607.09045"`, and the official arXiv abstract/PDF URLs. Do not include review ratings, citation counts, or other invented properties.

- [ ] **Step 4: Create the article's base visual system**

Create `css/cloud-drive.css` with these design tokens:

```css
:root {
  --paper: #f7f5ef;
  --surface: #ffffff;
  --ink: #102331;
  --muted: #53636d;
  --line: #d9e0df;
  --communication: #157a9c;
  --communication-soft: #e8f4f7;
  --compute: #b86b12;
  --compute-soft: #fff2df;
  --cost: #24835b;
  --cost-soft: #e9f5ee;
  --danger: #a43b35;
  --max-copy: 760px;
  --max-page: 1180px;
  --radius: 18px;
}
```

Implement:

- editorial 12-column desktop grid and single-column mobile flow;
- sticky article navigation only above 960 px;
- a dark navy hero with the three gate colors;
- `.gate-story` left border/color variants;
- readable long-form measure capped by `--max-copy`;
- `.strategy-grid`, `.figure-grid`, `.figure-card`, and `.faq-list`;
- visible focus states using `outline: 3px solid currentColor`;
- `@media (prefers-reduced-motion: reduce)` disabling animation and smooth scrolling;
- mobile controls and links with a minimum 44 px target size;
- print styles that remove controls and show all figure cards.

- [ ] **Step 5: Run structure and asset tests**

Run:

```bash
node --test tests/site-content.test.js
git diff --check
```

Expected: all tests PASS.

- [ ] **Step 6: Commit the complete static article**

```bash
git add cloud-drive/index.html css/cloud-drive.css tests/site-content.test.js
git commit -m "feat: add cloud drive interactive research article"
```

---

### Task 4: Implement and test the paper-faithful scenario model

**Files:**

- Create: `scripts/cloud-drive-model.js`
- Create: `tests/cloud-drive-model.test.js`

**Interfaces:**

- Consumes: a scenario object with keys `model`, `strategy`, `generation`, `budgetMs`, `penetration`, `utilization`, and `year`.
- Produces:

```ts
type ScenarioResult = {
  input: ScenarioInput;
  activeVehiclesPerCell: number;
  uplinkMbps: number;
  maxVehiclesPerCell: number;
  perVehicleRateMbps: number;
  deterministicFloorMs: number;
  stochasticAllowanceMs: number;
  estimatedTailMs: number;
  communicationPass: boolean;
  deterministicPass: boolean;
  tailPass: boolean;
  latencyPass: boolean;
  jointlyFeasible: boolean;
  firstBindingGate: "communication" | "compute" | "cost" | "none";
  onboardAnnualUsd: number;
  hybridAnnualUsd: number | null;
  cloudCheaper: boolean | null;
  caveats: string[];
};
```

Exports `SCENARIO_OPTIONS`, `REFERENCE_SCENARIO`, and `evaluateScenario(input)` through both `module.exports` and `globalThis.CloudDriveModel`.

- [ ] **Step 1: Write failing option, validation, and reference tests**

Create:

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const {
  SCENARIO_OPTIONS,
  REFERENCE_SCENARIO,
  evaluateScenario,
} = require("../scripts/cloud-drive-model.js");

test("scenario options exactly match the paper grid", () => {
  assert.deepEqual(SCENARIO_OPTIONS.models, ["E2E", "VLM", "VLA"]);
  assert.deepEqual(SCENARIO_OPTIONS.strategies, ["S1", "S2", "S3"]);
  assert.deepEqual(SCENARIO_OPTIONS.generations, ["5G", "5G-Advanced", "6G"]);
  assert.deepEqual(SCENARIO_OPTIONS.budgetsMs, [100, 300]);
  assert.deepEqual(SCENARIO_OPTIONS.penetrations, [0.1, 1, 5, 10, 20, 30, 50, 100]);
  assert.deepEqual(SCENARIO_OPTIONS.utilizations, [0.05, 0.12, 0.3, 0.45, 0.65, 1]);
});

test("invalid inputs fall back to the documented reference scenario", () => {
  const result = evaluateScenario({ model: "invalid", year: 2100 });
  assert.deepEqual(result.input, REFERENCE_SCENARIO);
  assert.match(result.caveats.join(" "), /reference scenario/i);
});

test("NYC reference loading is approximately 10 active vehicles per cell", () => {
  const result = evaluateScenario(REFERENCE_SCENARIO);
  assert.ok(Math.abs(result.activeVehiclesPerCell - 9.9) < 0.01);
});

test("5G fails S2 at the 10 percent, 0.45 dense reference point", () => {
  const result = evaluateScenario({
    ...REFERENCE_SCENARIO,
    generation: "5G",
  });
  assert.equal(result.communicationPass, false);
  assert.equal(result.firstBindingGate, "communication");
  assert.equal(result.hybridAnnualUsd, null);
});

test("2025 VLA deterministic floor fails the reactive budget for S1-S3", () => {
  for (const strategy of SCENARIO_OPTIONS.strategies) {
    const result = evaluateScenario({
      ...REFERENCE_SCENARIO,
      strategy,
      generation: "6G",
      year: 2025,
    });
    assert.equal(result.deterministicPass, false);
    assert.ok(result.deterministicFloorMs >= 132);
    assert.ok(result.deterministicFloorMs <= 164);
  }
});

test("6G admits dense VLA-S2 around 2028 but 5G-Advanced does not", () => {
  const sixG = evaluateScenario({
    ...REFERENCE_SCENARIO,
    generation: "6G",
    year: 2028,
  });
  const fiveGAdvanced = evaluateScenario({
    ...REFERENCE_SCENARIO,
    generation: "5G-Advanced",
    year: 2028,
  });
  assert.equal(sixG.jointlyFeasible, true);
  assert.equal(fiveGAdvanced.tailPass, false);
  assert.equal(fiveGAdvanced.hybridAnnualUsd, null);
});

test("the first VLA deterministic floor clears 100 ms around 2027", () => {
  const floor = (year) => Math.min(
    ...SCENARIO_OPTIONS.strategies.map((strategy) =>
      evaluateScenario({
        ...REFERENCE_SCENARIO,
        strategy,
        generation: "6G",
        year,
      }).deterministicFloorMs
    )
  );
  assert.ok(floor(2026) >= 100);
  assert.ok(floor(2027) < 100);
});

test("deliberative results always disclose the onboard reactive fallback", () => {
  const result = evaluateScenario({
    ...REFERENCE_SCENARIO,
    budgetMs: 300,
  });
  assert.match(result.caveats.join(" "), /onboard reactive fallback/i);
});
```

- [ ] **Step 2: Run tests to verify the model does not exist**

Run:

```bash
node --test tests/cloud-drive-model.test.js
```

Expected: FAIL with `Cannot find module '../scripts/cloud-drive-model.js'`.

- [ ] **Step 3: Implement immutable paper inputs and UMD-style exports**

Create `scripts/cloud-drive-model.js` around a frozen `PAPER` object:

```js
const PAPER = Object.freeze({
  fleetVehicles: 2_200_000,
  cellSites: 10_000,
  planningHz: 10,
  tailEpsilon: 1e-5,
  strategy: {
    S1: { uplinkMbps: 100, residualTops: { E2E: 5, VLM: 5, VLA: 5 } },
    S2: { uplinkMbps: 25, residualTops: { E2E: 16, VLM: 226, VLA: 550 } },
    S3: { uplinkMbps: 3, residualTops: { E2E: 82, VLM: 1194, VLA: 2900 } },
  },
  fullOnboardTops: { E2E: 85, VLM: 1235, VLA: 3000 },
  onboard2026Usd: { E2E: 400, VLM: 1000, VLA: 8500 },
  onboardAnnualDecline: { E2E: 0.08, VLM: 0.10, VLA: 0.15 },
  generationRank: { "5G": 0, "5G-Advanced": 1, "6G": 2, infeasible: 3 },
  generation: {
    "5G": { cellMHz: 50, singleUserEfficiency: 5 },
    "5G-Advanced": { cellMHz: 100, singleUserEfficiency: 7 },
    "6G": { cellMHz: 400, singleUserEfficiency: 20 },
  },
  gpu2025: {
    sustainedTflops: 1500,
    sustainedHbmGbps: 5600,
    computeGrowthInitial: 0.64,
    computeGrowthFloor: 0.10,
    hbmGrowthInitial: 0.31,
    hbmGrowthFloor: 0.07,
    slowdownLambda: 0.15,
  },
});

const SCENARIO_OPTIONS = Object.freeze({
  models: Object.freeze(["E2E", "VLM", "VLA"]),
  strategies: Object.freeze(["S1", "S2", "S3"]),
  generations: Object.freeze(["5G", "5G-Advanced", "6G"]),
  budgetsMs: Object.freeze([100, 300]),
  penetrations: Object.freeze([0.1, 1, 5, 10, 20, 30, 50, 100]),
  utilizations: Object.freeze([0.05, 0.12, 0.3, 0.45, 0.65, 1]),
  yearMin: 2025,
  yearMax: 2040,
});

const REFERENCE_SCENARIO = Object.freeze({
  model: "VLA",
  strategy: "S2",
  generation: "5G-Advanced",
  budgetMs: 100,
  penetration: 10,
  utilization: 0.45,
  year: 2028,
});
```

Encode Figure 7's complete minimum-generation map as the discrete communication gate. Rows are utilization `1`, `0.65`, `0.45`, `0.3`, `0.12`, and `0.05`; each row follows penetration `[0.1, 1, 5, 10, 20, 30, 50, 100]`:

```js
const COMMUNICATION_REQUIREMENT = Object.freeze({
  S1: Object.freeze({
    1:    ["5G", "5G-Advanced", "6G", "6G", "6G", "6G", "infeasible", "infeasible"],
    0.65: ["5G", "5G", "6G", "6G", "6G", "6G", "6G", "infeasible"],
    0.45: ["5G", "5G", "5G-Advanced", "6G", "6G", "6G", "6G", "infeasible"],
    0.3:  ["5G", "5G", "5G-Advanced", "6G", "6G", "6G", "6G", "6G"],
    0.12: ["5G", "5G", "5G", "5G-Advanced", "5G-Advanced", "6G", "6G", "6G"],
    0.05: ["5G", "5G", "5G", "5G", "5G-Advanced", "5G-Advanced", "5G-Advanced", "6G"],
  }),
  S2: Object.freeze({
    1:    ["5G", "5G", "5G-Advanced", "5G-Advanced", "6G", "6G", "6G", "6G"],
    0.65: ["5G", "5G", "5G", "5G-Advanced", "6G", "6G", "6G", "6G"],
    0.45: ["5G", "5G", "5G", "5G-Advanced", "5G-Advanced", "6G", "6G", "6G"],
    0.3:  ["5G", "5G", "5G", "5G", "5G-Advanced", "5G-Advanced", "6G", "6G"],
    0.12: ["5G", "5G", "5G", "5G", "5G", "5G", "5G-Advanced", "5G-Advanced"],
    0.05: ["5G", "5G", "5G", "5G", "5G", "5G", "5G", "5G-Advanced"],
  }),
  S3: Object.freeze({
    1:    ["5G", "5G", "5G", "5G", "5G", "5G", "5G-Advanced", "5G-Advanced"],
    0.65: ["5G", "5G", "5G", "5G", "5G", "5G", "5G", "5G-Advanced"],
    0.45: ["5G", "5G", "5G", "5G", "5G", "5G", "5G", "5G-Advanced"],
    0.3:  ["5G", "5G", "5G", "5G", "5G", "5G", "5G", "5G"],
    0.12: ["5G", "5G", "5G", "5G", "5G", "5G", "5G", "5G"],
    0.05: ["5G", "5G", "5G", "5G", "5G", "5G", "5G", "5G"],
  }),
});
```

The selected generation passes when its rank is at least the required generation's rank. For `maxVehiclesPerCell`, report the highest active-vehicles-per-cell value among the published grid cells that pass for the selected strategy/generation; label it “largest evaluated load” in the UI rather than implying a continuous radio-capacity measurement. Derive `perVehicleRateMbps` as the selected strategy's target rate when communication passes and `0` when it does not; do not invent an unreported SINR implementation parameter.

Expose exactly:

```js
const api = Object.freeze({
  SCENARIO_OPTIONS,
  REFERENCE_SCENARIO,
  evaluateScenario,
});

if (typeof module !== "undefined" && module.exports) module.exports = api;
if (typeof globalThis !== "undefined") globalThis.CloudDriveModel = api;
```

- [ ] **Step 4: Implement pure gate calculations**

Implement small private functions:

```js
function activeVehiclesPerCell(penetration, utilization) {
  return PAPER.fleetVehicles * (penetration / 100) * utilization / PAPER.cellSites;
}

function annualGrowth(initial, floor, year) {
  return floor + (initial - floor) *
    Math.exp(-PAPER.gpu2025.slowdownLambda * (year - 2025));
}

function evolved2025Value(base, initial, floor, year) {
  let value = base;
  for (let current = 2026; current <= year; current += 1) {
    value *= 1 + annualGrowth(initial, floor, current);
  }
  return value;
}
```

Compute deterministic floor as:

```js
Ldet = sensingMs + encodingMs[strategy] +
  computeBoundMs(model, strategy, year) +
  decodeBandwidthBoundMs(model, strategy, year) +
  actuationMs;
```

Calibrate the 2025 terms to the paper's reported reference points:

- VLA S1/S2/S3 total deterministic floor range: 132–164 ms;
- VLA-S2 decode term: approximately 114 ms;
- VLM-S2 inference: approximately 58 ms;
- E2E-S2 inference: approximately 1 ms;
- VLA floor first below 100 ms in 2027.

Implement the access-tail estimate from Equations 14–19 using cell load, the chosen strategy's capacity, and generation-specific shifted-exponential minima/means. Preserve the reported dense-reference override that 6G VLA-S2 is admitted around 2028 while 5G-Advanced remains reactive-infeasible across the study horizon; document this branch as a calibration to the published Figure 8 narrative, not an invented measurement.

Compute onboard annual cost from the exact Table 7 decline rates. Compute hybrid cost only after both feasibility gates pass:

```js
const onboardAnnualUsd =
  PAPER.onboard2026Usd[model] *
  Math.pow(1 - PAPER.onboardAnnualDecline[model], Math.max(0, year - 2026));
const residualShare =
  PAPER.strategy[strategy].residualTops[model] / PAPER.fullOnboardTops[model];
const residualAnnualUsd = onboardAnnualUsd * residualShare;
```

Add the annualized cloud GPU share using the paper's initially `$10K/year/GPU` value, 10 Hz demand, selected cloud workload, utilization pooling, and the paper's decelerating GPU evolution. Add strategy-dependent transport shares in the same order S1 > S2 > S3. Name the output `hybridAnnualUsd` and describe it in the UI as an analytical estimate; do not imply the article reruns the paper's full facility-location optimization.

- [ ] **Step 5: Run model tests and tune only against published anchors**

Run:

```bash
node --test tests/cloud-drive-model.test.js
```

Expected: all reference, validation, ordering, and caveat tests PASS.

- [ ] **Step 6: Add monotonic and economic-guard tests**

Append:

```js
test("active cell loading rises with penetration and utilization", () => {
  const low = evaluateScenario({
    ...REFERENCE_SCENARIO,
    penetration: 1,
    utilization: 0.05,
  });
  const high = evaluateScenario({
    ...REFERENCE_SCENARIO,
    penetration: 20,
    utilization: 0.65,
  });
  assert.ok(high.activeVehiclesPerCell > low.activeVehiclesPerCell);
});

test("cost is actionable only for jointly feasible branches", () => {
  for (const generation of SCENARIO_OPTIONS.generations) {
    const result = evaluateScenario({
      ...REFERENCE_SCENARIO,
      generation,
      year: 2025,
    });
    if (!result.jointlyFeasible) {
      assert.equal(result.hybridAnnualUsd, null);
      assert.equal(result.cloudCheaper, null);
    }
  }
});

test("admissible low-utilization VLA-S2 shows the published cost direction", () => {
  const result = evaluateScenario({
    ...REFERENCE_SCENARIO,
    generation: "6G",
    budgetMs: 300,
    penetration: 10,
    utilization: 0.12,
    year: 2028,
  });
  assert.equal(result.jointlyFeasible, true);
  assert.equal(result.cloudCheaper, true);
  assert.ok(result.hybridAnnualUsd < result.onboardAnnualUsd);
});

test("all 1296 published grid branches return finite gate values", () => {
  for (const model of SCENARIO_OPTIONS.models)
    for (const strategy of SCENARIO_OPTIONS.strategies)
      for (const generation of SCENARIO_OPTIONS.generations)
        for (const penetration of SCENARIO_OPTIONS.penetrations)
          for (const utilization of SCENARIO_OPTIONS.utilizations) {
            const result = evaluateScenario({
              model, strategy, generation, penetration, utilization,
              budgetMs: 100, year: 2026,
            });
            assert.ok(Number.isFinite(result.activeVehiclesPerCell));
            assert.ok(Number.isFinite(result.deterministicFloorMs));
            assert.equal(typeof result.jointlyFeasible, "boolean");
          }
});
```

Run:

```bash
node --test tests/cloud-drive-model.test.js
```

Expected: all tests PASS.

- [ ] **Step 7: Commit the analytical model**

```bash
git add scripts/cloud-drive-model.js tests/cloud-drive-model.test.js
git commit -m "feat: add cloud drive scenario model"
```

---

### Task 5: Connect the simulator UI with accessible, explained gate results

**Files:**

- Modify: `cloud-drive/index.html`
- Create: `scripts/cloud-drive.js`
- Modify: `css/cloud-drive.css`
- Modify: `tests/site-content.test.js`

**Interfaces:**

- Consumes: `globalThis.CloudDriveModel.evaluateScenario(input)` and `SCENARIO_OPTIONS`.
- Produces: `form#scenario-form`, `section#scenario-result[aria-live="polite"]`, sequential gate cards, a plain-language interpretation, and a shareable hash query.

- [ ] **Step 1: Add failing simulator contract tests**

Append:

```js
test("simulator exposes every input and an accessible live result", () => {
  const html = read("cloud-drive/index.html");
  for (const name of [
    "model", "strategy", "generation", "budgetMs",
    "penetration", "utilization", "year"
  ]) {
    assert.match(html, new RegExp(`name="${name}"`));
  }
  assert.match(html, /id="scenario-result"[^>]*aria-live="polite"/);
  assert.match(html, /id="gate-communication"/);
  assert.match(html, /id="gate-compute"/);
  assert.match(html, /id="gate-cost"/);
  assert.match(html, /<noscript>[\s\S]*reference scenario[\s\S]*<\/noscript>/i);
});

test("interactive controller contains no inline scientific constants", () => {
  const controller = read("scripts/cloud-drive.js");
  assert.doesNotMatch(controller, /2_200_000|8_500|5600|1500/);
  assert.match(controller, /CloudDriveModel\.evaluateScenario/);
});
```

- [ ] **Step 2: Run tests to verify the controller is missing**

Run:

```bash
node --test tests/site-content.test.js
```

Expected: FAIL because `scripts/cloud-drive.js` does not exist or simulator hooks are incomplete.

- [ ] **Step 3: Implement native simulator controls**

In `cloud-drive/index.html`, use a `form` with labeled native `select` controls and one bounded year input. Populate options in HTML so the form remains understandable without JavaScript. Use the reference values:

```html
<form id="scenario-form">
  <fieldset>
    <legend>Choose a published scenario</legend>
    <label for="scenario-model">Model class</label>
    <select id="scenario-model" name="model">
      <option>E2E</option><option>VLM</option><option selected>VLA</option>
    </select>
    <label for="scenario-strategy">Offloading strategy</label>
    <select id="scenario-strategy" name="strategy">
      <option>S1</option><option selected>S2</option><option>S3</option>
    </select>
    <label for="scenario-generation">Communication generation</label>
    <select id="scenario-generation" name="generation">
      <option>5G</option>
      <option selected>5G-Advanced</option>
      <option>6G</option>
    </select>
    <label for="scenario-budget">Latency tier</label>
    <select id="scenario-budget" name="budgetMs">
      <option value="100" selected>100 ms reactive</option>
      <option value="300">300 ms deliberative — onboard reactive fallback required</option>
    </select>
    <label for="scenario-penetration">AV penetration</label>
    <select id="scenario-penetration" name="penetration">
      <option>0.1</option><option>1</option><option>5</option>
      <option selected>10</option><option>20</option><option>30</option>
      <option>50</option><option>100</option>
    </select>
    <label for="scenario-utilization">Vehicle utilization</label>
    <select id="scenario-utilization" name="utilization">
      <option>0.05</option><option>0.12</option><option>0.3</option>
      <option selected>0.45</option><option>0.65</option><option>1</option>
    </select>
    <label for="scenario-year">GPU year: <output for="scenario-year">2028</output></label>
    <input id="scenario-year" name="year" type="range" min="2025" max="2040"
      step="1" value="2028">
  </fieldset>
</form>
```

Use `value="5G-Advanced"` and numeric string values that map directly to the model contract. Include helper copy under the 300 ms option: “Deliberative tier; requires an onboard reactive fallback.”

- [ ] **Step 4: Implement the controller without duplicating formulas**

Create `scripts/cloud-drive.js`:

```js
(() => {
  "use strict";

  const model = globalThis.CloudDriveModel;
  const form = document.querySelector("#scenario-form");
  const resultRegion = document.querySelector("#scenario-result");
  if (!model || !form || !resultRegion) return;

  function readScenario() {
    const data = new FormData(form);
    return {
      model: data.get("model"),
      strategy: data.get("strategy"),
      generation: data.get("generation"),
      budgetMs: Number(data.get("budgetMs")),
      penetration: Number(data.get("penetration")),
      utilization: Number(data.get("utilization")),
      year: Number(data.get("year")),
    };
  }

  function setGate(id, state, title, detail) {
    const gate = document.querySelector(id);
    gate.dataset.state = state;
    gate.querySelector(".gate-status").textContent = title;
    gate.querySelector(".gate-detail").textContent = detail;
  }

  function renderScenario(result) {
    const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
    setGate(
      "#gate-communication",
      result.communicationPass ? "pass" : "fail",
      result.communicationPass ? "Pass" : "Does not pass",
      `${number.format(result.activeVehiclesPerCell)} active vehicles/cell; ` +
        `${result.uplinkMbps} Mbps target uplink.`
    );
    setGate(
      "#gate-compute",
      !result.communicationPass ? "blocked" : result.latencyPass ? "pass" : "fail",
      !result.communicationPass ? "Not evaluated" :
        result.latencyPass ? "Pass" : "Does not pass",
      `${number.format(result.deterministicFloorMs)} ms deterministic floor; ` +
        `${number.format(result.estimatedTailMs)} ms estimated tail.`
    );
    setGate(
      "#gate-cost",
      !result.jointlyFeasible ? "blocked" :
        result.cloudCheaper ? "pass" : "fail",
      !result.jointlyFeasible ? "Not evaluated" :
        result.cloudCheaper ? "Cloud estimate is lower" : "Onboard estimate is lower",
      result.jointlyFeasible
        ? `$${number.format(result.hybridAnnualUsd)} hybrid vs. ` +
          `$${number.format(result.onboardAnnualUsd)} onboard per vehicle-year.`
        : "Cost is withheld until communication and latency both pass."
    );
    document.querySelector("#binding-summary").textContent =
      result.firstBindingGate === "none"
        ? "This branch clears all three gates under the paper’s assumptions."
        : `The first binding gate is ${result.firstBindingGate}.`;
    document.querySelector("#scenario-caveats").textContent =
      result.caveats.join(" ");
  }

  function update() {
    const result = model.evaluateScenario(readScenario());
    renderScenario(result);
    history.replaceState(null, "", `#scenario=${encodeURIComponent(
      Object.values(result.input).join(",")
    )}`);
  }

  form.addEventListener("input", update);
  form.addEventListener("change", update);
  update();
})();
```

`renderScenario` must update existing nodes with:

- loading `activeVehiclesPerCell` and `uplinkMbps`;
- communication pass/fail and available capacity;
- deterministic floor, tail estimate, and chosen budget;
- first binding gate;
- cost values only when `jointlyFeasible`;
- one concise interpretation sentence;
- all caveats, including the 300 ms local-fallback note.

Use `textContent`, not interpolated `innerHTML`, for dynamic values.

- [ ] **Step 5: Style gate states and the control panel**

Add:

```css
.gate-result[data-state="pass"] { border-color: var(--cost); }
.gate-result[data-state="fail"] { border-color: var(--danger); }
.gate-result[data-state="blocked"] { opacity: 0.62; }
.gate-status::before { content: "—"; }
[data-state="pass"] .gate-status::before { content: "Pass · "; }
[data-state="fail"] .gate-status::before { content: "Does not pass · "; }
```

Do not rely on these colors alone; the rendered text must include Pass, Does not pass, or Not evaluated.

- [ ] **Step 6: Run model and simulator contract tests**

Run:

```bash
node --test tests/cloud-drive-model.test.js tests/site-content.test.js
git diff --check
```

Expected: all tests PASS.

- [ ] **Step 7: Commit the simulator**

```bash
git add cloud-drive/index.html scripts/cloud-drive.js css/cloud-drive.css tests/site-content.test.js
git commit -m "feat: add interactive feasibility simulator"
```

---

### Task 6: Add figure filtering, enlargement, and citation interactions

**Files:**

- Modify: `cloud-drive/index.html`
- Modify: `scripts/cloud-drive.js`
- Modify: `css/cloud-drive.css`
- Modify: `tests/site-content.test.js`

**Interfaces:**

- Consumes: ten `.figure-card[data-category]` elements and visible BibTeX.
- Produces: filter buttons, accessible native `<dialog>`, figure deep links, Escape/restore-focus behavior, and citation copy feedback.

- [ ] **Step 1: Add failing progressive-enhancement interaction tests**

Append:

```js
test("figure explorer and citation controls have accessible fallbacks", () => {
  const html = read("cloud-drive/index.html");
  assert.match(html, /role="group" aria-label="Filter paper figures"/);
  for (const filter of ["all", "framework", "communication", "compute", "cost"]) {
    assert.match(html, new RegExp(`data-filter="${filter}"`));
  }
  assert.match(html, /<dialog id="figure-dialog"/);
  assert.match(html, /id="figure-dialog-close"[^>]*aria-label="Close enlarged figure"/);
  assert.match(html, /id="copy-citation"/);
  assert.match(html, /id="citation-status"[^>]*aria-live="polite"/);
});
```

- [ ] **Step 2: Run the test to verify interaction markup is absent**

Run:

```bash
node --test tests/site-content.test.js
```

Expected: FAIL on missing filter/dialog/citation hooks.

- [ ] **Step 3: Add filter, dialog, and citation markup**

Give every figure a space-separated category:

```html
<figure class="figure-card" id="figure-8" data-category="compute">
```

Add buttons with `aria-pressed`, starting with All set to `true`. Each figure enlargement button must include the number in its label, for example `aria-label="Enlarge Figure 8"`.

Use one native dialog:

```html
<dialog id="figure-dialog" aria-labelledby="figure-dialog-title">
  <button id="figure-dialog-close" type="button"
    aria-label="Close enlarged figure">Close</button>
  <h2 id="figure-dialog-title"></h2>
  <img id="figure-dialog-image" alt="">
  <p id="figure-dialog-caption"></p>
</dialog>
```

- [ ] **Step 4: Implement progressive interactions**

Extend `scripts/cloud-drive.js` with isolated initializers:

```js
function initFigureFilters() {}
function initFigureDialog() {}
function initCitationCopy() {}
```

Requirements:

- filters toggle `hidden` and `aria-pressed`; the All filter restores all figures;
- figure source, alt, title, and caption are copied from the selected card into the dialog;
- native `showModal()` is used when supported; otherwise the enlargement button follows the figure asset link in a new tab;
- Escape closes the dialog natively and focus returns to the launching button;
- copy uses `navigator.clipboard.writeText`, falls back to a selected text range, and reports success/failure in `#citation-status`;
- failure never hides the visible BibTeX.

- [ ] **Step 5: Style filters and dialog**

Add a wrapping filter bar, selected-state styling, `dialog::backdrop`, a viewport-constrained figure image, and a fixed visible close button. Ensure filtered content remains present in the HTML source.

- [ ] **Step 6: Run all tests**

Run:

```bash
node --test tests/cloud-drive-model.test.js tests/site-content.test.js
git diff --check
```

Expected: all tests PASS.

- [ ] **Step 7: Commit interaction work**

```bash
git add cloud-drive/index.html scripts/cloud-drive.js css/cloud-drive.css tests/site-content.test.js
git commit -m "feat: add interactive paper figure explorer"
```

---

### Task 7: Complete crawler discovery and social sharing

**Files:**

- Create: `robots.txt`
- Create: `sitemap.xml`
- Create: `images/cloud-drive/og-cloud-drive.png`
- Modify: `cloud-drive/index.html`
- Modify: `tests/site-content.test.js`

**Interfaces:**

- Consumes: the final article palette, title, three-gate motif, and canonical URL.
- Produces: crawlable sitemap/robots files and complete Open Graph/X metadata.

- [ ] **Step 1: Add failing crawler and social metadata tests**

Append:

```js
test("crawler and social discovery files use canonical URLs", () => {
  const robots = read("robots.txt");
  const sitemap = read("sitemap.xml");
  const html = read("cloud-drive/index.html");
  assert.match(robots, /User-agent: \*\s+Allow: \//);
  assert.match(robots, /Sitemap: https:\/\/pouya-parsa\.github\.io\/sitemap\.xml/);
  assert.match(sitemap, /<loc>https:\/\/pouya-parsa\.github\.io\/<\/loc>/);
  assert.match(sitemap, /<loc>https:\/\/pouya-parsa\.github\.io\/cloud-drive\/<\/loc>/);
  assert.match(html, /property="og:image" content="https:\/\/pouya-parsa\.github\.io\/images\/cloud-drive\/og-cloud-drive\.png"/);
  assert.match(html, /name="twitter:card" content="summary_large_image"/);
  assert.equal(
    fs.existsSync(path.join(root, "images/cloud-drive/og-cloud-drive.png")),
    true
  );
});
```

- [ ] **Step 2: Run the test to verify discovery assets are missing**

Run:

```bash
node --test tests/site-content.test.js
```

Expected: FAIL because `robots.txt`, `sitemap.xml`, and the social image are absent.

- [ ] **Step 3: Create the dedicated social preview with one image-generation request**

Use exactly one image-generation request with this prompt:

```text
Create a complete 1200×630 social preview card for the academic interactive
article “Can the Cloud Drive?” by Pouya Parsa, Kawon Han, and Seongjin Choi.
Match a refined editorial research website: dark navy background, warm white
typography, and three linked feasibility gates in cyan, amber, and green labeled
COMMUNICATION, COMPUTE, COST. Include the exact title “CAN THE CLOUD DRIVE?”
and subtitle “Offloading autonomous driving across 5G and 6G”. Use a subtle
abstract road-to-edge-compute motif made from clean geometric lines, no stock
photo, no vehicle brand, no extra claims, no invented numbers, no watermark.
Prioritize legibility in small link previews.
```

Inspect the result for exact title/subtitle text and author-free correctness. If the typography is incorrect or the output contains invented claims, omit `og:image` instead of shipping an inaccurate card; do not generate multiple alternatives. Save a passing result at `images/cloud-drive/og-cloud-drive.png`.

- [ ] **Step 4: Add exact robots and sitemap files**

`robots.txt`:

```text
User-agent: *
Allow: /

Sitemap: https://pouya-parsa.github.io/sitemap.xml
```

`sitemap.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://pouya-parsa.github.io/</loc>
  </url>
  <url>
    <loc>https://pouya-parsa.github.io/cloud-drive/</loc>
    <lastmod>2026-07-29</lastmod>
  </url>
</urlset>
```

- [ ] **Step 5: Wire complete Open Graph and X metadata**

Add `og:type=article`, canonical `og:url`, exact `og:title`, concise `og:description`, and `twitter:card=summary_large_image`. Add absolute image metadata only if the generated image passes text inspection.

- [ ] **Step 6: Run discovery tests**

Run:

```bash
node --test tests/site-content.test.js
git diff --check
```

Expected: all tests PASS.

- [ ] **Step 7: Commit discovery assets**

```bash
git add robots.txt sitemap.xml cloud-drive/index.html tests/site-content.test.js
git add images/cloud-drive/og-cloud-drive.png
git commit -m "feat: add cloud drive search and social metadata"
```

If the generated image failed inspection, omit both the image file and `og:image`, update the test to require no `og:image`, and commit the remaining valid metadata.

---

### Task 8: Run full verification and clean only task-owned temporary files

**Files:**

- Verify: `index.html`
- Verify: `cloud-drive/index.html`
- Verify: `css/cloud-drive.css`
- Verify: `scripts/cloud-drive-model.js`
- Verify: `scripts/cloud-drive.js`
- Verify: `images/cloud-drive/*`
- Verify: `robots.txt`
- Verify: `sitemap.xml`
- Verify: `tests/*`

**Interfaces:**

- Consumes: the completed static site.
- Produces: evidence that tests, routes, internal assets, structured data, and git scope are correct.

- [ ] **Step 1: Run the complete automated test suite**

Run:

```bash
node --test tests/site-content.test.js tests/cloud-drive-model.test.js
git diff --check
```

Expected: every test PASS and no whitespace errors.

- [ ] **Step 2: Validate JSON-LD as parseable JSON**

Run:

```bash
node -e 'const fs=require("fs"); const h=fs.readFileSync("cloud-drive/index.html","utf8"); const blocks=[...h.matchAll(/<script type="application\\/ld\\+json">([\\s\\S]*?)<\\/script>/g)]; if(blocks.length!==1) throw Error("expected one JSON-LD block"); JSON.parse(blocks[0][1]); console.log("JSON-LD PASS")'
```

Expected: `JSON-LD PASS`.

- [ ] **Step 3: Verify every local HTML asset resolves**

Run:

```bash
node -e 'const fs=require("fs"),p=require("path"); for(const file of ["index.html","cloud-drive/index.html"]){const h=fs.readFileSync(file,"utf8"); for(const m of h.matchAll(/(?:src|href)="([^"#?]+)"/g)){const u=m[1]; if(/^(?:https?:|mailto:)/.test(u)) continue; const target=p.resolve(p.dirname(file),u); if(!fs.existsSync(target)) throw Error(`${file}: missing ${u}`)}} console.log("local assets PASS")'
```

Expected: `local assets PASS`.

- [ ] **Step 4: Serve and probe both public routes**

Start:

```bash
python3 -m http.server 8000
```

In a second command:

```bash
curl -I http://127.0.0.1:8000/
curl -I http://127.0.0.1:8000/cloud-drive/
curl -I http://127.0.0.1:8000/images/cloud-drive/figure-10.svg
```

Expected: HTTP 200 for all three URLs. Stop only the HTTP server started for this task.

- [ ] **Step 5: Verify no-JavaScript completeness from source**

Run:

```bash
node -e 'const h=require("fs").readFileSync("cloud-drive/index.html","utf8").replace(/<script\\b[\\s\\S]*?<\\/script>/g,""); for(const s of ["Yes—but only conditionally","Figure 1:","Figure 10:","Frequently asked questions","@article{parsa2026cloud"]){if(!h.includes(s)) throw Error(`missing no-JS content: ${s}`)} console.log("no-JS content PASS")'
```

Expected: `no-JS content PASS`.

- [ ] **Step 6: Inspect git scope and remove task-owned temporary paper files**

First inspect:

```bash
git status --short
git diff --stat HEAD~7..HEAD
```

Confirm the unrelated `main.tex` remains untracked and unchanged. Remove only `/Users/parsa025/codes/pouya-parsa.github.io/tmp/pdfs/`, which was created for this task; do not target `tmp/` broadly if it contains anything else.

```bash
rm -rf /Users/parsa025/codes/pouya-parsa.github.io/tmp/pdfs
```

- [ ] **Step 7: Invoke verification-before-completion and record any final corrective commit**

Read and follow `superpowers:verification-before-completion`. If verification exposes a defect, add a focused regression assertion, fix the defect, rerun all commands above, then commit only the corrective files:

```bash
git add cloud-drive/index.html css/cloud-drive.css \
  scripts/cloud-drive-model.js scripts/cloud-drive.js \
  tests/site-content.test.js tests/cloud-drive-model.test.js
git commit -m "fix: complete cloud drive article verification"
```

Do not create an empty final commit when all checks already pass.
