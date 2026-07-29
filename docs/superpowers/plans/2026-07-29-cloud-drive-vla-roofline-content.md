# Cloud Drive VLA and Roofline Content Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the article's three-gate structure while adding a clear, paper-grounded explanation of the Roofline GPU model, HBM-bound VLA decoding, and the resulting compute-time limit.

**Architecture:** Preserve the static GitHub Pages stack, the pure scientific model, and the progressive-enhancement controller. Add one semantic, non-interactive compute explainer to the article; then align visible copy, FAQ structured data, discovery metadata, and homepage promotion around the same VLA/Roofline claim. Extend the existing academic stylesheet only for the new section.

**Tech Stack:** HTML5, CSS3, vanilla JavaScript, Node's built-in `node:test`, existing SVG assets, GitHub Pages.

## Global Constraints

- Work only on branch `feat/cloud-drive-interactive` in `/Users/parsa025/codes/pouya-parsa.github.io/.worktrees/cloud-drive-interactive`.
- Preserve the unrelated untracked `/Users/parsa025/codes/pouya-parsa.github.io/main.tex`; never stage, modify, or delete it.
- Use `apply_patch` for repository text-file edits.
- Preserve the three-gate order: communication, compute and latency, then cost.
- Keep the official paper title, authors, arXiv identifier, canonical URL, citation metadata, social image, sitemap entry, robots rules, safety caveats, and 300 ms onboard reactive-fallback requirement.
- Preserve all ten official figure cards, complete captions, alt text, categories, enlargement controls, and stable `#figure-N` anchors.
- Do not add a framework, package manager, dependency, analytics service, API, external font, new scientific calculation, or interactive Roofline visualization.
- Keep simulator formulas and thresholds in `scripts/cloud-drive-model.js`; do not duplicate them in `scripts/cloud-drive.js`.
- Keep the new compute explainer static and semantic. Reuse `images/cloud-drive/figure-08.svg` and link it to `#figure-8`.
- Define VLA, Roofline, HBM, and autoregressive decoding on first use in the new explainer.
- Label 39 ms, 114 ms, and 153 ms as the paper's 2025 B300 raw-sensor offloading example for the calibrated FP16, dense, single-request autoregressive VLA stack.
- Distinguish the 153 ms cloud-inference example from the 132–164 ms deterministic full-loop floors across S1–S3.
- State that the deterministic floor first crosses 100 ms around 2027 but is only a lower bound because network and queueing tails still have to fit.
- Use direct, plain-language headings and one main idea per sentence.
- Maintain no-JavaScript narrative, figure, citation, and static simulator content.
- Maintain visible focus, 44 px targets, reduced motion, responsive behavior, and print output.

---

## File Map

- Modify `cloud-drive/index.html` — direct headlines, Gate 2 explainer, simplified supporting copy, synchronized visible/structured FAQ, and VLA/Roofline discovery metadata.
- Modify `index.html` — clearer news and publication summaries centered on the VLA memory-bandwidth result.
- Modify `css/cloud-drive.css` — restrained desktop/mobile/print layout for the static compute explainer.
- Modify `tests/site-content.test.js` — lock the new semantic section, exact scientific scope, plain-language headings, metadata, FAQ synchronization, styling, and figure preservation.
- Verify but do not modify `scripts/cloud-drive-model.js`, `scripts/cloud-drive.js`, `tests/cloud-drive-model.test.js`, and `tests/cloud-drive-controller.test.js`.

---

### Task 1: Add the plain-language VLA and Roofline compute story

**Files:**

- Modify: `tests/site-content.test.js`
- Modify: `cloud-drive/index.html`

**Interfaces:**

- Consumes: the existing `#three-gates` section, `images/cloud-drive/figure-08.svg`, stable `#figure-8`, and the ten-card figure gallery.
- Produces: `#compute-roofline`, `.roofline-layout`, `.roofline-copy`, `.roofline-definition`, `.roofline-visual`, `.roofline-numbers`, and `.roofline-scope` hooks for Task 3.

- [ ] **Step 1: Add failing semantic and scientific-scope tests**

Append to `tests/site-content.test.js`:

