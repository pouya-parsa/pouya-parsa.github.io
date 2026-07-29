# Cloud Drive DynamicMem+ Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the Cloud Drive article as a restrained academic project page inspired by DynamicMem while retaining and extending its paper-grounded simulator, figure explorer, scholarly content, and SEO/GEO structure.

**Architecture:** Preserve the static GitHub Pages stack and the existing split between semantic HTML, a pure scientific model, and a progressive-enhancement controller. Add immutable scenario presets to the model, reshape the article into a centered 980 px academic layout, replace the editorial CSS with a light token system, and expose controller state helpers for package-free Node tests.

**Tech Stack:** HTML5, CSS3, vanilla JavaScript, Node’s built-in `node:test`, existing SVG/PNG assets, GitHub Pages.

## Global Constraints

- Work only on branch `feat/cloud-drive-interactive` in `/Users/parsa025/codes/pouya-parsa.github.io/.worktrees/cloud-drive-interactive`.
- Preserve the unrelated untracked `/Users/parsa025/codes/pouya-parsa.github.io/main.tex`; never stage, modify, or delete it.
- Use `apply_patch` for repository text-file edits.
- Do not add a framework, package manager, build system, dependency, analytics service, API, or external font requirement.
- Preserve all ten official paper figures, full captions, alt text, “Why it matters” notes, figure categories, and stable `#figure-N` anchors.
- Preserve canonical URLs, citation metadata, Open Graph/X metadata, JSON-LD, FAQ content, `robots.txt`, `sitemap.xml`, and the social preview.
- Keep all scientific formulas and thresholds in `scripts/cloud-drive-model.js`; do not duplicate them in DOM code.
- Never show a cost recommendation unless both communication and latency pass.
- Every 300 ms result must retain the onboard 100 ms reactive-fallback caveat.
- Maintain complete no-JavaScript narrative, figure, citation, and static reference-scenario content.
- Maintain semantic structure, visible focus, 44 px targets, explicit status text, reduced motion, responsive behavior, and print output.
- Use white, pale gray, near-black, muted slate, and cobalt `#2f6df6` as the primary visual system. Use cyan, amber, and green only for communication, compute, and cost semantics.
- Do not change `index.html`, the paper figure assets, the social preview image, `robots.txt`, or `sitemap.xml` unless verification exposes a regression.

---

## File Map

- Modify `scripts/cloud-drive-model.js` — export four immutable paper-grid presets beside the existing options and evaluator.
- Modify `tests/cloud-drive-model.test.js` — lock preset inputs and promised results.
- Modify `cloud-drive/index.html` — compact academic hero, overview figure, fact strip, sticky section navigation, preset controls, and scenario-copy feedback.
- Replace `css/cloud-drive.css` — light 980 px academic layout, responsive cards, restrained simulator/figure treatments, sticky navigation, and print rules.
- Refactor `scripts/cloud-drive.js` — Node-safe state helpers, preset handling, scenario URL copying, current-section highlighting, and existing interactions.
- Create `tests/cloud-drive-controller.test.js` — pure serialization/parsing tests without a browser dependency.
- Modify `tests/site-content.test.js` — semantic redesign and progressive-enhancement contracts.

---

### Task 1: Add immutable, tested scenario presets

**Files:**

- Modify: `scripts/cloud-drive-model.js`
- Modify: `tests/cloud-drive-model.test.js`

**Interfaces:**

- Consumes: `REFERENCE_SCENARIO` and `evaluateScenario(input)`.
- Produces: `SCENARIO_PRESETS: Readonly<Record<string, {label: string, description: string, input: ScenarioInput}>>`, exported in Node and the browser through `CloudDriveModel`.

- [ ] **Step 1: Add failing preset contract tests**

Extend the existing import:

```js
const {
  SCENARIO_OPTIONS,
  REFERENCE_SCENARIO,
  SCENARIO_PRESETS,
  evaluateScenario,
} = require("../scripts/cloud-drive-model.js");
```

Append:

```js
test("scenario presets lock four valid paper-grid branches", () => {
  assert.deepEqual(Object.keys(SCENARIO_PRESETS), [
    "denseNyc",
    "fiveGBottleneck",
    "sixGVla",
    "lowUtilizationCost",
  ]);

  for (const preset of Object.values(SCENARIO_PRESETS)) {
    const result = evaluateScenario(preset.input);
    assert.deepEqual(result.input, preset.input);
    assert.ok(preset.label.length > 0);
    assert.ok(preset.description.length > 0);
    assert.equal(Object.isFrozen(preset.input), true);
  }
});

test("scenario presets demonstrate their promised feasibility regimes", () => {
  const dense = evaluateScenario(SCENARIO_PRESETS.denseNyc.input);
  const bottleneck = evaluateScenario(
    SCENARIO_PRESETS.fiveGBottleneck.input
  );
  const sixG = evaluateScenario(SCENARIO_PRESETS.sixGVla.input);
  const lowCost = evaluateScenario(
    SCENARIO_PRESETS.lowUtilizationCost.input
  );

  assert.equal(dense.firstBindingGate, "compute");
  assert.equal(bottleneck.firstBindingGate, "communication");
  assert.equal(sixG.jointlyFeasible, true);
  assert.equal(sixG.cloudCheaper, true);
  assert.equal(lowCost.jointlyFeasible, true);
  assert.equal(lowCost.cloudCheaper, true);
  assert.match(lowCost.caveats.join(" "), /onboard reactive fallback/i);
});
```

