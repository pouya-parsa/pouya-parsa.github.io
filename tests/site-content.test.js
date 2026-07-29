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

test("all ten official paper figures are present and non-empty", () => {
  for (let index = 1; index <= 10; index += 1) {
    const name = `images/cloud-drive/figure-${String(index).padStart(2, "0")}.svg`;
    const absolute = path.join(root, name);
    assert.equal(fs.existsSync(absolute), true, `${name} is missing`);
    assert.ok(fs.statSync(absolute).size > 1_000, `${name} is unexpectedly small`);
    assert.match(fs.readFileSync(absolute, "utf8"), /<svg[\s>]/);
  }
});

test("Cloud Drive article exposes semantic research and discovery metadata", () => {
  const html = read("cloud-drive/index.html");
  assert.match(
    html,
    /<title>Can the Cloud Drive\? Interactive 5G\/6G Study \| Pouya Parsa<\/title>/
  );
  assert.match(
    html,
    /rel="canonical" href="https:\/\/pouya-parsa\.github\.io\/cloud-drive\/"/
  );
  assert.match(html, /name="citation_title"/);
  assert.match(html, /name="citation_arxiv_id" content="2607\.09045"/);
  assert.match(html, /"@type":\s*"ScholarlyArticle"/);
  assert.match(html, /"@type":\s*"FAQPage"/);
  for (const id of [
    "answer",
    "three-gates",
    "simulator",
    "strategies",
    "figures",
    "findings",
    "limitations",
    "faq",
    "citation",
  ]) {
    assert.match(html, new RegExp(`id="${id}"`), `missing #${id}`);
  }
});

test("Cloud Drive article includes all ten captioned figures", () => {
  const html = read("cloud-drive/index.html");
  for (let index = 1; index <= 10; index += 1) {
    const padded = String(index).padStart(2, "0");
    assert.match(html, new RegExp(`id="figure-${index}"`));
    assert.match(
      html,
      new RegExp(`src="../images/cloud-drive/figure-${padded}\\.svg"`)
    );
    assert.match(html, new RegExp(`Figure ${index}:`));
  }
  assert.equal((html.match(/<figure\b/g) || []).length, 10);
  assert.equal((html.match(/class="figure-why"/g) || []).length, 10);
});

test("simulator exposes every input and an accessible live result", () => {
  const html = read("cloud-drive/index.html");
  for (const name of [
    "model",
    "strategy",
    "generation",
    "budgetMs",
    "penetration",
    "utilization",
    "year",
  ]) {
    assert.match(html, new RegExp(`name="${name}"`));
  }
  assert.match(html, /id="scenario-result"[^>]*aria-live="polite"/);
  assert.match(html, /id="gate-communication"/);
  assert.match(html, /id="gate-compute"/);
  assert.match(html, /id="gate-cost"/);
  assert.match(
    html,
    /<noscript>[\s\S]*reference scenario[\s\S]*<\/noscript>/i
  );
});

test("interactive controller contains no inline scientific constants", () => {
  const controller = read("scripts/cloud-drive.js");
  assert.doesNotMatch(controller, /2_200_000|8_500|5600|1500/);
  assert.match(controller, /CloudDriveModel\.evaluateScenario/);
});

test("figure explorer and citation controls have accessible fallbacks", () => {
  const html = read("cloud-drive/index.html");
  assert.match(html, /role="group" aria-label="Filter paper figures"/);
  for (const filter of [
    "all",
    "framework",
    "communication",
    "compute",
    "cost",
  ]) {
    assert.match(html, new RegExp(`data-filter="${filter}"`));
  }
  assert.match(html, /<dialog id="figure-dialog"/);
  assert.match(
    html,
    /id="figure-dialog-close"[^>]*aria-label="Close enlarged figure"/
  );
  assert.match(html, /id="copy-citation"/);
  assert.match(
    html,
    /id="citation-status"[^>]*aria-live="polite"/
  );
});

test("interaction controller initializes filters, dialog, and citation copy", () => {
  const controller = read("scripts/cloud-drive.js");
  assert.match(controller, /function initFigureFilters\(\)/);
  assert.match(controller, /function initFigureDialog\(\)/);
  assert.match(controller, /function initCitationCopy\(\)/);
});

test("crawler discovery and social preview point to the canonical article", () => {
  const html = read("cloud-drive/index.html");
  const robots = read("robots.txt");
  const sitemap = read("sitemap.xml");
  const socialImage = path.join(
    root,
    "images/cloud-drive/og-cloud-drive.png"
  );

  assert.match(robots, /Sitemap: https:\/\/pouya-parsa\.github\.io\/sitemap\.xml/);
  assert.match(
    sitemap,
    /<loc>https:\/\/pouya-parsa\.github\.io\/cloud-drive\/<\/loc>/
  );
  assert.match(
    html,
    /property="og:image" content="https:\/\/pouya-parsa\.github\.io\/images\/cloud-drive\/og-cloud-drive\.png"/
  );
  assert.match(html, /name="twitter:card" content="summary_large_image"/);
  assert.equal(fs.existsSync(socialImage), true, "social preview image is missing");
  assert.ok(
    fs.statSync(socialImage).size > 10_000,
    "social preview image is unexpectedly small"
  );
});