```js
test("article gives VLA Roofline compute its own plain-language section", () => {
  const html = read("cloud-drive/index.html");

  assert.match(
    html,
    /id="compute-roofline"[^>]*aria-labelledby="roofline-heading"/
  );
  assert.match(html, /id="roofline-heading">VLA waits on memory, not just math\.<\/h2>/);
  assert.match(
    html,
    /The VLA decoder generates an action one step at a time\./
  );
  assert.match(
    html,
    /GPU must read the model weights from high-bandwidth memory again\./
  );
  assert.match(
    html,
    /href="#figure-8"[\s\S]*src="\.\.\/images\/cloud-drive\/figure-08\.svg"/
  );

  for (const fact of [
    /<dt>39&nbsp;ms<\/dt>[\s\S]*Do the math/,
    /<dt>\+114&nbsp;ms<\/dt>[\s\S]*Read the weights/,
    /<dt>153&nbsp;ms<\/dt>[\s\S]*Cloud inference/,
    /132–164&nbsp;ms/,
    /first falls below 100&nbsp;ms around 2027/,
  ]) {
    assert.match(html, fact);
  }

  assert.match(
    html,
    /2025 B300 raw-sensor offloading example[\s\S]*FP16, dense, single-request autoregressive VLA stack/
  );
});

test("article uses the approved direct headline system", () => {
  const html = read("cloud-drive/index.html");

  for (const headline of [
    "Can the cloud run an autonomous-driving model?",
    "Cloud driving must pass three tests.",
    "Can the network upload the data?",
    "Can the GPU respond in time?",
    "Is the cloud cheaper?",
    "Test a cloud-driving scenario.",
    "Choose where the model splits.",
    "See the evidence from the paper.",
    "Five takeaways.",
    "What this study does not prove.",
    "Questions about cloud driving.",
  ]) {
    assert.ok(html.includes(headline), `missing direct headline: ${headline}`);
  }
});
```

- [ ] **Step 2: Run the focused tests and verify failure**

Run:

```bash
node --test --test-name-pattern="VLA Roofline|direct headline" tests/site-content.test.js
```

Expected: FAIL because `#compute-roofline`, the three-number callout, and the revised headlines do not exist.

- [ ] **Step 3: Rewrite the short answer and three gate summaries**

In `cloud-drive/index.html`, replace the short-answer headline and lead with:

```html
<h2 id="answer-heading">Can the cloud run an autonomous-driving model?</h2>
<p class="answer-lead"><strong>Yes—but the system must pass three tests in order.</strong> First, the network must upload the vehicle’s data. Next, the cloud GPU must return a result within the driving deadline. Only then does it make sense to ask whether shared cloud hardware costs less than a computer in every vehicle.</p>
```

Replace the three-gate section heading and introduction with:

```html
<p class="section-kicker">The result in one sequence</p>
<h2 id="gates-heading">Cloud driving must pass three tests.</h2>
```

```html
<p>The paper tests the network first, GPU response time second, and cost last. If a scenario fails one test, the later tests cannot rescue it.</p>
```

Use these complete gate cards:

```html
<article class="gate-story communication">
  <p class="gate-label">Gate 01 <span>Communication</span></p>
  <h3>Can the network upload the data?</h3>
  <p><strong>Not always.</strong> Cloud driving sends data upstream from every active vehicle. Raw sensors need 100&nbsp;Mbps per vehicle, compressed features need 25&nbsp;Mbps, and compact queries need 3&nbsp;Mbps.</p>
  <p class="gate-takeaway">At the dense NYC reference point, plain 5G cannot support feature-level offloading. 5G-Advanced is the practical threshold, and 6G adds room for more vehicles.</p>
  <a href="#figure-7">See the NYC network result →</a>
</article>

<article class="gate-story compute">
  <p class="gate-label">Gate 02 <span>Compute time</span></p>
  <h3>Can the GPU respond in time?</h3>
  <p><strong>Not for near-term VLA under the 100&nbsp;ms deadline.</strong> The decoder reads large model weights from GPU memory once for every generated step. That repeated reading takes longer than the arithmetic.</p>
  <p class="gate-takeaway">In 2025, the deterministic VLA floor is 132–164&nbsp;ms before network or queueing delay. Faster 5G or 6G cannot remove this GPU memory delay.</p>
  <a href="#compute-roofline">See why VLA waits on memory →</a>
</article>

<article class="gate-story cost">
  <p class="gate-label">Gate 03 <span>Cost</span></p>
  <h3>Is the cloud cheaper?</h3>
  <p><strong>For some VLA fleets—after the first two tests pass.</strong> A computer bought for every vehicle sits idle while the vehicle is parked. Shared cloud GPUs serve only the vehicles that are active.</p>
  <p class="gate-takeaway">The cloud advantage is strongest for expensive VLA hardware at low or moderate utilization. Feature-level offloading, or S2, is where most of the VLA savings appear.</p>
  <a href="#figure-10">See where cloud VLA costs less →</a>
</article>
```