- [ ] **Step 2: Run the preset tests and verify failure**

Run:

```bash
node --test tests/cloud-drive-model.test.js
```

Expected: FAIL because `SCENARIO_PRESETS` is undefined.

- [ ] **Step 3: Define the exact presets beside `REFERENCE_SCENARIO`**

Add after `REFERENCE_SCENARIO`:

```js
  const SCENARIO_PRESETS = Object.freeze({
    denseNyc: Object.freeze({
      label: "Dense NYC Reference",
      description: "Feature-level VLA offloading is compute-bound in dense 5G-Advanced.",
      input: REFERENCE_SCENARIO,
    }),
    fiveGBottleneck: Object.freeze({
      label: "5G Bottleneck",
      description: "The same dense VLA-S2 branch runs into the communication gate first.",
      input: Object.freeze({
        ...REFERENCE_SCENARIO,
        generation: "5G",
      }),
    }),
    sixGVla: Object.freeze({
      label: "6G VLA",
      description: "In 2028, dense VLA-S2 clears the reactive corridor under the paper's 6G targets.",
      input: Object.freeze({
        ...REFERENCE_SCENARIO,
        generation: "6G",
      }),
    }),
    lowUtilizationCost: Object.freeze({
      label: "Low-Utilization Cost Case",
      description: "A deliberative VLA-S2 branch shows the pooling advantage at 12% utilization.",
      input: Object.freeze({
        ...REFERENCE_SCENARIO,
        budgetMs: 300,
        utilization: 0.12,
      }),
    }),
  });
```

Add `SCENARIO_PRESETS` to the frozen exported `api`.

- [ ] **Step 4: Run the complete model suite**

Run:

```bash
node --test tests/cloud-drive-model.test.js
node --check scripts/cloud-drive-model.js
git diff --check
```

Expected: all model tests PASS, both preset-result assertions match, syntax is valid, and no whitespace errors appear.

- [ ] **Step 5: Commit the preset model**

```bash
git add scripts/cloud-drive-model.js tests/cloud-drive-model.test.js
git commit -m "feat: add cloud drive scenario presets"
```

---

### Task 2: Reshape the article into a semantic academic project page

**Files:**

- Modify: `cloud-drive/index.html`
- Modify: `tests/site-content.test.js`

**Interfaces:**

- Consumes: existing article sections, all ten `.figure-card` elements, and the four keys from `CloudDriveModel.SCENARIO_PRESETS`.
- Produces: `.paper-hero`, `.overview-media`, `.paper-facts`, `.paper-nav`, `[data-preset]`, `#copy-scenario`, and `#scenario-link-status` hooks for Tasks 3–4.

- [ ] **Step 1: Add failing structure tests**

Append to `tests/site-content.test.js`:

```js
test("article uses the approved academic project-page structure", () => {
  const html = read("cloud-drive/index.html");
  assert.match(html, /class="paper-hero"/);
  assert.match(html, /class="project-badge">Interactive research article</);
  assert.match(html, /class="overview-media"/);
  assert.match(
    html,
    /class="paper-nav"[^>]*aria-label="Paper sections"/
  );

  for (const href of [
    "#overview",
    "#simulator",
    "#strategies",
    "#figures",
    "#findings",
    "#faq",
  ]) {
    assert.match(html, new RegExp(`href="${href}"`));
  }

  for (const fact of [
    /<dt>3<\/dt><dd>feasibility gates<\/dd>/,
    /<dt>1,296<\/dt><dd>scenarios<\/dd>/,
    /<dt>10<\/dt><dd>official figures<\/dd>/,
    /<dt>5G–6G<\/dt><dd>5G through 6G<\/dd>/,
  ]) {
    assert.match(html, fact);
  }
});

test("simulator exposes presets and a shareable-scenario fallback", () => {
  const html = read("cloud-drive/index.html");
  for (const preset of [
    "denseNyc",
    "fiveGBottleneck",
    "sixGVla",
    "lowUtilizationCost",
  ]) {
    assert.match(html, new RegExp(`data-preset="${preset}"`));
  }
  assert.match(html, /id="copy-scenario"/);
  assert.match(
    html,
    /id="scenario-link-status"[^>]*aria-live="polite"/
  );
});
```

- [ ] **Step 2: Run the content tests and verify failure**

