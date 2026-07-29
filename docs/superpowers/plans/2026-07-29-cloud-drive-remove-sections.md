# Cloud Drive Section Removal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the Cloud Drive limitations and FAQ surfaces completely while preserving the article’s VLA/Roofline content, simulator, figures, findings, citation, and research metadata.

**Architecture:** Treat the HTML page as the user-facing and crawler-facing source of truth: remove the two sections, their navigation entry, and the corresponding `FAQPage` JSON-LD node together. Then remove CSS selectors that no longer have an HTML consumer. Existing file-based content tests protect the resulting static artifact, and the full browser smoke test confirms the shortened findings-to-citation flow.

**Tech Stack:** Static HTML5, CSS, JSON-LD, Node.js built-in test runner, local Python HTTP server, Chromium/Playwright smoke testing.

## Global Constraints

- Delete the complete `#limitations` and `#faq` sections from `cloud-drive/index.html`.
- Remove the `FAQ` link from the article’s sticky section navigation.
- Remove the `FAQPage` node from the page’s JSON-LD graph so structured data matches visible content.
- Remove CSS rules used only by the limitations and FAQ sections, including responsive and print overrides.
- Keep the three-gate structure, VLA/Roofline explainer, simulator, strategies, ten figures, findings, citation, remaining JSON-LD nodes, paper links, and discovery metadata unchanged.
- Preserve the unrelated `main.tex` file in the original checkout.

---

### Task 1: Remove the article and schema surfaces

**Files:**
- Modify: `tests/site-content.test.js:31-58`
- Modify: `tests/site-content.test.js:161-193`
- Modify: `tests/site-content.test.js:277-341`
- Modify: `cloud-drive/index.html:112-165`
- Modify: `cloud-drive/index.html:212-220`
- Modify: `cloud-drive/index.html:639-693`

**Interfaces:**
- Consumes: the static Cloud Drive HTML document and its single JSON-LD `@graph`.
- Produces: a page whose visible section flow is Findings → Citation, whose navigation has no FAQ link, and whose JSON-LD graph contains no `FAQPage`.

- [ ] **Step 1: Write the failing content test**

Update the semantic metadata test so the preserved IDs are:

```js
for (const id of [
  "answer",
  "three-gates",
  "simulator",
  "strategies",
  "figures",
  "findings",
  "citation",
]) {
  assert.match(html, new RegExp(`id="${id}"`), `missing #${id}`);
}
```

Remove `"#faq"` from the navigation `href` expectations and remove the two deleted headlines from the direct-headline expectations.

Replace `visible and structured FAQ explain the same Roofline result` with:

```js
test("article omits the removed limitations and FAQ surfaces", () => {
  const html = read("cloud-drive/index.html");

  for (const removed of [
    /id="limitations"/,
    /id="faq"/,
    /href="#faq"/,
    /What this study does not prove\./,
    /Questions about cloud driving\./,
  ]) {
    assert.doesNotMatch(html, removed);
  }

  const jsonLdMatch = html.match(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/
  );
  assert.ok(jsonLdMatch, "JSON-LD block is missing");
  const graph = JSON.parse(jsonLdMatch[1])["@graph"];
  assert.equal(
    graph.some((node) => node["@type"] === "FAQPage"),
    false
  );
});
```

Also remove the old positive `FAQPage` assertion from `Cloud Drive article exposes semantic research and discovery metadata`.

- [ ] **Step 2: Run the focused test to verify RED**

Run:

```bash
node --test --test-name-pattern="article omits the removed limitations and FAQ surfaces" tests/site-content.test.js
```

Expected: FAIL because `cloud-drive/index.html` still contains `id="limitations"`.

- [ ] **Step 3: Remove the production HTML and JSON-LD**

In `cloud-drive/index.html`:

1. Delete the complete `FAQPage` object from the JSON-LD `@graph`, including its six `Question` entries. Preserve valid JSON punctuation so `BreadcrumbList` becomes the final graph node.
2. Delete `<a href="#faq">FAQ</a>` from `.paper-nav-inner`.
3. Delete the complete `<section class="limitations-section ...>` block.
4. Delete the complete `<section class="faq-section ...>` block.
5. Leave `<section class="citation-section ...>` immediately after the findings section.

- [ ] **Step 4: Run the content suite to verify GREEN**

Run:

```bash
node --test tests/site-content.test.js
```

Expected: every content test passes and the JSON-LD block parses.

- [ ] **Step 5: Commit the semantic removal**

```bash
git add cloud-drive/index.html tests/site-content.test.js
git commit -m "content: remove cloud drive limitations and faq"
```

### Task 2: Remove unused section styles

**Files:**
- Modify: `tests/site-content.test.js:212-226`
- Modify: `css/cloud-drive.css:386-452`
- Modify: `css/cloud-drive.css:1063-1099`
- Modify: `css/cloud-drive.css:1175-1179`
- Modify: `css/cloud-drive.css:1291-1299`
- Modify: `css/cloud-drive.css:1323-1331`

**Interfaces:**
- Consumes: the shortened HTML from Task 1.
- Produces: the same visual system without selectors for `.limitations-*` or `.faq-*`.

- [ ] **Step 1: Write the failing stylesheet test**

Add these assertions to `article stylesheet exposes the approved light academic system`:

```js
assert.doesNotMatch(css, /\.limitations-(?:section|grid)/);
assert.doesNotMatch(css, /\.faq-(?:section|list)/);
```