- [ ] **Step 4: Insert the static Roofline compute explainer**

Immediately after the closing `</section>` for `#three-gates` and before `#simulator`, insert:

```html
<section class="roofline-section article-section" id="compute-roofline" aria-labelledby="roofline-heading">
  <div class="paper-wrap">
    <div class="section-heading">
      <div>
        <p class="section-kicker">Why VLA compute is slow</p>
        <h2 id="roofline-heading">VLA waits on memory, not just math.</h2>
      </div>
      <p>The paper’s Roofline model separates the time a GPU spends doing arithmetic from the time it spends moving model weights through memory.</p>
    </div>

    <div class="roofline-layout">
      <div class="roofline-copy">
        <p class="roofline-lead"><strong>The memory reads dominate.</strong> A vision-language-action (VLA) model connects visual perception, language reasoning, and driving actions in one large model.</p>
        <p>The encoder and prefill stages mainly use the GPU’s arithmetic units. The autoregressive decoder works differently: it produces reasoning and trajectory outputs one step at a time.</p>
        <p>The VLA decoder generates an action one step at a time. At every step, the GPU must read the model weights from high-bandwidth memory again.</p>
        <aside class="roofline-definition">
          <strong>Roofline, in one sentence</strong>
          <p>It shows whether a workload is waiting on GPU arithmetic or on data moving through GPU memory.</p>
        </aside>
      </div>

      <a class="roofline-visual" href="#figure-8" aria-label="Jump to the full Figure 8 caption">
        <img src="../images/cloud-drive/figure-08.svg" alt="VLA latency by GPU year and a breakdown showing that autoregressive decoding is limited by GPU memory bandwidth.">
        <span><strong>Figure 8:</strong> The left panel shows when each model fits the deadline. The right panel shows why VLA decoding improves with memory bandwidth, not just more arithmetic throughput.</span>
      </a>
    </div>

    <dl class="roofline-numbers" aria-label="2025 VLA Roofline timing example">
      <div>
        <dt>39&nbsp;ms</dt>
        <dd><strong>Do the math</strong><span>Encoder and prefill in a compute-only estimate.</span></dd>
      </div>
      <div>
        <dt>+114&nbsp;ms</dt>
        <dd><strong>Read the weights</strong><span>Autoregressive reasoning and trajectory decoding.</span></dd>
      </div>
      <div>
        <dt>153&nbsp;ms</dt>
        <dd><strong>Cloud inference</strong><span>The memory-aware total before the rest of the driving loop.</span></dd>
      </div>
    </dl>

    <p class="roofline-scope"><strong>Scope:</strong> This is the paper’s 2025 B300 raw-sensor offloading example for its calibrated FP16, dense, single-request autoregressive VLA stack. It is not a universal VLA benchmark.</p>
    <p class="roofline-result">Across S1–S3, the complete deterministic VLA floor is 132–164&nbsp;ms in 2025. It first falls below 100&nbsp;ms around 2027, but that floor is only a lower bound: network and queueing delays still have to fit. At the dense NYC reference point, 6G admits VLA-S2 around 2028; 5G-Advanced does not pass the same 100&nbsp;ms case.</p>
  </div>
</section>
```

Do not wrap the reused Figure 8 image in a `<figure>` element; the gallery must continue to contain exactly ten `<figure>` cards.

- [ ] **Step 5: Apply every approved direct headline**

Replace the remaining section headlines in `cloud-drive/index.html`:

```html
<h2 id="simulator-heading">Test a cloud-driving scenario.</h2>
<h2 id="strategies-heading">Choose where the model splits.</h2>
<h2 id="figures-heading">See the evidence from the paper.</h2>
<h2 id="findings-heading">Five takeaways.</h2>
<h2 id="limitations-heading">What this study does not prove.</h2>
<h2 id="faq-heading">Questions about cloud driving.</h2>
```

Keep the official paper title and citation heading unchanged.

- [ ] **Step 6: Run the complete content suite**

Run:

```bash
node --test tests/site-content.test.js
git diff --check
```

Expected: every site-content test PASS, the new section has the exact scope language, and the gallery still contains exactly ten `<figure>` elements.