Run:

```bash
node --test tests/site-content.test.js
```

Expected: FAIL because `.paper-hero`, `.paper-nav`, the fact strip, and preset/share controls do not exist.

- [ ] **Step 3: Replace the editorial header and hero**

Remove the existing dark `.article-header` and `.hero` markup. Begin `<main>` with:

```html
<header class="paper-hero" id="top">
  <div class="paper-wrap">
    <span class="project-badge">Interactive research article</span>
    <h1>
      <span>Can the Cloud Drive?</span>
      Infrastructure Feasibility of Offloading Autonomous Driving Across 5G and 6G
    </h1>
    <p class="paper-subtitle">When can autonomous-driving inference move from every vehicle to shared edge-cloud infrastructure?</p>
    <p class="paper-authors"><strong>Pouya Parsa</strong>, Kawon Han, and Seongjin Choi</p>
    <p class="paper-affiliation">University of Minnesota Twin Cities</p>
    <p class="paper-venue">Preprint · July 2026 · arXiv:2607.09045</p>
    <div class="resource-links" aria-label="Paper resources">
      <a class="button button-primary" href="https://arxiv.org/pdf/2607.09045">Paper ↗</a>
      <a class="button" href="#simulator">Interactive simulator</a>
      <a class="button" href="../">Portfolio</a>
    </div>
  </div>
</header>
```

Keep the exact scholarly metadata and JSON-LD in `<head>`.

- [ ] **Step 4: Add the overview image and fact strip**

Immediately after the hero, add:

```html
<section class="opening-section" id="overview" aria-labelledby="overview-heading">
  <div class="paper-wrap">
    <h2 class="visually-hidden" id="overview-heading">Paper overview</h2>
    <div class="overview-media">
      <a href="#figure-1" aria-label="Jump to the full Figure 1 caption">
        <img src="../images/cloud-drive/figure-01.svg"
          alt="Flowchart linking communication, compute latency, joint feasibility, infrastructure optimization, and cost crossover.">
      </a>
      <p>The paper evaluates communication, compute latency, and cost in sequence before declaring an offloading branch viable.</p>
    </div>
    <dl class="paper-facts" aria-label="Study at a glance">
      <div><dt>3</dt><dd>feasibility gates</dd></div>
      <div><dt>1,296</dt><dd>scenarios</dd></div>
      <div><dt>10</dt><dd>official figures</dd></div>
      <div><dt>5G–6G</dt><dd>5G through 6G</dd></div>
    </dl>
  </div>
</section>
```

This uses a `div`, not another `<figure>`, so the page still contains exactly ten semantic paper figures.

- [ ] **Step 5: Add the sticky paper navigation**

Place after the opening section:

```html
<nav class="paper-nav" aria-label="Paper sections">
  <div class="paper-nav-inner">
    <a href="#overview" aria-current="location">Overview</a>
    <a href="#simulator">Simulator</a>
    <a href="#strategies">Strategies</a>
    <a href="#figures">Figures</a>
    <a href="#findings">Findings</a>
    <a href="#faq">FAQ</a>
  </div>
</nav>
```

Keep all current section IDs. Add `class="paper-wrap"` to each section’s direct content wrapper, using one wrapper per section. Convert the three gate stories, strategy cards, limitation cards, findings, FAQ, and citation to the shared neutral card/section classes without shortening their text.

- [ ] **Step 6: Add preset and scenario-copy controls**

Inside `#scenario-form`, before `.control-grid`, add:

```html
<div class="preset-picker">
  <p>Start with a paper scenario</p>
  <div class="preset-buttons" role="group" aria-label="Scenario presets">
    <button type="button" data-preset="denseNyc" aria-pressed="true">Dense NYC Reference</button>
    <button type="button" data-preset="fiveGBottleneck" aria-pressed="false">5G Bottleneck</button>
    <button type="button" data-preset="sixGVla" aria-pressed="false">6G VLA</button>
    <button type="button" data-preset="lowUtilizationCost" aria-pressed="false">Low-Utilization Cost</button>
  </div>
  <p id="preset-description">Feature-level VLA offloading is compute-bound in dense 5G-Advanced.</p>
</div>
```

Inside `.result-intro`, after `#scenario-selection`, add:

```html
<div class="scenario-share">
  <button type="button" id="copy-scenario">Copy scenario link</button>
  <span id="scenario-link-status" aria-live="polite"></span>
</div>
```

The visible labels must remain useful before JavaScript initializes.

- [ ] **Step 7: Preserve and validate all content contracts**

Run:

```bash
node --test tests/site-content.test.js tests/cloud-drive-model.test.js
node -e 'const fs=require("fs"); const h=fs.readFileSync("cloud-drive/index.html","utf8"); const blocks=[...h.matchAll(/<script type="application\\/ld\\+json">([\\s\\S]*?)<\\/script>/g)]; if(blocks.length!==1) throw Error("expected one JSON-LD block"); JSON.parse(blocks[0][1]); console.log("JSON-LD PASS")'
git diff --check
```