- [ ] **Step 2: Run the focused test to verify RED**

Run:

```bash
node --test --test-name-pattern="article stylesheet exposes the approved light academic system" tests/site-content.test.js
```

Expected: FAIL because `.limitations-grid` remains in `css/cloud-drive.css`.

- [ ] **Step 3: Remove only unused CSS selectors**

In `css/cloud-drive.css`:

- Remove `.limitations-grid` from the shared three-column grid rule.
- Remove `.limitations-grid article` from shared card background, padding, heading, and paragraph rules.
- Delete the standalone `.limitations-section`, `.limitations-grid article`, `.limitations-grid h3`, and `.limitations-grid p` rules.
- Delete the `.faq-list`, `.faq-list details`, `.faq-list summary`, and `.faq-list details p` rules.
- Remove `.limitations-grid` from the `@media (max-width: 900px)` rule.
- Remove `.limitations-section` and `.limitations-grid article` from print rules.
- Preserve every remaining selector and declaration byte-for-byte except punctuation required to keep selector lists valid.

- [ ] **Step 4: Run the complete automated suite to verify GREEN**

Run:

```bash
node --test tests/cloud-drive-model.test.js tests/cloud-drive-controller.test.js tests/site-content.test.js
node --check scripts/cloud-drive-model.js
node --check scripts/cloud-drive.js
git diff --check
```

Expected: every test passes, both scripts parse, and `git diff --check` prints no errors.

- [ ] **Step 5: Commit the CSS cleanup**

```bash
git add css/cloud-drive.css tests/site-content.test.js
git commit -m "style: remove unused cloud drive section rules"
```

### Task 3: Verify crawler, route, and rendered behavior

**Files:**
- Verify: `cloud-drive/index.html`
- Verify: `css/cloud-drive.css`
- Verify: `index.html`
- Verify: `robots.txt`
- Verify: `sitemap.xml`
- Verify: `images/cloud-drive/*`

**Interfaces:**
- Consumes: the completed static section removal.
- Produces: fresh evidence that schema, no-JavaScript content, local assets, public routes, desktop/mobile layout, and retained interactions remain valid.

- [ ] **Step 1: Validate JSON-LD, preserved metadata, and local assets**

Run:

```bash
node -e 'const fs=require("fs"); const h=fs.readFileSync("cloud-drive/index.html","utf8"); const blocks=[...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]; if(blocks.length!==1) throw Error("expected one JSON-LD block"); const graph=JSON.parse(blocks[0][1])["@graph"]; for(const type of ["ScholarlyArticle","Person","BreadcrumbList"]){if(!graph.some(x=>x["@type"]===type)) throw Error(`missing ${type}`)} if(graph.some(x=>x["@type"]==="FAQPage")) throw Error("stale FAQPage"); console.log("JSON-LD section removal PASS")'
node -e 'const fs=require("fs"),p=require("path"); for(const file of ["index.html","cloud-drive/index.html"]){const h=fs.readFileSync(file,"utf8"); for(const m of h.matchAll(/(?:src|href)="([^"#?]+)"/g)){const u=m[1]; if(/^(?:https?:|mailto:)/.test(u)) continue; const target=p.resolve(p.dirname(file),u); if(!fs.existsSync(target)) throw Error(`${file}: missing ${u}`)}} console.log("local assets PASS")'
```

Expected: `JSON-LD section removal PASS` and `local assets PASS`.

- [ ] **Step 2: Verify no-JavaScript content and section order**

Run:

```bash
node -e 'const h=require("fs").readFileSync("cloud-drive/index.html","utf8").replace(/<script\b[\s\S]*?<\/script>/g,""); for(const s of ["Cloud driving must pass three tests.","VLA waits on memory, not just math.","Five takeaways.","Read and cite the paper.","@article{parsa2026cloud"]){if(!h.includes(s)) throw Error(`missing retained content: ${s}`)} for(const s of ["What this study does not prove.","Questions about cloud driving."]){if(h.includes(s)) throw Error(`stale removed content: ${s}`)} if(h.indexOf("Five takeaways.")>h.indexOf("Read and cite the paper.")) throw Error("findings must precede citation"); console.log("no-JS shortened article PASS")'
```

Expected: `no-JS shortened article PASS`.

- [ ] **Step 3: Probe public routes**

With the task-owned server running at `http://127.0.0.1:8000`, run:

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

- [ ] **Step 4: Run desktop and mobile browser smoke tests**

At 1280 × 900 and 390 × 844, confirm:

- Findings flows directly into the citation section.
- The sticky navigator has no FAQ item and has no empty space or page-level overflow.
- The VLA/Roofline section, three timing cards, simulator, strategies, ten figures, findings, and citation remain visible.
- **5G Bottleneck** still reports Communication as “Does not pass.”
- **6G VLA** still evaluates all three gates.
- Compute filtering still exposes Figure 8.
- Figure 8 opens and closes with focus returned to its launcher.
- Console errors, failed local requests, and non-200/304 local responses remain zero.

- [ ] **Step 5: Inspect repository scope**

Run:

```bash
git status --short
git diff --stat 0c47b70..HEAD
git -C /Users/parsa025/codes/pouya-parsa.github.io status --short
```

Expected: the feature worktree is clean, changes since the design commit are limited to `cloud-drive/index.html`, `css/cloud-drive.css`, `tests/site-content.test.js`, and this plan; the original checkout still shows only `?? main.tex`.