- [ ] **Step 7: Commit the compute-story checkpoint**

```bash
git add cloud-drive/index.html tests/site-content.test.js
git commit -m "feat: explain VLA roofline compute time"
```

---

### Task 2: Align supporting copy, FAQ, metadata, and homepage promotion

**Files:**

- Modify: `tests/site-content.test.js`
- Modify: `cloud-drive/index.html`
- Modify: `index.html`

**Interfaces:**

- Consumes: `#compute-roofline` and the direct headlines from Task 1.
- Produces: synchronized visible/JSON-LD Roofline FAQ content and consistent VLA/Roofline descriptions for search engines, answer engines, and the portfolio homepage.

- [ ] **Step 1: Add failing metadata, FAQ, and homepage tests**

Append to `tests/site-content.test.js`:

```js
test("discovery metadata centers the VLA Roofline result", () => {
  const html = read("cloud-drive/index.html");

  for (const term of [
    /VLA inference/i,
    /Roofline GPU model/i,
    /HBM|GPU memory bandwidth/i,
    /autoregressive decoding/i,
    /compute latency/i,
  ]) {
    assert.match(html, term);
  }

  const jsonLdMatch = html.match(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/
  );
  assert.ok(jsonLdMatch, "JSON-LD block is missing");
  const graph = JSON.parse(jsonLdMatch[1])["@graph"];
  const article = graph.find((node) => node["@type"] === "ScholarlyArticle");
  assert.match(article.description, /Roofline GPU model/);
  assert.match(article.description, /HBM-bound autoregressive VLA decoding/);
  assert.ok(article.keywords.includes("VLA inference latency"));
  assert.ok(article.keywords.includes("GPU memory bandwidth"));
});

test("visible and structured FAQ explain the same Roofline result", () => {
  const html = read("cloud-drive/index.html");
  const question = "What does the Roofline model show for VLA inference?";
  const answer =
    "It separates GPU arithmetic time from the time spent reading model " +
    "weights from high-bandwidth memory (HBM). In the paper's 2025 " +
    "example, autoregressive decoding adds about 114 ms and dominates " +
    "the compute gate. Faster 5G or 6G does not remove that GPU memory delay.";

  assert.ok(html.includes(`<summary>${question}</summary>`));
  assert.ok(
    html.includes(
      answer.replace("114 ms", "114&nbsp;ms")
    )
  );

  const jsonLdMatch = html.match(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/
  );
  const graph = JSON.parse(jsonLdMatch[1])["@graph"];
  const faq = graph.find((node) => node["@type"] === "FAQPage");
  const roofline = faq.mainEntity.find((item) => item.name === question);
  assert.equal(roofline.acceptedAnswer.text, answer);
});

test("homepage leads with the VLA memory-bandwidth result", () => {
  const html = read("index.html");
  assert.match(
    html,
    /near-term cloud VLA inference is often limited by GPU memory bandwidth/i
  );
  assert.match(
    html,
    /even after 5G\/6G can carry the workload/i
  );
  assert.match(html, /href="cloud-drive\/">Explore the interactive article/);
  assert.match(html, /href="https:\/\/arxiv\.org\/pdf\/2607\.09045">Read the paper/);
});
```

- [ ] **Step 2: Run the new tests and verify failure**

Run:

```bash
node --test --test-name-pattern="metadata centers|same Roofline|homepage leads" tests/site-content.test.js
```

Expected: FAIL because metadata lacks the complete terminology, the Roofline FAQ does not exist, and the homepage summary still leads with the general framework.

- [ ] **Step 3: Update discovery descriptions and keywords**

Use these exact values in `cloud-drive/index.html`:

```html
<meta name="description" content="Explore why VLA cloud inference is limited by GPU memory bandwidth: a Roofline GPU model links HBM-bound autoregressive decoding, compute latency, 5G/6G capacity, and cost.">
```

```html
<meta property="og:description" content="Near-term VLA cloud inference waits on GPU memory, not radio bandwidth. Explore the Roofline result, three feasibility tests, simulator, and ten figures.">
```

```html
<meta name="twitter:description" content="See why HBM-bound VLA decoding—not just 5G/6G bandwidth—sets the cloud-driving compute-latency limit.">
```

Replace the `ScholarlyArticle.description` with:

```json
"description": "This study links 5G/6G communication, a Roofline GPU model, HBM-bound autoregressive VLA decoding, compute latency, stochastic delay, and utilization-aware cloud cost in New York City."
```