Expected: all tests PASS, JSON-LD parses, there are still exactly ten `<figure>` elements, and every existing section/metadata assertion remains green.

- [ ] **Step 8: Commit the semantic redesign**

```bash
git add cloud-drive/index.html tests/site-content.test.js
git commit -m "refactor: simplify cloud drive article structure"
```

---

### Task 3: Replace the editorial stylesheet with the light academic system

**Files:**

- Modify: `css/cloud-drive.css`
- Modify: `tests/site-content.test.js`

**Interfaces:**

- Consumes: the Task 2 class hooks and all existing simulator, figure, dialog, FAQ, and citation state attributes.
- Produces: a responsive 980 px white academic layout, sticky navigation, neutral cards, semantic gate states, reduced-motion behavior, and print output.

- [ ] **Step 1: Add failing visual-system contract tests**

Append:

```js
test("article stylesheet exposes the approved light academic system", () => {
  const css = read("css/cloud-drive.css");
  assert.match(css, /--accent:\s*#2f6df6/);
  assert.match(css, /--max-width:\s*980px/);
  assert.match(css, /\.paper-hero\s*\{/);
  assert.match(css, /\.paper-nav\s*\{[\s\S]*position:\s*sticky/);
  assert.match(css, /\.paper-facts\s*\{[\s\S]*display:\s*grid/);
  assert.match(css, /\.figure-grid\s*\{[\s\S]*grid-template-columns:\s*repeat\(2/);
  assert.match(css, /@media\s*\(max-width:\s*760px\)/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(css, /@media\s*print/);
});
```

- [ ] **Step 2: Run the content tests and verify failure**

Run:

```bash
node --test tests/site-content.test.js
```

Expected: FAIL because the existing stylesheet uses the editorial navy system and does not expose the approved tokens/classes.

- [ ] **Step 3: Replace the root system and global layout**

Replace `css/cloud-drive.css`; begin with:

```css
:root {
  --background: #ffffff;
  --surface: #f7f8fb;
  --surface-blue: #eaf0ff;
  --ink: #1a1a1f;
  --muted: #5b6170;
  --line: #e6e8ee;
  --accent: #2f6df6;
  --communication: #168ca8;
  --compute: #b87316;
  --cost: #21845b;
  --danger: #b42318;
  --max-width: 980px;
  --reading-width: 760px;
  --radius: 14px;
}

* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0;
  color: var(--ink);
  background: var(--background);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
    "Segoe UI", sans-serif;
  line-height: 1.65;
  -webkit-font-smoothing: antialiased;
}
.paper-wrap {
  width: min(calc(100% - 48px), var(--max-width));
  margin-inline: auto;
}
section[id] { scroll-margin-top: 72px; }
a { color: var(--accent); }
:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
```

Use a `.visually-hidden` utility that preserves screen-reader access.

- [ ] **Step 4: Implement the compact hero, resources, opening, and navigator**

Use:

```css
.paper-hero {
  padding: 68px 0 34px;
  text-align: center;
  background: radial-gradient(900px 280px at 50% -40px, var(--surface-blue), transparent 72%);
  border-bottom: 1px solid var(--line);
}
.project-badge {
  display: inline-block;
  padding: 5px 12px;
  color: var(--accent);
  background: var(--surface-blue);
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.paper-hero h1 {
  max-width: 900px;
  margin: 18px auto 10px;
  font-size: clamp(2rem, 4.6vw, 3rem);
  line-height: 1.12;
  letter-spacing: -0.025em;
}
.paper-hero h1 span { color: var(--accent); }
.paper-subtitle {
  max-width: 720px;
  margin: 0 auto 22px;
  color: var(--muted);
  font-size: 1.12rem;
}
.resource-links,
.preset-buttons,
.figure-filters {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.7rem;
}
.button,
.preset-buttons button,
.figure-filters button,
.figure-expand,
#copy-scenario,
#copy-citation,
#figure-dialog-close {
  min-height: 44px;
  padding: 0.65rem 1rem;
  color: var(--ink);
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 999px;
  font: inherit;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
}
.button-primary,
.preset-buttons button[aria-pressed="true"],
.figure-filters button[aria-pressed="true"] {
  color: #fff;
  background: var(--ink);
  border-color: var(--ink);
}
.opening-section { padding: 42px 0 28px; }
.overview-media img {
  width: 100%;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--radius);
}
.overview-media p {
  max-width: var(--reading-width);
  margin: 12px auto 0;
  color: var(--muted);
  text-align: center;
}
.paper-facts {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin: 28px 0 0;
}
.paper-facts div {
  padding: 18px 12px;
  text-align: center;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
}
.paper-facts dt {
  color: var(--accent);
  font-size: 1.55rem;
  font-weight: 800;
}
.paper-facts dd { margin: 2px 0 0; color: var(--muted); font-size: 0.82rem; }
.paper-nav {
  position: sticky;
  z-index: 20;
  top: 0;
  background: rgba(255, 255, 255, 0.94);
  border-block: 1px solid var(--line);
  backdrop-filter: blur(12px);
}
.paper-nav-inner {
  display: flex;
  width: min(calc(100% - 48px), var(--max-width));
  margin-inline: auto;
  overflow-x: auto;
}
.paper-nav a {
  flex: 0 0 auto;
  padding: 13px 14px;
  color: var(--muted);
  border-bottom: 2px solid transparent;
  text-decoration: none;
}
.paper-nav a[aria-current="location"] {
  color: var(--accent);
  border-bottom-color: var(--accent);
}
```

