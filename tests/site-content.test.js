const test = require("node:test");
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), "utf8");
const escapeRegExp = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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

test("all public pages expose privacy-conscious analytics and annotated actions", () => {
  const home = read("index.html");
  const article = read("cloud-drive/index.html");
  const vda = read("visual-distribution-anchoring/index.html");
  const siteToken = "08854ddd9a7348d0885fd65e09c95132";
  const endpoint =
    "https://pouya-parsa-site-events.mail-pouyaparsa.workers.dev/event";

  for (const html of [home, article, vda]) {
    assert.equal((html.match(/data-cf-beacon=/g) || []).length, 1);
    assert.equal((html.match(new RegExp(siteToken, "g")) || []).length, 1);
    assert.match(
      html,
      new RegExp(
        `<meta name="site-analytics-endpoint" content="${endpoint}">`
      )
    );
  }
  assert.match(home, /<script type="module" src="scripts\/site-analytics\.mjs">/);
  assert.match(
    article,
    /<script type="module" src="\.\.\/scripts\/site-analytics\.mjs">/
  );
  assert.match(
    vda,
    /<script type="module" src="\.\.\/scripts\/site-analytics\.mjs">/
  );

  const anchorTags = (html, href) =>
    [...html.matchAll(/<a\b[^>]*>/g)]
      .map(([tag]) => tag)
      .filter((tag) => tag.includes(`href="${href}"`));
  const assertAnnotated = (html, href, eventName, expectedCount) => {
    const anchors = anchorTags(html, href);
    assert.equal(anchors.length, expectedCount);
    for (const anchor of anchors) {
      assert.match(
        anchor,
        new RegExp(`data-analytics-event="${eventName}"`)
      );
    }
  };

  assertAnnotated(home, "cloud-drive/", "interactive_article", 3);
  assertAnnotated(
    home,
    "visual-distribution-anchoring/",
    "interactive_article",
    3
  );
  assertAnnotated(home, "PouyaParsa_CV.pdf", "cv", 2);
  assertAnnotated(
    home,
    "https://github.com/pouya-parsa",
    "github_profile",
    1
  );
  assertAnnotated(
    home,
    "https://arxiv.org/pdf/2607.09045",
    "paper_pdf",
    1
  );
  assertAnnotated(
    article,
    "https://arxiv.org/pdf/2607.09045",
    "paper_pdf",
    2
  );
  assert.match(
    article,
    /<button id="copy-citation"[^>]*data-analytics-event="copy_citation"/
  );
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

test("Figure 1 preview preserves its light canvas background", () => {
  const preview = path.join(
    root,
    "images/cloud-drive/figure-01-preview.webp"
  );
  const cropArguments = [
    preview,
    "-crop",
    "1x1+10+500",
    "-depth",
    "8",
    "rgb:-",
  ];
  let result = spawnSync("magick", cropArguments);

  if (result.error?.code === "ENOENT") {
    result = spawnSync("convert", cropArguments);
  }

  assert.equal(result.error, undefined, "ImageMagick is required for image tests");
  assert.equal(result.status, 0, result.stderr.toString());
  assert.ok(
    [...result.stdout.subarray(0, 3)].every((channel) => channel >= 250),
    "the whitespace around Figure 1 must render white, not black"
  );
});

test("Figure 8 preview preserves readable axis labels", () => {
  const preview = path.join(
    root,
    "images/cloud-drive/figure-08-preview.webp"
  );
  const cropArguments = [
    preview,
    "-crop",
    "1x1+340+470",
    "-depth",
    "8",
    "rgb:-",
  ];
  let result = spawnSync("magick", cropArguments);

  if (result.error?.code === "ENOENT") {
    result = spawnSync("convert", cropArguments);
  }

  assert.equal(result.error, undefined, "ImageMagick is required for image tests");
  assert.equal(result.status, 0, result.stderr.toString());
  assert.ok(
    [...result.stdout.subarray(0, 3)].every((channel) => channel <= 80),
    "Figure 8's x-axis label must remain visible in the optimized preview"
  );
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
  assert.match(
    html,
    /href="cloud-drive\/"[^>]*>Explore the interactive article/
  );
  assert.match(
    html,
    /href="https:\/\/arxiv\.org\/pdf\/2607\.09045"[^>]*>Read the paper/
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
  assert.ok(
    fs.statSync(image).size > 20_000,
    "VDA overview is unexpectedly small"
  );
  assert.ok(
    fs.statSync(image).size < 350_000,
    "VDA overview exceeds 350 KB"
  );
});

test("VDA page exposes the approved preprint content and scholarly metadata", () => {
  const html = read("visual-distribution-anchoring/index.html");
  const title = "Visual Distribution Anchoring for Efficient Prompt Tuning";

  assert.match(html, new RegExp(`<h1[^>]*>${title}</h1>`));
  assert.match(
    html,
    /Preprint <span aria-hidden="true">·<\/span> July 2026/
  );
  for (const author of [
    "Pouya Parsa",
    "Raoof Zare Moayedi",
    "Seongjin Choi",
  ]) {
    assert.ok(html.includes(author), `missing author: ${author}`);
  }
  for (const id of [
    "overview",
    "method",
    "results",
    "evidence",
    "abstract",
    "limitations",
  ]) {
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
  assert.match(
    html,
    /name="robots" content="index, follow, max-image-preview:large"/
  );
  assert.match(
    html,
    new RegExp(`name="citation_title" content="${title}"`)
  );
  assert.equal((html.match(/name="citation_author"/g) ?? []).length, 3);
  assert.match(
    html,
    /name="citation_publication_date" content="2026\/07\/30"/
  );
  assert.match(html, /name="citation_arxiv_id" content="2607\.28967"/);
  assert.doesNotMatch(html, /name="citation_pdf_url"/);
  assert.match(
    html,
    /href="https:\/\/arxiv\.org\/abs\/2607\.28967"[^>]*>Paper ↗<\/a>/
  );

  const jsonLd = html.match(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/
  );
  assert.ok(jsonLd, "VDA JSON-LD block is missing");
  const graph = JSON.parse(jsonLd[1])["@graph"];
  const scholarlyArticle = graph.find(
    (node) => node["@type"] === "ScholarlyArticle"
  );
  assert.equal(scholarlyArticle.headline, title);
  assert.equal(scholarlyArticle.datePublished, "2026-07-30");
  assert.equal(scholarlyArticle.identifier, "arXiv:2607.28967");
  assert.equal(
    scholarlyArticle.url,
    "https://pouya-parsa.github.io/visual-distribution-anchoring/"
  );
  assert.equal(
    scholarlyArticle.sameAs,
    "https://arxiv.org/abs/2607.28967"
  );
  assert.equal("encoding" in scholarlyArticle, false);
});

test("VDA page exposes human-readable and BibTeX citation details", () => {
  const html = read("visual-distribution-anchoring/index.html");
  const css = read("css/visual-distribution-anchoring.css");

  assert.match(html, /href="#citation"[^>]*>Citation<\/a>/);
  assert.match(
    html,
    /<section class="article-section citation-section" id="citation" aria-labelledby="citation-heading">/
  );
  assert.match(
    html,
    /Pouya Parsa, Raoof Zare Moayedi, and Seongjin Choi\./
  );
  assert.match(html, /arXiv:2607\.28967 \[cs\.CV\], 2026/);
  assert.match(
    html,
    /href="https:\/\/doi\.org\/10\.48550\/arXiv\.2607\.28967"[^>]*>doi:10\.48550\/arXiv\.2607\.28967<\/a>/
  );
  assert.match(
    html,
    /href="https:\/\/arxiv\.org\/pdf\/2607\.28967"[^>]*>Download PDF ↗<\/a>/
  );
  assert.match(
    html,
    /href="https:\/\/arxiv\.org\/abs\/2607\.28967"[^>]*>Open on arXiv ↗<\/a>/
  );
  assert.match(html, /<pre id="bibtex"><code>@article\{parsa2026visual,/);
  assert.match(
    html,
    /author=\{Parsa, Pouya and Moayedi, Raoof Zare and Choi, Seongjin\}/
  );
  assert.match(
    html,
    /journal=\{arXiv preprint arXiv:2607\.28967\}/
  );
  assert.match(html, /doi=\{10\.48550\/arXiv\.2607\.28967\}/);

  assert.match(css, /\.citation-layout\s*\{[\s\S]*display:\s*grid/);
  assert.match(css, /\.bibtex-card\s*\{[\s\S]*background:\s*#111d33/);
  assert.match(
    css,
    /\.bibtex-card pre\s*\{[\s\S]*overflow-x:\s*auto/
  );
  assert.match(
    css,
    /@media\s*\(max-width:\s*900px\)[\s\S]*\.citation-layout[\s\S]*grid-template-columns:\s*1fr/
  );
  assert.match(
    css,
    /@media\s*print[\s\S]*\.citation-actions[\s\S]*display:\s*none/
  );
  assert.match(
    html,
    /<button id="copy-citation" type="button">Copy citation<\/button>/
  );
  assert.match(
    html,
    /<p id="citation-status" aria-live="polite"><\/p>/
  );
  assert.match(
    html,
    /<script type="module" src="\.\.\/scripts\/visual-distribution-anchoring\.mjs"><\/script>/
  );
  assert.match(css, /#copy-citation\s*\{[\s\S]*cursor:\s*pointer/);
});

test("VDA stylesheet defines its distinct responsive academic system", () => {
  const css = read("css/visual-distribution-anchoring.css");
  assert.match(css, /--vda-indigo:\s*#1f4f9a/);
  assert.match(css, /--vda-lavender:\s*#7652b8/);
  assert.match(css, /--vda-orange:\s*#d85f00/);
  assert.match(css, /\.paper-nav\s*\{[\s\S]*position:\s*sticky/);
  assert.match(css, /\.method-grid\s*\{[\s\S]*display:\s*grid/);
  assert.match(
    css,
    /\.results-table-wrap\s*\{[\s\S]*overflow-x:\s*auto/
  );
  assert.match(css, /@media\s*\(max-width:\s*760px\)/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(css, /@media\s*print/);
});

test("homepage promotes the VDA preprint with its arXiv link", () => {
  const html = read("index.html");
  const route = "visual-distribution-anchoring/";
  assert.match(
    html,
    /Visual Distribution Anchoring for Efficient Prompt Tuning/
  );
  assert.match(html, /Preprint, July 2026/);
  assert.match(html, /arXiv:2607\.28967/);
  assert.match(html, /65\.82% to 69\.21%/);
  assert.equal(
    (html.match(new RegExp(`href="${route}"`, "g")) ?? []).length,
    3
  );
  const publication = html.match(
    /<article>\s*<h3><a href="visual-distribution-anchoring\/"[\s\S]*?<\/article>/
  );
  assert.ok(publication, "VDA publication entry is missing");
  assert.match(
    publication[0],
    /href="https:\/\/arxiv\.org\/abs\/2607\.28967"[^>]*>Read the paper<\/a>/
  );
});

test("sitemap lists the VDA canonical exactly once", () => {
  const sitemap = read("sitemap.xml");
  const canonical =
    "https://pouya-parsa.github.io/visual-distribution-anchoring/";
  assert.equal(sitemap.split(canonical).length - 1, 1);
});