Extend `ScholarlyArticle.keywords` so it contains:

```json
"keywords": [
  "vehicular edge computing",
  "task offloading",
  "autonomous driving",
  "5G",
  "6G",
  "vision-language-action models",
  "cloud inference",
  "Roofline GPU model",
  "GPU memory bandwidth",
  "autoregressive decoding",
  "VLA inference latency"
]
```

Do not change the canonical, citation, paper identifier, author, date, image, or PDF fields.

- [ ] **Step 4: Add the synchronized Roofline FAQ**

Add this object to `FAQPage.mainEntity` immediately after the 6G question:

```json
{
  "@type": "Question",
  "name": "What does the Roofline model show for VLA inference?",
  "acceptedAnswer": {
    "@type": "Answer",
    "text": "It separates GPU arithmetic time from the time spent reading model weights from high-bandwidth memory (HBM). In the paper's 2025 example, autoregressive decoding adds about 114 ms and dominates the compute gate. Faster 5G or 6G does not remove that GPU memory delay."
  }
}
```

Add the matching visible FAQ item immediately after “Why doesn’t faster 6G solve the whole problem?”:

```html
<details>
  <summary>What does the Roofline model show for VLA inference?</summary>
  <p>It separates GPU arithmetic time from the time spent reading model weights from high-bandwidth memory (HBM). In the paper's 2025 example, autoregressive decoding adds about 114&nbsp;ms and dominates the compute gate. Faster 5G or 6G does not remove that GPU memory delay.</p>
</details>
```

Rewrite the existing 6G visible answer and its JSON-LD answer with the same plain text:

```text
6G can upload more vehicle data with less network delay. It cannot reduce the time a VLA decoder spends reading model weights from GPU memory. The network test and compute test are separate.
```

- [ ] **Step 5: Simplify the strategy, findings, and figure explanations**

Keep the official figure captions unchanged. Replace the ten `.figure-why`
sentences, in order, with:

```html
<p class="figure-why"><strong>Why it matters:</strong> Cost matters only after communication and latency pass.</p>
<p class="figure-why"><strong>Why it matters:</strong> Moving more work into the vehicle reduces uplink demand but requires more onboard hardware.</p>
<p class="figure-why"><strong>Why it matters:</strong> A cell has a hard vehicle limit because demand rises while shared capacity falls.</p>
<p class="figure-why"><strong>Why it matters:</strong> GPU inference is only one part of the full driving loop.</p>
<p class="figure-why"><strong>Why it matters:</strong> A scenario can pass on average and still fail during a rare delay spike.</p>
<p class="figure-why"><strong>Why it matters:</strong> The number of active vehicles—not just the total fleet—sets network load.</p>
<p class="figure-why"><strong>Why it matters:</strong> S2 cuts network demand without keeping most of the expensive VLA model in the vehicle.</p>
<p class="figure-why"><strong>Why it matters:</strong> Faster 6G cannot speed up repeated reads from GPU memory.</p>
<p class="figure-why"><strong>Why it matters:</strong> Shared GPUs help most when expensive VLA hardware would otherwise sit idle.</p>
<p class="figure-why"><strong>Why it matters:</strong> S2 is often the lowest-cost VLA option after the latency tests pass.</p>
```

Replace the findings list with:

```html
<ol class="finding-list">
  <li><span>01</span><div><strong>The tests happen in order.</strong><p>The network passes first, GPU response time passes second, and cost comes last.</p></div></li>
  <li><span>02</span><div><strong>5G-Advanced is the first practical step for S2.</strong><p>Plain 5G runs out of feature-upload capacity at the dense NYC reference point.</p></div></li>
  <li><span>03</span><div><strong>VLA waits on GPU memory.</strong><p>Autoregressive decoding repeatedly reads model weights from HBM and dominates the 2025 compute time.</p></div></li>
  <li><span>04</span><div><strong>Low utilization makes sharing more valuable.</strong><p>Cloud pooling avoids buying peak VLA hardware for every parked vehicle.</p></div></li>
  <li><span>05</span><div><strong>S2 is the middle ground.</strong><p>It needs less uplink than S1 and less onboard compute than S3.</p></div></li>
</ol>
```

In the strategy cards, keep all rates and model-split facts but use these
short headings:

```html
<h3>Upload the raw sensors</h3>
<h3>Upload compressed features</h3>
<h3>Upload compact queries</h3>
```