- [ ] **Step 5: Style content, simulator, figures, dialog, and gate states**

Use a shared section rhythm:

```css
.article-section {
  padding: 52px 0;
  border-bottom: 1px solid var(--line);
}
.section-heading {
  max-width: 720px;
  margin: 0 auto 30px;
  text-align: center;
}
.section-heading h2 {
  margin: 0 0 8px;
  font-size: clamp(1.65rem, 3vw, 2rem);
  line-height: 1.2;
}
.section-heading p { margin: 0; color: var(--muted); }
.gate-stories,
.strategy-grid,
.limitations-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}
.gate-story,
.strategy-card,
.limitations-grid article,
.simulator-shell,
.scenario-result,
.figure-card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: none;
}
.gate-story.communication { border-top: 3px solid var(--communication); }
.gate-story.compute { border-top: 3px solid var(--compute); }
.gate-story.cost { border-top: 3px solid var(--cost); }
.simulator-shell { padding: clamp(18px, 3vw, 30px); }
.preset-picker {
  padding-bottom: 20px;
  margin-bottom: 22px;
  text-align: center;
  border-bottom: 1px solid var(--line);
}
.control-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}
.result-gates {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}
.gate-result[data-state="pass"] { border-top-color: var(--cost); }
.gate-result[data-state="fail"] { border-top-color: var(--danger); }
.gate-result[data-state="blocked"] { opacity: 0.64; }
.figure-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}
.figure-card {
  display: flex;
  flex-direction: column;
  margin: 0;
  overflow: hidden;
  background: #fff;
}
.figure-image-link {
  display: grid;
  min-height: 300px;
  padding: 18px;
  place-items: center;
  border-bottom: 1px solid var(--line);
}
.figure-image-link img { width: 100%; max-height: 480px; object-fit: contain; }
```

Retain explicit styles for native controls, table overflow, FAQ details, BibTeX,
dialog/backdrop, footer, hidden figure cards, and citation feedback. Do not use
shadows larger than `0 8px 24px rgba(26, 26, 31, 0.06)`.

- [ ] **Step 6: Add responsive, reduced-motion, and print rules**

Use:

```css
@media (max-width: 760px) {
  .paper-wrap,
  .paper-nav-inner { width: min(calc(100% - 32px), var(--max-width)); }
  .paper-hero { padding-top: 48px; }
  .paper-facts { grid-template-columns: repeat(2, 1fr); }
  .gate-stories,
  .strategy-grid,
  .limitations-grid,
  .control-grid,
  .result-gates,
  .figure-grid { grid-template-columns: 1fr; }
  .figure-image-link { min-height: 220px; padding: 12px; }
}

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

@media print {
  .paper-nav,
  .resource-links,
  #scenario-form,
  .figure-tools,
  .figure-expand,
  #figure-dialog,
  #copy-scenario,
  #copy-citation,
  .article-footer { display: none !important; }
  body, .paper-hero, .article-section { color: #000; background: #fff; }
  .figure-grid { display: block; }
  .figure-card { margin-bottom: 1rem; break-inside: avoid; }
}
```

- [ ] **Step 7: Run structure/style tests**

Run:

```bash
node --test tests/site-content.test.js tests/cloud-drive-model.test.js
git diff --check
```

Expected: all tests PASS and the stylesheet contains every responsive,
accessibility, and print contract.

- [ ] **Step 8: Commit the visual redesign**

```bash
git add css/cloud-drive.css tests/site-content.test.js
git commit -m "style: adopt light academic cloud drive design"
```

---

### Task 4: Add tested scenario sharing, presets, and current-section navigation

**Files:**

- Modify: `scripts/cloud-drive.js`
- Create: `tests/cloud-drive-controller.test.js`
- Modify: `tests/site-content.test.js`

**Interfaces:**

- Consumes: `CloudDriveModel.SCENARIO_PRESETS`, `CloudDriveModel.evaluateScenario(input)`, Task 2 DOM hooks, and the existing `#scenario=` hash format.
- Produces: `CloudDriveController.serializeScenario(input): string`, `CloudDriveController.parseScenarioHash(hash): ScenarioInput|null`, preset rendering, copied URLs, and `aria-current="location"` navigation state.

