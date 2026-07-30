const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), "utf8");

test("Search Console verification file is published at the site root", () => {
  const rootToken = path.join(root, "googlec2d107d84ed0147d.html");
  const nestedToken = path.join(
    root,
    "google-console/googlec2d107d84ed0147d.html"
  );

  assert.equal(fs.existsSync(rootToken), true);
  assert.equal(
    fs.readFileSync(rootToken, "utf8").trim(),
    "google-site-verification: googlec2d107d84ed0147d.html"
  );
  assert.equal(fs.existsSync(nestedToken), false);
});

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

test("homepage exposes canonical social and Person discovery metadata", () => {
  const html = read("index.html");
  assert.match(
    html,
    /rel="canonical" href="https:\/\/pouya-parsa\.github\.io\/"/
  );
  assert.match(html, /property="og:type" content="profile"/);
  assert.match(
    html,
    /property="og:url" content="https:\/\/pouya-parsa\.github\.io\/"/
  );
  assert.match(
    html,
    /property="og:image" content="https:\/\/pouya-parsa\.github\.io\/profile_image\.webp"/
  );
  assert.match(html, /name="twitter:card" content="summary"/);

  const block = html.match(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/
  );
  assert.ok(block, "homepage JSON-LD block is missing");
  const person = JSON.parse(block[1]);
  assert.equal(person["@type"], "Person");
  assert.equal(
    person["@id"],
    "https://pouya-parsa.github.io/#pouya-parsa"
  );
  assert.equal(person.name, "Pouya Parsa");
  assert.equal(person.url, "https://pouya-parsa.github.io/");
  assert.equal(person.sameAs, "https://github.com/pouya-parsa");
});

test("homepage uses a right-sized profile image", () => {
  const html = read("index.html");
  const imagePath = path.join(root, "profile_image.webp");

  assert.match(
    html,
    /src="profile_image\.webp" alt="Pouya Parsa" width="400" height="400"/
  );
  assert.equal(fs.existsSync(imagePath), true, "profile WebP is missing");
  assert.ok(
    fs.statSync(imagePath).size < 50_000,
    "profile WebP exceeds its 50 KB performance budget"
  );
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

test("article uses lightweight previews above the fold", () => {
  const html = read("cloud-drive/index.html");
  const previews = [
    {
      file: "images/cloud-drive/figure-01-preview.webp",
      markup:
        /src="\.\.\/images\/cloud-drive\/figure-01-preview\.webp"[^>]*width="1200"[^>]*height="675"/,
      budget: 100_000,
    },
    {
      file: "images/cloud-drive/figure-08-preview.webp",
      markup:
        /src="\.\.\/images\/cloud-drive\/figure-08-preview\.webp"[^>]*width="1200"[^>]*height="484"/,
      budget: 30_000,
    },
  ];

  for (const preview of previews) {
    assert.match(html, preview.markup);
    const absolute = path.join(root, preview.file);
    assert.equal(fs.existsSync(absolute), true, `${preview.file} is missing`);
    assert.ok(
      fs.statSync(absolute).size < preview.budget,
      `${preview.file} exceeds its performance budget`
    );
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

test("article uses the approved academic project-page structure", () => {
  const html = read("cloud-drive/index.html");
  assert.match(html, /class="paper-hero"/);
  assert.match(
    html,
    /class="project-badge">Interactive research article</
  );
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

test("article stylesheet exposes the approved light academic system", () => {
  const css = read("css/cloud-drive.css");
  assert.match(css, /--accent:\s*#2f6df6/);
  assert.match(css, /--max-width:\s*980px/);
  assert.match(css, /\.paper-hero\s*\{/);
  assert.match(css, /\.paper-nav\s*\{[\s\S]*position:\s*sticky/);
  assert.match(css, /\.paper-facts\s*\{[\s\S]*display:\s*grid/);
  assert.match(
    css,
    /\.figure-grid\s*\{[\s\S]*grid-template-columns:\s*repeat\(2/
  );
  assert.match(css, /@media\s*\(max-width:\s*760px\)/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(css, /@media\s*print/);
  assert.doesNotMatch(css, /\.limitations-(?:section|grid)/);
  assert.doesNotMatch(css, /\.faq-(?:section|list)/);
});

test("controller initializes presets, scenario copy, and section navigation", () => {
  const controller = read("scripts/cloud-drive.js");
  assert.match(controller, /function initPresetControls\(\)/);
  assert.match(controller, /function initScenarioCopy\(\)/);
  assert.match(controller, /function initSectionNavigation\(\)/);
  assert.match(controller, /SCENARIO_PRESETS/);
  assert.match(controller, /IntersectionObserver/);
});

test("article gives VLA Roofline compute its own plain-language section", () => {
  const html = read("cloud-drive/index.html");

  assert.match(
    html,
    /id="compute-roofline"[^>]*aria-labelledby="roofline-heading"/
  );
  assert.match(
    html,
    /id="roofline-heading">VLA waits on memory, not just math\.<\/h2>/
  );
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
  ]) {
    assert.ok(html.includes(headline), `missing direct headline: ${headline}`);
  }
});

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

test("homepage leads with the VLA memory-bandwidth result", () => {
  const html = read("index.html");
  assert.match(
    html,
    /near-term cloud VLA inference is often limited by GPU memory bandwidth/i
  );
  assert.match(html, /even after 5G\/6G can carry the workload/i);
  assert.match(html, /href="cloud-drive\/">Explore the interactive article/);
  assert.match(
    html,
    /href="https:\/\/arxiv\.org\/pdf\/2607\.09045">Read the paper/
  );
});

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
  assert.match(css, /@media\s*print[\s\S]*\.roofline-section/);
});