- [ ] **Step 6: Rewrite the homepage promotion**

In `index.html`, replace the Cloud Drive news item with:

```html
<li><strong>2026:</strong> New preprint: <a href="cloud-drive/">Can the Cloud Drive?</a> explains why VLA cloud inference can hit a GPU memory-bandwidth limit even after the 5G/6G uplink passes.</li>
```

Replace the publication summary with:

```html
<p>The study shows why near-term cloud VLA inference is often limited by GPU memory bandwidth—even after 5G/6G can carry the workload—and when shared cloud GPUs can reduce cost.</p>
```

Keep the title, authors, arXiv identifier, interactive article link, and paper link unchanged.

- [ ] **Step 7: Run content and JSON-LD verification**

Run:

```bash
node --test tests/site-content.test.js
node -e 'const fs=require("fs"); const h=fs.readFileSync("cloud-drive/index.html","utf8"); const blocks=[...h.matchAll(/<script type="application\\/ld\\+json">([\\s\\S]*?)<\\/script>/g)]; if(blocks.length!==1) throw Error("expected one JSON-LD block"); JSON.parse(blocks[0][1]); console.log("JSON-LD PASS")'
git diff --check
```

Expected: all content tests PASS, `JSON-LD PASS`, and no whitespace errors.

- [ ] **Step 8: Commit the plain-language and discovery checkpoint**

```bash
git add cloud-drive/index.html index.html tests/site-content.test.js
git commit -m "content: focus cloud drive on VLA compute"
```

---

### Task 3: Style the Roofline explainer within the academic system

**Files:**

- Modify: `tests/site-content.test.js`
- Modify: `css/cloud-drive.css`

**Interfaces:**

- Consumes: the Task 1 class hooks `.roofline-layout`, `.roofline-copy`, `.roofline-definition`, `.roofline-visual`, `.roofline-numbers`, `.roofline-scope`, and `.roofline-result`.
- Produces: a two-column desktop compute explainer, one-column mobile layout, and print-safe presentation without changing JavaScript.

- [ ] **Step 1: Add a failing stylesheet contract**

Append to `tests/site-content.test.js`:

```js
test("Roofline explainer extends the academic responsive system", () => {
  const css = read("css/cloud-drive.css");

  assert.match(css, /\.roofline-layout\s*\{[\s\S]*display:\s*grid/);
  assert.match(
    css,
    /\.roofline-layout\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s+minmax\(340px,\s*0\.9fr\)/
  );
  assert.match(
    css,
    /\.roofline-numbers\s*\{[\s\S]*grid-template-columns:\s*repeat\(3,\s*1fr\)/
  );
  assert.match(css, /\.roofline-visual:focus-visible/);
  assert.match(
    css,
    /@media\s*\(max-width:\s*760px\)[\s\S]*\.roofline-numbers\s*\{[\s\S]*grid-template-columns:\s*1fr/
  );
  assert.match(
    css,
    /@media\s*print[\s\S]*\.roofline-section/
  );
});
```

- [ ] **Step 2: Run the stylesheet test and verify failure**

Run:

```bash
node --test --test-name-pattern="Roofline explainer extends" tests/site-content.test.js
```

Expected: FAIL because none of the `.roofline-*` selectors exist.

- [ ] **Step 3: Add the desktop Roofline layout**

Add after the existing `.gate-story` rules in `css/cloud-drive.css`:

```css
.roofline-section {
  background: var(--surface);
}

.roofline-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(340px, 0.9fr);
  gap: 28px;
  align-items: start;
}

.roofline-copy {
  max-width: var(--reading-width);
}

.roofline-copy > p {
  margin: 0 0 14px;
  color: var(--muted);
}

.roofline-lead {
  color: var(--ink) !important;
  font-size: 1.05rem;
}

.roofline-definition {
  margin-top: 20px;
  padding: 16px 18px;
  background: var(--surface-blue);
  border: 1px solid #d8e2ff;
  border-radius: var(--radius);
}

.roofline-definition strong {
  color: var(--accent);
}

.roofline-definition p {
  margin: 4px 0 0;
}

.roofline-visual {
  display: block;
  overflow: hidden;
  color: var(--ink);
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  text-decoration: none;
}

.roofline-visual:hover {
  border-color: #a9bce8;
  text-decoration: none;
}

.roofline-visual:focus-visible {
  outline: 3px solid rgba(47, 109, 246, 0.3);
  outline-offset: 3px;
}

.roofline-visual img {
  width: 100%;
  min-height: 260px;
  padding: 18px;
  object-fit: contain;
  background: #fff;
}

.roofline-visual span {
  display: block;
  padding: 14px 16px;
  color: var(--muted);
  border-top: 1px solid var(--line);
  font-size: 0.82rem;
  line-height: 1.55;
}

.roofline-visual strong {
  color: var(--ink);
}

.roofline-numbers {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin: 28px 0 0;
}

.roofline-numbers div {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 12px;
  align-items: start;
  padding: 18px;
  background: #fff;
  border: 1px solid var(--line);
  border-top: 3px solid var(--accent);
  border-radius: var(--radius);
}

.roofline-numbers dt {
  color: var(--accent);
  font-size: 1.4rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  white-space: nowrap;
}

.roofline-numbers dd {
  margin: 0;
}

.roofline-numbers dd strong,
.roofline-numbers dd span {
  display: block;
}

.roofline-numbers dd span {
  margin-top: 3px;
  color: var(--muted);
  font-size: 0.8rem;
}

.roofline-scope,
.roofline-result {
  max-width: var(--reading-width);
  margin: 18px auto 0;
  color: var(--muted);
  font-size: 0.82rem;
}

.roofline-result {
  color: #33384a;
}
```

- [ ] **Step 4: Add responsive and print rules**

Inside the existing `@media (max-width: 900px)` block, add:

```css
.roofline-layout {
  grid-template-columns: 1fr;
}
```

Inside the existing `@media (max-width: 760px)` block, add:

```css
.roofline-numbers {
  grid-template-columns: 1fr;
}

.roofline-numbers div {
  grid-template-columns: 86px 1fr;
}

.roofline-visual img {
  min-height: 0;
  padding: 12px;
}
```

Inside the existing `@media print` block, include:

```css
.roofline-section {
  color: #000;
  background: #fff;
}

.roofline-layout {
  grid-template-columns: 1fr 1fr;
}

.roofline-numbers {
  grid-template-columns: repeat(3, 1fr);
}

.roofline-visual,
.roofline-numbers div {
  break-inside: avoid;
}
```

- [ ] **Step 5: Run the content and style suites**

Run:

```bash
node --test tests/site-content.test.js tests/cloud-drive-model.test.js tests/cloud-drive-controller.test.js
git diff --check
```

Expected: every test PASS and no whitespace errors.

- [ ] **Step 6: Commit the visual checkpoint**

```bash
git add css/cloud-drive.css tests/site-content.test.js
git commit -m "style: add VLA roofline explainer"
```

---

### Task 4: Verify factual scope, accessibility, SEO/GEO, and responsive rendering

**Files:**

- Verify: `cloud-drive/index.html`
- Verify: `index.html`
- Verify: `css/cloud-drive.css`
- Verify: `scripts/cloud-drive-model.js`
- Verify: `scripts/cloud-drive.js`
- Verify: `tests/site-content.test.js`
- Verify: `tests/cloud-drive-model.test.js`
- Verify: `tests/cloud-drive-controller.test.js`
- Modify only if a focused regression is found.

**Interfaces:**

- Consumes: the completed static content revision.
- Produces: fresh evidence for scientific wording, metadata, no-JavaScript completeness, local assets, desktop/mobile rendering, interactions, and repository scope.

- [ ] **Step 1: Run the complete automated suite**

Run:

```bash
node --test tests/cloud-drive-model.test.js tests/cloud-drive-controller.test.js tests/site-content.test.js
node --check scripts/cloud-drive-model.js
node --check scripts/cloud-drive.js
git diff --check
```

Expected: every test PASS, both scripts parse, and no whitespace errors appear.

- [ ] **Step 2: Validate JSON-LD, metadata terms, and local assets**

Run:

```bash
node -e 'const fs=require("fs"); const h=fs.readFileSync("cloud-drive/index.html","utf8"); const blocks=[...h.matchAll(/<script type="application\\/ld\\+json">([\\s\\S]*?)<\\/script>/g)]; if(blocks.length!==1) throw Error("expected one JSON-LD block"); const graph=JSON.parse(blocks[0][1])["@graph"]; const article=graph.find(x=>x["@type"]==="ScholarlyArticle"); const faq=graph.find(x=>x["@type"]==="FAQPage"); for(const term of ["Roofline GPU model","HBM-bound autoregressive VLA decoding","compute latency"]){if(!article.description.includes(term)) throw Error(`missing article term: ${term}`)} if(!faq.mainEntity.some(x=>x.name==="What does the Roofline model show for VLA inference?")) throw Error("missing Roofline FAQ"); console.log("JSON-LD and GEO terms PASS")'
node -e 'const fs=require("fs"),p=require("path"); for(const file of ["index.html","cloud-drive/index.html"]){const h=fs.readFileSync(file,"utf8"); for(const m of h.matchAll(/(?:src|href)="([^"#?]+)"/g)){const u=m[1]; if(/^(?:https?:|mailto:)/.test(u)) continue; const target=p.resolve(p.dirname(file),u); if(!fs.existsSync(target)) throw Error(`${file}: missing ${u}`)}} console.log("local assets PASS")'
```

Expected: `JSON-LD and GEO terms PASS` and `local assets PASS`.

- [ ] **Step 3: Verify no-JavaScript completeness and figure count**

Run:

```bash
node -e 'const h=require("fs").readFileSync("cloud-drive/index.html","utf8").replace(/<script\\b[\\s\\S]*?<\\/script>/g,""); for(const s of ["Cloud driving must pass three tests.","VLA waits on memory, not just math.","39&nbsp;ms","+114&nbsp;ms","153&nbsp;ms","Figure 1:","Figure 10:","@article{parsa2026cloud"]){if(!h.includes(s)) throw Error(`missing no-JS content: ${s}`)} const figures=(h.match(/<figure\\b/g)||[]).length; if(figures!==10) throw Error(`expected 10 figure cards, got ${figures}`); console.log("no-JS VLA content PASS")'
```

Expected: `no-JS VLA content PASS`.

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
  http://127.0.0.1:8000/images/cloud-drive/figure-08.svg \
  http://127.0.0.1:8000/images/cloud-drive/figure-10.svg \
  http://127.0.0.1:8000/images/cloud-drive/og-cloud-drive.png \
  http://127.0.0.1:8000/robots.txt \
  http://127.0.0.1:8000/sitemap.xml
do
  curl --silent --show-error --output /dev/null \
    --write-out '%{http_code} %{url_effective}\n' "$url"
done
```

Expected: HTTP 200 for all seven URLs.

- [ ] **Step 5: Inspect desktop rendering at 1280 × 900**

Open `http://127.0.0.1:8000/cloud-drive/` with the browser-control workflow and set a 1280 × 900 viewport. Confirm:

- the three gate cards remain the main organizing structure;
- the new compute explainer appears immediately after the gates;
- “VLA waits on memory, not just math” is readable at a glance;
- the explanation and Figure 8 align in two columns;
- the 39 ms, +114 ms, and 153 ms cards align in one row;
- the scope note clearly labels the 2025 B300 raw-sensor example;
- the reused Figure 8 link lands on the full `#figure-8` card;
- the simulator, figures, FAQ, and citation still render;
- there is no horizontal page overflow.

- [ ] **Step 6: Inspect mobile rendering at 390 × 844**

Set the viewport to 390 × 844 and reload. Confirm:

- direct headlines wrap without clipping;
- the Roofline explanation and Figure 8 collapse into one column;
- timing cards collapse into one column;
- every timing label remains visually paired with its explanation;
- the sticky navigator and strategy table remain intentionally scrollable;
- controls and buttons remain at least 44 px high;
- no page-level horizontal overflow appears.

- [ ] **Step 7: Exercise retained interactions and inspect errors**

In the same browser session:

1. Choose **5G Bottleneck** and confirm Communication says “Does not pass.”
2. Choose **6G VLA** and confirm all three gates are evaluated.
3. Filter figures to Compute and confirm Figure 8 remains available.
4. Open and close Figure 8 and confirm focus returns to its launcher.
5. Open the new Roofline FAQ and confirm the 114 ms explanation is visible.
6. Inspect browser console and network requests.

Expected: retained interactions work, console error count is zero, and every local request returns 200 or 304.

- [ ] **Step 8: Inspect repository scope**

Run:

```bash
git status --short
git diff --stat 36948de..HEAD
git -C /Users/parsa025/codes/pouya-parsa.github.io status --short
```

Expected: the feature worktree is clean after implementation commits, the diff is limited to the planned article/homepage/CSS/tests files plus this plan, and the original checkout still shows only `?? main.tex`.