- [ ] **Step 1: Add failing pure controller tests**

Create `tests/cloud-drive-controller.test.js`:

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const {
  serializeScenario,
  parseScenarioHash,
} = require("../scripts/cloud-drive.js");
const {
  REFERENCE_SCENARIO,
  SCENARIO_PRESETS,
  evaluateScenario,
} = require("../scripts/cloud-drive-model.js");

test("scenario hash round-trips typed inputs", () => {
  for (const preset of Object.values(SCENARIO_PRESETS)) {
    const hash = serializeScenario(preset.input);
    assert.match(hash, /^#scenario=/);
    assert.deepEqual(parseScenarioHash(hash), preset.input);
  }
});

test("malformed scenario hashes return null", () => {
  assert.equal(parseScenarioHash(""), null);
  assert.equal(parseScenarioHash("#other=value"), null);
  assert.equal(parseScenarioHash("#scenario=VLA%7CS2"), null);
});

test("parsed shared scenarios remain validated by the model", () => {
  const parsed = parseScenarioHash(serializeScenario(REFERENCE_SCENARIO));
  assert.deepEqual(evaluateScenario(parsed).input, REFERENCE_SCENARIO);
});
```

Extend the controller contract in `tests/site-content.test.js`:

```js
test("controller initializes presets, scenario copy, and section navigation", () => {
  const controller = read("scripts/cloud-drive.js");
  assert.match(controller, /function initPresetControls\(\)/);
  assert.match(controller, /function initScenarioCopy\(\)/);
  assert.match(controller, /function initSectionNavigation\(\)/);
  assert.match(controller, /SCENARIO_PRESETS/);
  assert.match(controller, /IntersectionObserver/);
});
```

- [ ] **Step 2: Run tests and verify the Node import fails**

Run:

```bash
node --test tests/cloud-drive-controller.test.js tests/site-content.test.js
```

Expected: FAIL because `scripts/cloud-drive.js` touches `document` during import and exports no state helpers.

- [ ] **Step 3: Refactor the controller into a Node-safe UMD wrapper**

Replace the outer wrapper and inline hash helpers with:

```js
(function initCloudDriveController(globalScope) {
  "use strict";

  const HASH_FIELDS = Object.freeze([
    "model",
    "strategy",
    "generation",
    "budgetMs",
    "penetration",
    "utilization",
    "year",
  ]);
  const NUMERIC_FIELDS = new Set([
    "budgetMs",
    "penetration",
    "utilization",
    "year",
  ]);

  function serializeScenario(input) {
    const value = HASH_FIELDS.map((field) => input[field]).join("|");
    return `#scenario=${encodeURIComponent(value)}`;
  }

  function parseScenarioHash(hash) {
    if (typeof hash !== "string" || !hash.startsWith("#scenario=")) {
      return null;
    }
    let values;
    try {
      values = decodeURIComponent(hash.slice("#scenario=".length)).split("|");
    } catch {
      return null;
    }
    if (values.length !== HASH_FIELDS.length) return null;

    return Object.freeze(
      Object.fromEntries(
        HASH_FIELDS.map((field, index) => [
          field,
          NUMERIC_FIELDS.has(field) ? Number(values[index]) : values[index],
        ])
      )
    );
  }

  const api = Object.freeze({
    HASH_FIELDS,
    serializeScenario,
    parseScenarioHash,
  });
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (globalScope) globalScope.CloudDriveController = api;
  if (!globalScope || !globalScope.document) return;

  const document = globalScope.document;
  // Existing DOM initialization and functions continue here.
})(typeof globalThis !== "undefined" ? globalThis : this);
```

Replace `writeScenarioHash` with `history.replaceState(null, "", serializeScenario(result.input))`.
Replace `readScenarioHash` so it calls `parseScenarioHash(location.hash)` and
passes each returned field through the existing `setControlValue`.

Update the native-select branch in `setControlValue` so typed numeric hash
values match HTML option strings:

```js
    if (control instanceof HTMLSelectElement) {
      const normalizedValue = String(value);
      const exists = Array.from(control.options).some(
        (option) => option.value === normalizedValue
      );
      if (exists) control.value = normalizedValue;
      return;
    }
```

- [ ] **Step 4: Implement preset selection through the existing update path**

Add `initPresetControls()` after form/model elements are available:

```js
  function setScenarioControls(input) {
    HASH_FIELDS.forEach((field) => setControlValue(field, input[field]));
    yearOutput.textContent = input.year;
  }

  function setActivePreset(activeKey) {
    document.querySelectorAll("[data-preset]").forEach((button) => {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.preset === activeKey)
      );
    });
  }

  function presetKeyForScenario(input) {
    return Object.entries(model.SCENARIO_PRESETS).find(([, preset]) =>
      HASH_FIELDS.every((field) => preset.input[field] === input[field])
    )?.[0] || null;
  }

  function initPresetControls() {
    const buttons = Array.from(document.querySelectorAll("[data-preset]"));
    const description = document.querySelector("#preset-description");
    const presets = model.SCENARIO_PRESETS;
    if (!buttons.length || !description || !presets) return;

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const key = button.dataset.preset;
        const preset = presets[key];
        if (!preset) return;
        setScenarioControls(preset.input);
        setActivePreset(key);
        description.textContent = preset.description;
        update(true);
      });
    });

    form.addEventListener("input", () => {
      setActivePreset(null);
      description.textContent = "Custom scenario";
    });

    const initialResult = model.evaluateScenario(readScenario());
    const initialKey = presetKeyForScenario(initialResult.input);
    setActivePreset(initialKey);
    description.textContent = initialKey
      ? presets[initialKey].description
      : "Custom scenario";
  }
```

Call `initPresetControls()` once after hash restoration and before the initial
`update(false)`. Do not attach a second simulator update listener; preserve one
`form.addEventListener("input", ...)` rendering path.

- [ ] **Step 5: Implement scenario-link copying**

Add:

```js
  function initScenarioCopy() {
    const button = document.querySelector("#copy-scenario");
    const status = document.querySelector("#scenario-link-status");
    if (!button || !status) return;

    button.addEventListener("click", async () => {
      const result = model.evaluateScenario(readScenario());
      const hash = serializeScenario(result.input);
      history.replaceState(null, "", hash);
      const shareUrl = `${location.origin}${location.pathname}${location.search}${hash}`;

      try {
        if (!navigator.clipboard || !navigator.clipboard.writeText) {
          throw new Error("Clipboard unavailable");
        }
        await navigator.clipboard.writeText(shareUrl);
        status.textContent = "Scenario link copied.";
      } catch {
        status.textContent = "Copy the scenario URL from the address bar.";
      }
    });
  }
```

Call `initScenarioCopy()` only after the form and model guards pass.

- [ ] **Step 6: Implement current-section highlighting**

Add:

```js
  function initSectionNavigation() {
    const links = Array.from(document.querySelectorAll(".paper-nav a[href^='#']"));
    if (!links.length || !("IntersectionObserver" in globalScope)) return;

    const linkById = new Map(
      links.map((link) => [link.getAttribute("href").slice(1), link])
    );
    const sections = Array.from(linkById.keys())
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    const observer = new globalScope.IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        links.forEach((link) => link.removeAttribute("aria-current"));
        linkById
          .get(visible.target.id)
          ?.setAttribute("aria-current", "location");
      },
      { rootMargin: "-20% 0px -65% 0px", threshold: [0, 0.2, 0.6] }
    );
    sections.forEach((section) => observer.observe(section));
  }
```

Call it with the figure/citation enhancements before the model/form early return,
so section navigation can work even if the simulator model fails to load.

- [ ] **Step 7: Run controller and regression tests**

Run:

```bash
node --test tests/cloud-drive-controller.test.js tests/cloud-drive-model.test.js tests/site-content.test.js
node --check scripts/cloud-drive.js
git diff --check
```

Expected: all tests PASS; scenario hashes round-trip for all four presets; the
controller parses in Node and the browser.

- [ ] **Step 8: Commit the interaction refinement**

```bash
git add scripts/cloud-drive.js tests/cloud-drive-controller.test.js tests/site-content.test.js
git commit -m "feat: add cloud drive presets and shareable navigation"
```

---

### Task 5: Verify the redesign in desktop and mobile browsers

**Files:**

- Verify: `cloud-drive/index.html`
- Verify: `css/cloud-drive.css`
- Verify: `scripts/cloud-drive-model.js`
- Verify: `scripts/cloud-drive.js`
- Verify: `tests/cloud-drive-model.test.js`
- Verify: `tests/cloud-drive-controller.test.js`
- Verify: `tests/site-content.test.js`
- Modify only if a focused regression is found.

**Interfaces:**

- Consumes: the completed static page.
- Produces: fresh evidence for model behavior, content preservation, asset resolution, desktop/mobile rendering, interactions, and repository scope.

- [ ] **Step 1: Run the complete automated suite**

Run:

```bash
node --test tests/cloud-drive-model.test.js tests/cloud-drive-controller.test.js tests/site-content.test.js
node --check scripts/cloud-drive-model.js
node --check scripts/cloud-drive.js
git diff --check
```

Expected: every test PASS, both scripts parse, and no whitespace errors appear.

- [ ] **Step 2: Validate structured data and local assets**

Run:

```bash
node -e 'const fs=require("fs"); const h=fs.readFileSync("cloud-drive/index.html","utf8"); const blocks=[...h.matchAll(/<script type="application\\/ld\\+json">([\\s\\S]*?)<\\/script>/g)]; if(blocks.length!==1) throw Error("expected one JSON-LD block"); JSON.parse(blocks[0][1]); console.log("JSON-LD PASS")'
node -e 'const fs=require("fs"),p=require("path"); for(const file of ["index.html","cloud-drive/index.html"]){const h=fs.readFileSync(file,"utf8"); for(const m of h.matchAll(/(?:src|href)="([^"#?]+)"/g)){const u=m[1]; if(/^(?:https?:|mailto:)/.test(u)) continue; const target=p.resolve(p.dirname(file),u); if(!fs.existsSync(target)) throw Error(`${file}: missing ${u}`)}} console.log("local assets PASS")'
```

Expected: `JSON-LD PASS` and `local assets PASS`.

- [ ] **Step 3: Verify no-JavaScript completeness**

Run:

```bash
node -e 'const h=require("fs").readFileSync("cloud-drive/index.html","utf8").replace(/<script\\b[\\s\\S]*?<\\/script>/g,""); for(const s of ["Yes—but only conditionally","Figure 1:","Figure 10:","Frequently asked questions","@article{parsa2026cloud","Dense NYC Reference"]){if(!h.includes(s)) throw Error(`missing no-JS content: ${s}`)} console.log("no-JS content PASS")'
```

Expected: `no-JS content PASS`.

- [ ] **Step 4: Serve and probe public routes**

If the task-owned preview server is not already running, start:

```bash
python3 -m http.server 8000
```

Probe:

```bash
for url in \
  http://127.0.0.1:8000/ \
  http://127.0.0.1:8000/cloud-drive/ \
  http://127.0.0.1:8000/images/cloud-drive/figure-10.svg \
  http://127.0.0.1:8000/images/cloud-drive/og-cloud-drive.png \
  http://127.0.0.1:8000/robots.txt \
  http://127.0.0.1:8000/sitemap.xml
do
  curl --silent --show-error --output /dev/null \
    --write-out '%{http_code} %{url_effective}\n' "$url"
done
```

Expected: HTTP 200 for all six URLs.

- [ ] **Step 5: Inspect desktop rendering at 1280 × 900**

Open `http://127.0.0.1:8000/cloud-drive/` with the browser-control workflow and
set a 1280 × 900 viewport. Confirm:

- the first viewport is white, centered, and recognizably academic;
- the cobalt project title and compact hero fit without oversized editorial
  treatment;
- resource links wrap cleanly;
- Figure 1 and all four facts are visible in the opening sequence;
- the sticky navigator stays compact and does not cover anchor headings;
- the three gate cards, strategy cards, simulator, and figure gallery align;
- there is no horizontal page overflow.

- [ ] **Step 6: Exercise all interactions**

In the same browser session:

1. Select **5G Bottleneck** and confirm Communication says “Does not pass” and
   Cost says “Not evaluated.”
2. Select **6G VLA** and confirm all three gates are evaluated and the cloud
   estimate is lower.
3. Select **Low-Utilization Cost Case** and confirm the 300 ms reactive-fallback
   caveat is visible.
4. Change one native control and confirm the active preset clears.
5. Click **Copy scenario link**, confirm the live status, reload the copied
   hash, and confirm the same controls/result return.
6. Scroll through sections and confirm only one paper-nav link has
   `aria-current="location"`.
7. Filter figures to Compute, open Figure 8, close with Escape, and confirm
   focus returns to its launcher.
8. Copy BibTeX and confirm its live status.
9. Inspect browser console errors; expected count is zero.

- [ ] **Step 7: Inspect mobile rendering at 390 × 844**

Set the viewport to 390 × 844 and reload. Confirm:

- hero title, authors, and resource links wrap without clipping;
- fact cards use two columns;
- the sticky navigator scrolls horizontally;
- all gates, strategies, controls, results, figures, limitations, and citation
  collapse to one column;
- controls and buttons remain at least 44 px high;
- no horizontal page overflow appears outside intentional nav/table scrolling.

Reset the temporary viewport override before ending browser work.

- [ ] **Step 8: Inspect git scope and invoke final verification**

Run:

```bash
git status --short
git diff --stat 348a3bd..HEAD
git -C /Users/parsa025/codes/pouya-parsa.github.io status --short
```

Expected: the feature worktree is clean and the original checkout still shows
only the unrelated `?? main.tex`.

Read and follow `superpowers:verification-before-completion`. If a defect was
found during Steps 1–7, add a focused regression assertion, apply the smallest
fix, rerun all verification, and commit only the corrective files:

```bash
git add cloud-drive/index.html css/cloud-drive.css \
  scripts/cloud-drive-model.js scripts/cloud-drive.js \
  tests/cloud-drive-model.test.js tests/cloud-drive-controller.test.js \
  tests/site-content.test.js
git commit -m "fix: complete cloud drive academic redesign"
```

Do not create an empty final commit when no corrective changes are required.
