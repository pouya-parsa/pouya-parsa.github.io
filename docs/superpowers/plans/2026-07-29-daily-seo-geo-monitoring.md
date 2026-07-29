# Daily SEO and GEO Monitoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a credential-free daily GitHub Actions monitor that checks the deployed portfolio and Cloud Drive article for availability, SEO/GEO readiness, broken internal resources, and Lighthouse regressions.

**Architecture:** Pure audit modules evaluate HTML, robots, sitemap, and Lighthouse data; a thin live runner supplies bounded network requests and writes JSON/Markdown reports. GitHub Actions runs the existing tests, live audit, and three-run mobile Lighthouse measurement independently, always publishes artifacts and a job summary, and then applies a single failure gate.

**Tech Stack:** Node.js 22, Node built-in test runner, native `fetch`, Cheerio 1.2.0, robots-parser 3.0.1, Lighthouse CI 0.15.1, GitHub Actions, static HTML/JSON-LD.

## Global Constraints

- Monitor `https://pouya-parsa.github.io/`, `https://pouya-parsa.github.io/cloud-drive/`, `robots.txt`, and `sitemap.xml`.
- Require no repository secrets, paid services, analytics scripts, issue creation, or repository-write permission.
- Treat deterministic same-origin failures as errors and third-party link availability as warnings.
- Check Googlebot, OAI-SearchBot, PerplexityBot, and a generic crawler.
- Require SEO >= 95, Accessibility >= 90, Best Practices >= 90, Performance >= 80, LCP <= 3,000 ms, CLS <= 0.10, and TBT <= 300 ms.
- Run Lighthouse three times per page with mobile emulation and median aggregation.
- Retain JSON, Markdown, and Lighthouse artifacts for 90 days.
- Keep daily reports out of Git history.
- Preserve the existing visual design and describe only visible, accurate content in metadata.
- Preserve the unrelated untracked `main.tex` file.

## File structure

- Create `package.json` and `package-lock.json`: reproducible monitor dependencies and commands without changing the static site's runtime.
- Modify `.gitignore`: keep installed dependencies and generated monitoring reports out of Git history.
- Create `monitoring/site-policy.mjs`: canonical pages, crawler agents, page-specific schema/citation/figure requirements, and fetch/canonical URL mapping.
- Create `monitoring/audit-core.mjs`: deterministic HTML, robots, sitemap, fragment, and cross-page validation.
- Create `monitoring/audit-live.mjs`: retrying network fetches, internal-resource discovery, and complete site orchestration.
- Create `monitoring/report.mjs`: status aggregation and JSON/Markdown site-audit reports.
- Create `monitoring/lighthouse-report.mjs`: Lighthouse JSON loading, median aggregation, threshold evaluation, and Markdown rendering.
- Create `scripts/site-audit.mjs`: command-line entry point for the live audit.
- Create `scripts/lighthouse-summary.mjs`: command-line entry point for the Lighthouse summary.
- Create `lighthouserc.cjs`: two-page, three-run mobile collection and assertions.
- Create `.github/workflows/daily-site-monitor.yml`: scheduled/manual read-only monitor.
- Create `docs/monitoring.md`: operator guide, metric interpretation, and credential-free limitations.
- Create `tests/fixtures/monitoring-site.mjs`: compact valid HTML/robots/sitemap fixtures shared by monitor tests.
- Create `tests/site-audit-core.test.mjs`: deterministic validation tests.
- Create `tests/site-audit-live.test.mjs`: retry, resource, report, and exit-policy tests.
- Create `tests/lighthouse-report.test.mjs`: aggregation and Markdown tests.
- Create `tests/monitoring-config.test.mjs`: Lighthouse and workflow policy tests.
- Modify `tests/site-content.test.js`: homepage metadata regression coverage.
- Modify `index.html`: canonical, Open Graph, Twitter, and `Person` JSON-LD metadata.

---

### Task 1: Build deterministic SEO/GEO audit rules

**Files:**
- Create: `package.json`
- Create: `package-lock.json`
- Modify: `.gitignore`
- Create: `monitoring/site-policy.mjs`
- Create: `monitoring/audit-core.mjs`
- Create: `tests/fixtures/monitoring-site.mjs`
- Create: `tests/site-audit-core.test.mjs`

**Interfaces:**
- Produces: `buildSitePolicy({ fetchBaseUrl, canonicalBaseUrl }) -> SitePolicy`
- Produces: `auditHtmlPage({ html, fetchUrl, policy }) -> { checks: Check[], internalUrls: string[], externalUrls: string[] }`
- Produces: `auditRobots({ text, robotsUrl, sitemapUrl, pageUrls, userAgents }) -> Check[]`
- Produces: `auditSitemap({ xml, requiredCanonicalUrls }) -> Check[]`
- Produces: `auditCrossPageMetadata(pageResults) -> Check[]`
- Produces: `Check = { id, status: "pass"|"warn"|"fail", message, url?, expected?, observed? }`

- [ ] **Step 1: Add the reproducible Node tool manifest**

Create `package.json` exactly as:

```json
{
  "name": "pouya-parsa-site-monitor",
  "private": true,
  "scripts": {
    "test": "node --test tests/*.test.js tests/*.test.mjs",
    "monitor:site": "node scripts/site-audit.mjs",
    "monitor:lighthouse:collect": "lhci collect --config=lighthouserc.cjs",
    "monitor:lighthouse:assert": "lhci assert --config=lighthouserc.cjs",
    "monitor:lighthouse:upload": "lhci upload --config=lighthouserc.cjs",
    "monitor:lighthouse:summary": "node scripts/lighthouse-summary.mjs"
  },
  "dependencies": {
    "cheerio": "1.2.0",
    "robots-parser": "3.0.1"
  },
  "devDependencies": {
    "@lhci/cli": "0.15.1"
  },
  "engines": {
    "node": ">=22"
  }
}
```

Run:

```bash
npm_config_cache=/tmp/codex-npm-monitoring npm install --package-lock-only
npm_config_cache=/tmp/codex-npm-monitoring npm ci
```

Then run the pre-existing suite before the first `.mjs` test file exists:

```bash
node --test tests/*.test.js
```

Expected: `package-lock.json` is created, dependencies install, and the
existing command reports all 36 tests passing. After Step 3 creates the first
`.test.mjs` file, the `npm test` script covers both extensions.

Append these generated paths to `.gitignore`:

```gitignore
node_modules/
.monitoring/
.lighthouseci/
```

- [ ] **Step 2: Write compact valid site fixtures**

Create `tests/fixtures/monitoring-site.mjs` with a `page()` helper and concrete
fixtures:

```js
export function page({
  canonical,
  title,
  schema,
  body = '<main><h1>Page heading</h1></main>',
  extraHead = "",
}) {
  const description = `${title} has a sufficiently descriptive summary.`;
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${canonical}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="https://pouya-parsa.github.io/profile_image.png">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="https://pouya-parsa.github.io/profile_image.png">
  ${extraHead}
  <script type="application/ld+json">${JSON.stringify(schema)}</script>
</head>
<body>${body}</body>
</html>`;
}

export const personNode = {
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": "https://pouya-parsa.github.io/#pouya-parsa",
  name: "Pouya Parsa",
  url: "https://pouya-parsa.github.io/",
  sameAs: "https://github.com/pouya-parsa",
};

export const validHomepageHtml = page({
  canonical: "https://pouya-parsa.github.io/",
  title: "Pouya Parsa",
  schema: personNode,
  body: '<main><h1>Pouya Parsa</h1><h2>About me</h2><img src="/profile_image.png" alt="Pouya Parsa"></main>',
});

export const validArticleHtml = page({
  canonical: "https://pouya-parsa.github.io/cloud-drive/",
  title: "Can the Cloud Drive? Interactive 5G/6G Study | Pouya Parsa",
  schema: {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ScholarlyArticle",
        headline: "Can the Cloud Drive? Infrastructure Feasibility of Offloading Autonomous Driving Across 5G and 6G",
        identifier: "arXiv:2607.09045",
        datePublished: "2026-07-10",
        url: "https://pouya-parsa.github.io/cloud-drive/",
        sameAs: "https://arxiv.org/abs/2607.09045",
        author: [{ "@id": "https://pouya-parsa.github.io/#pouya-parsa" }],
      },
      personNode,
      { "@type": "BreadcrumbList", itemListElement: [] },
    ],
  },
  extraHead: `
    <meta name="citation_title" content="Can the Cloud Drive? Infrastructure Feasibility of Offloading Autonomous Driving Across 5G and 6G">
    <meta name="citation_author" content="Parsa, Pouya">
    <meta name="citation_author" content="Han, Kawon">
    <meta name="citation_author" content="Choi, Seongjin">
    <meta name="citation_publication_date" content="2026/07/10">
    <meta name="citation_arxiv_id" content="2607.09045">
    <meta name="citation_pdf_url" content="https://arxiv.org/pdf/2607.09045">`,
  body: `<main><h1>Can the Cloud Drive? Infrastructure Feasibility of Offloading Autonomous Driving Across 5G and 6G</h1>
    <h2>Paper overview</h2>
    <a href="https://arxiv.org/pdf/2607.09045">Paper</a>
    ${Array.from({ length: 10 }, (_, index) =>
      `<figure id="figure-${index + 1}"><img src="/images/cloud-drive/figure-${String(index + 1).padStart(2, "0")}.svg" alt="Figure ${index + 1} description"><figcaption>Figure ${index + 1}: Result</figcaption></figure>`
    ).join("")}</main>`,
});

export const validRobots = `User-agent: *
Allow: /

Sitemap: https://pouya-parsa.github.io/sitemap.xml
`;

export const validSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://pouya-parsa.github.io/</loc></url>
  <url><loc>https://pouya-parsa.github.io/cloud-drive/</loc></url>
</urlset>`;
```

- [ ] **Step 3: Write failing core policy tests**

Create `tests/site-audit-core.test.mjs` with tests for a valid baseline and each
required failure class:

```js
import test from "node:test";
import assert from "node:assert/strict";
import {
  auditCrossPageMetadata,
  auditHtmlPage,
  auditRobots,
  auditSitemap,
} from "../monitoring/audit-core.mjs";
import { buildSitePolicy } from "../monitoring/site-policy.mjs";
import {
  validArticleHtml,
  validHomepageHtml,
  validRobots,
  validSitemap,
} from "./fixtures/monitoring-site.mjs";

const policy = buildSitePolicy({
  fetchBaseUrl: "https://pouya-parsa.github.io/",
  canonicalBaseUrl: "https://pouya-parsa.github.io/",
});
const homePolicy = policy.pages.find((page) => page.path === "/");
const articlePolicy = policy.pages.find((page) => page.path === "/cloud-drive/");
const failedIds = (result) =>
  result.checks.filter((check) => check.status === "fail").map((check) => check.id);

test("valid homepage satisfies deterministic metadata checks", () => {
  const result = auditHtmlPage({
    html: validHomepageHtml,
    fetchUrl: homePolicy.fetchUrl,
    policy: homePolicy,
  });
  assert.deepEqual(failedIds(result), []);
  assert.deepEqual(result.internalUrls, [
    "https://pouya-parsa.github.io/profile_image.png",
  ]);
});

test("missing canonical, description, h1, social tags, and alt text fail", () => {
  const broken = validHomepageHtml
    .replace(/<meta name="description"[^>]+>/, "")
    .replace(/<link rel="canonical"[^>]+>/, "")
    .replace(/<meta property="og:title"[^>]+>/, "")
    .replace(/<meta name="twitter:title"[^>]+>/, "")
    .replace("<h1>Pouya Parsa</h1>", "")
    .replace('alt="Pouya Parsa"', "");
  const result = auditHtmlPage({
    html: broken,
    fetchUrl: homePolicy.fetchUrl,
    policy: homePolicy,
  });
  assert.deepEqual(
    new Set(failedIds(result)),
    new Set([
      "meta.description",
      "meta.canonical",
      "meta.h1",
      "meta.open-graph",
      "meta.twitter",
      "images.alt",
      "geo.semantic-headings",
    ])
  );
});

test("invalid JSON-LD and inconsistent article identity fail", () => {
  const invalidJson = validArticleHtml.replace(
    /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
    '<script type="application/ld+json">{"@type":</script>'
  );
  const invalidResult = auditHtmlPage({
    html: invalidJson,
    fetchUrl: articlePolicy.fetchUrl,
    policy: articlePolicy,
  });
  assert.ok(failedIds(invalidResult).includes("schema.json"));

  const inconsistent = validArticleHtml.replace(
    "arXiv:2607.09045",
    "arXiv:0000.00000"
  );
  const inconsistentResult = auditHtmlPage({
    html: inconsistent,
    fetchUrl: articlePolicy.fetchUrl,
    policy: articlePolicy,
  });
  assert.ok(failedIds(inconsistentResult).includes("geo.paper-identity"));
});

test("blocked answer-engine crawler fails", () => {
  const checks = auditRobots({
    text: `User-agent: OAI-SearchBot\nDisallow: /\nUser-agent: *\nAllow: /`,
    robotsUrl: policy.robotsUrl,
    sitemapUrl: policy.canonicalSitemapUrl,
    pageUrls: policy.pages.map((page) => page.fetchUrl),
    userAgents: policy.userAgents,
  });
  assert.ok(
    checks.some(
      (check) => check.id === "robots.OAI-SearchBot" && check.status === "fail"
    )
  );
});

test("missing and duplicate sitemap entries fail", () => {
  const xml = validSitemap.replace(
    "</urlset>",
    "<url><loc>https://pouya-parsa.github.io/</loc></url></urlset>"
  ).replace(
    "<url><loc>https://pouya-parsa.github.io/cloud-drive/</loc></url>",
    ""
  );
  const checks = auditSitemap({
    xml,
    requiredCanonicalUrls: policy.pages.map((page) => page.canonicalUrl),
  });
  assert.ok(checks.some((check) => check.id === "sitemap.required" && check.status === "fail"));
  assert.ok(checks.some((check) => check.id === "sitemap.duplicates" && check.status === "fail"));
});

test("malformed sitemap structure fails", () => {
  const checks = auditSitemap({
    xml: "<html><body>not a sitemap</body></html>",
    requiredCanonicalUrls: policy.pages.map((page) => page.canonicalUrl),
  });
  assert.ok(
    checks.some(
      (check) => check.id === "sitemap.xml" && check.status === "fail"
    )
  );
});

test("missing same-page fragment target fails", () => {
  const broken = validHomepageHtml.replace(
    "</main>",
    '<a href="#missing-section">Missing section</a></main>'
  );
  const result = auditHtmlPage({
    html: broken,
    fetchUrl: homePolicy.fetchUrl,
    policy: homePolicy,
  });
  assert.ok(failedIds(result).includes("fragment.missing-section"));
});

test("duplicate page titles fail the cross-page check", () => {
  const pages = [validHomepageHtml, validHomepageHtml].map((html, index) =>
    auditHtmlPage({
      html,
      fetchUrl: policy.pages[index].fetchUrl,
      policy: policy.pages[index],
    })
  );
  const checks = auditCrossPageMetadata(pages);
  assert.ok(checks.some((check) => check.id === "meta.unique-title" && check.status === "fail"));
});
```

- [ ] **Step 4: Run the focused tests to verify RED**

Run:

```bash
node --test tests/site-audit-core.test.mjs
```

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `monitoring/audit-core.mjs`.

- [ ] **Step 5: Implement the site policy**

Create `monitoring/site-policy.mjs`. Normalize both bases with trailing slashes
and return this concrete policy:

```js
const absolute = (path, base) => new URL(path.replace(/^\//, ""), base).href;

export function buildSitePolicy({
  fetchBaseUrl = "https://pouya-parsa.github.io/",
  canonicalBaseUrl = "https://pouya-parsa.github.io/",
} = {}) {
  const fetchBase = new URL("/", fetchBaseUrl).href;
  const canonicalBase = new URL("/", canonicalBaseUrl).href;
  const shared = {
    requiredOpenGraph: ["og:type", "og:url", "og:title", "og:description", "og:image"],
    requiredTwitter: ["twitter:card", "twitter:title", "twitter:description", "twitter:image"],
  };

  return {
    fetchBaseUrl: fetchBase,
    canonicalBaseUrl: canonicalBase,
    robotsUrl: absolute("/robots.txt", fetchBase),
    sitemapUrl: absolute("/sitemap.xml", fetchBase),
    canonicalSitemapUrl: absolute("/sitemap.xml", canonicalBase),
    userAgents: ["Googlebot", "OAI-SearchBot", "PerplexityBot", "SiteMonitor"],
    pages: [
      {
        ...shared,
        path: "/",
        fetchUrl: absolute("/", fetchBase),
        canonicalUrl: absolute("/", canonicalBase),
        requiredSchemaTypes: ["Person"],
        personId: `${canonicalBase}#pouya-parsa`,
      },
      {
        ...shared,
        path: "/cloud-drive/",
        fetchUrl: absolute("/cloud-drive/", fetchBase),
        canonicalUrl: absolute("/cloud-drive/", canonicalBase),
        requiredSchemaTypes: ["ScholarlyArticle", "Person", "BreadcrumbList"],
        personId: `${canonicalBase}#pouya-parsa`,
        paper: {
          arxivId: "2607.09045",
          title: "Can the Cloud Drive? Infrastructure Feasibility of Offloading Autonomous Driving Across 5G and 6G",
          authors: ["Parsa, Pouya", "Han, Kawon", "Choi, Seongjin"],
          datePublished: "2026-07-10",
          citationDate: "2026/07/10",
          pdfUrl: "https://arxiv.org/pdf/2607.09045",
          sourceUrl: "https://arxiv.org/abs/2607.09045",
          figureCount: 10,
        },
      },
    ],
  };
}
```

- [ ] **Step 6: Implement deterministic checks**

Create `monitoring/audit-core.mjs` using Cheerio and robots-parser. Implement
these exact behaviors:

```js
import * as cheerio from "cheerio";
import robotsParser from "robots-parser";

const check = (id, passed, message, detail = {}) => ({
  id,
  status: passed ? "pass" : "fail",
  message,
  ...detail,
});

const content = ($, selector, attribute = "content") =>
  $(selector).first().attr(attribute)?.trim() ?? "";

export function collectJsonLdNodes($) {
  const nodes = [];
  const errors = [];
  $('script[type="application/ld+json"]').each((_, element) => {
    try {
      const value = JSON.parse($(element).text());
      if (Array.isArray(value)) nodes.push(...value);
      else if (Array.isArray(value?.["@graph"])) nodes.push(...value["@graph"]);
      else nodes.push(value);
    } catch (error) {
      errors.push(error.message);
    }
  });
  return { nodes, errors };
}

export function auditHtmlPage({ html, fetchUrl, policy }) {
  const $ = cheerio.load(html);
  const checks = [];
  const title = $("title").first().text().trim();
  const description = content($, 'meta[name="description"]');
  const canonical = content($, 'link[rel="canonical"]', "href");
  const robots = content($, 'meta[name="robots"]').toLowerCase();
  const h1Count = $("h1").length;
  const h2Count = $("main h2").length;
  const lang = $("html").attr("lang")?.trim() ?? "";
  const viewport = content($, 'meta[name="viewport"]');
  const openGraph = Object.fromEntries(
    policy.requiredOpenGraph.map((name) => [
      name,
      content($, `meta[property="${name}"]`),
    ])
  );
  const twitter = Object.fromEntries(
    policy.requiredTwitter.map((name) => [
      name,
      content($, `meta[name="${name}"]`),
    ])
  );
  const missingAlt = $("img").filter((_, image) => {
    const alt = $(image).attr("alt");
    return alt === undefined || alt.trim() === "";
  }).length;
  const { nodes, errors } = collectJsonLdNodes($);
  const types = new Set(nodes.flatMap((node) => {
    const type = node?.["@type"];
    return Array.isArray(type) ? type : type ? [type] : [];
  }));

  checks.push(check("meta.title", Boolean(title), "Page has a title", { url: fetchUrl }));
  checks.push(check("meta.description", Boolean(description), "Page has a meta description", { url: fetchUrl }));
  checks.push(check("meta.canonical", canonical === policy.canonicalUrl, "Canonical matches policy", {
    url: fetchUrl, expected: policy.canonicalUrl, observed: canonical,
  }));
  checks.push(check("meta.h1", h1Count === 1, "Page has exactly one h1", {
    url: fetchUrl, expected: 1, observed: h1Count,
  }));
  checks.push(check(
    "geo.semantic-headings",
    h1Count === 1 && h2Count > 0,
    "Main content has a semantic h1/h2 hierarchy",
    { url: fetchUrl, observed: { h1: h1Count, h2: h2Count } }
  ));
  checks.push(check("meta.lang", Boolean(lang), "Document language is declared", { url: fetchUrl }));
  checks.push(check("meta.viewport", Boolean(viewport), "Viewport is declared", { url: fetchUrl }));
  checks.push(check("meta.indexable", !robots.includes("noindex"), "Page does not request noindex", { url: fetchUrl }));
  checks.push(check(
    "meta.open-graph",
    Object.values(openGraph).every(Boolean) &&
      openGraph["og:url"] === policy.canonicalUrl,
    "Required Open Graph fields are present and og:url matches canonical",
    { url: fetchUrl }
  ));
  checks.push(check("meta.twitter", Object.values(twitter).every(Boolean), "Required Twitter fields are present", { url: fetchUrl }));
  checks.push(check("images.alt", missingAlt === 0, "Meaningful images have alt text", {
    url: fetchUrl, expected: 0, observed: missingAlt,
  }));
  checks.push(check("schema.json", errors.length === 0 && nodes.length > 0, "JSON-LD parses", {
    url: fetchUrl, observed: errors,
  }));
  checks.push(check(
    "schema.required-types",
    policy.requiredSchemaTypes.every((type) => types.has(type)),
    "Required schema types are present",
    { url: fetchUrl, expected: policy.requiredSchemaTypes, observed: [...types] }
  ));

  const person = nodes.find((node) => node?.["@type"] === "Person");
  checks.push(check(
    "geo.person-identity",
    person?.["@id"] === policy.personId &&
      person?.name === "Pouya Parsa" &&
      person?.url === new URL("/", policy.canonicalUrl).href &&
      Boolean(person?.sameAs),
    "Person identity is stable and attributable",
    { url: fetchUrl }
  ));

  if (policy.paper) {
    const article = nodes.find((node) => node?.["@type"] === "ScholarlyArticle");
    const citationTitle = content($, 'meta[name="citation_title"]');
    const citationAuthors = $('meta[name="citation_author"]')
      .map((_, element) => $(element).attr("content")?.trim())
      .get();
    const citationDate = content($, 'meta[name="citation_publication_date"]');
    const citationArxiv = content($, 'meta[name="citation_arxiv_id"]');
    const citationPdf = content($, 'meta[name="citation_pdf_url"]');
    const figureCount = $("figure").length;
    const captionCount = $("figure figcaption").length;
    const paperLinked = $(`a[href="${policy.paper.pdfUrl}"]`).length > 0;
    const visibleHeading = $("h1").text().replace(/\s+/g, " ").trim();
    checks.push(check(
      "geo.paper-identity",
      article?.headline === policy.paper.title &&
        article?.identifier === `arXiv:${policy.paper.arxivId}` &&
        article?.datePublished === policy.paper.datePublished &&
        article?.url === policy.canonicalUrl &&
        article?.sameAs === policy.paper.sourceUrl &&
        Array.isArray(article?.author) &&
        article.author.some((author) => author?.["@id"] === policy.personId) &&
        visibleHeading === policy.paper.title &&
        citationTitle === policy.paper.title &&
        JSON.stringify(citationAuthors) === JSON.stringify(policy.paper.authors) &&
        citationDate === policy.paper.citationDate &&
        citationArxiv === policy.paper.arxivId &&
        citationPdf === policy.paper.pdfUrl,
      "Visible and machine-readable paper identity agrees",
      { url: fetchUrl }
    ));
    checks.push(check(
      "geo.paper-source",
      paperLinked,
      "Article links to the primary paper PDF",
      { url: fetchUrl }
    ));
    checks.push(check(
      "geo.figures",
      figureCount === policy.paper.figureCount &&
        captionCount === policy.paper.figureCount,
      "All official figures have visible captions",
      {
        url: fetchUrl,
        expected: policy.paper.figureCount,
        observed: { figures: figureCount, captions: captionCount },
      }
    ));
  }

  const internalUrls = new Set();
  const externalUrls = new Set();
  for (const [selector, attribute] of [
    ["a[href]", "href"],
    ["img[src]", "src"],
    ['link[rel~="stylesheet"][href], link[rel~="icon"][href], link[rel="preload"][href]', "href"],
    ["script[src]", "src"],
    ['meta[property="og:image"]', "content"],
    ['meta[name="twitter:image"]', "content"],
  ]) {
    $(selector).each((_, element) => {
      const raw = $(element).attr(attribute);
      if (!raw || raw.startsWith("#") || /^(mailto:|tel:|data:|javascript:)/i.test(raw)) return;
      const resolved = new URL(raw, fetchUrl);
      if (resolved.origin === new URL(fetchUrl).origin) {
        resolved.hash = "";
        internalUrls.add(resolved.href);
      } else {
        externalUrls.add(resolved.href);
      }
    });
  }

  $("a[href^='#']").each((_, anchor) => {
    const fragment = decodeURIComponent($(anchor).attr("href").slice(1));
    if (fragment) {
      checks.push(check(
        `fragment.${fragment}`,
        $(`#${CSS.escape(fragment)}`).length === 1,
        `Fragment #${fragment} resolves exactly once`,
        { url: fetchUrl }
      ));
    }
  });

  return {
    checks,
    internalUrls: [...internalUrls].sort(),
    externalUrls: [...externalUrls].sort(),
    title,
    canonical,
  };
}
```

Because Node does not expose browser `CSS.escape`, define and use a local
attribute-safe fragment helper instead:

```js
const countId = ($, id) =>
  $("[id]").filter((_, element) => $(element).attr("id") === id).length;
```

Replace the `CSS.escape` expression in the draft above with
`countId($, fragment)`.

Complete the module with:

- `auditRobots`: create `robotsParser(robotsUrl, text)`, assert the canonical
  sitemap line exists, and emit one check per user-agent requiring every
  monitored fetch URL to return `parser.isAllowed(url, agent) !== false`.
- `auditSitemap`: load XML with `cheerio.load(xml, { xmlMode: true })`, collect
  trimmed `loc` values, fail `sitemap.xml` unless one `urlset` and at least
  one valid absolute `loc` exist, fail when any required canonical URL
  appears other than exactly once, and fail when any URL is duplicated.
- `auditCrossPageMetadata`: fail if any non-empty page title or canonical is
  duplicated.

Use stable IDs `robots.sitemap`, `robots.Googlebot`,
`robots.OAI-SearchBot`, `robots.PerplexityBot`, `robots.SiteMonitor`,
`sitemap.xml`, `sitemap.required`, `sitemap.duplicates`,
`meta.unique-title`, and `meta.unique-canonical`.

- [ ] **Step 7: Run the core tests to verify GREEN**

Run:

```bash
npm test -- --test-name-pattern="valid homepage|missing canonical|invalid JSON-LD|blocked answer-engine|missing and duplicate|malformed sitemap|missing same-page|duplicate page titles"
```

Expected: all eight focused tests pass.

- [ ] **Step 8: Commit the deterministic audit foundation**

```bash
git add .gitignore package.json package-lock.json monitoring/site-policy.mjs monitoring/audit-core.mjs tests/fixtures/monitoring-site.mjs tests/site-audit-core.test.mjs
git commit -m "feat: add deterministic SEO and GEO audit rules"
```

### Task 2: Add live fetching and actionable reports

**Files:**
- Create: `monitoring/audit-live.mjs`
- Create: `monitoring/report.mjs`
- Create: `scripts/site-audit.mjs`
- Create: `tests/site-audit-live.test.mjs`

**Interfaces:**
- Consumes: all Task 1 audit functions and `buildSitePolicy`.
- Produces: `fetchWithRetry(url, options) -> ResponseLike`
- Produces: `auditLiveSite({ policy, fetchFn, retries, timeoutMs }) -> AuditReport`
- Produces: `summarizeChecks(checks) -> { status, pass, warn, fail }`
- Produces: `renderSiteAuditMarkdown(report) -> string`
- Produces: CLI flags `--base-url`, `--canonical-base-url`, `--json`, and `--markdown`.

- [ ] **Step 1: Write failing live-runner tests**

Create `tests/site-audit-live.test.mjs`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { auditLiveSite, fetchWithRetry } from "../monitoring/audit-live.mjs";
import { renderSiteAuditMarkdown } from "../monitoring/report.mjs";
import { buildSitePolicy } from "../monitoring/site-policy.mjs";
import {
  validArticleHtml,
  validHomepageHtml,
  validRobots,
  validSitemap,
} from "./fixtures/monitoring-site.mjs";

const ok = (url, body, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  url,
  headers: new Headers({ "content-type": body.startsWith("<!doctype html") ? "text/html" : "text/plain" }),
  text: async () => body,
});

const makeFetch = (routes) => async (url) => {
  const route = routes.get(String(url));
  if (!route) return ok(String(url), "missing", 404);
  if (route instanceof Error) throw route;
  return ok(String(url), route.body, route.status ?? 200);
};

const policy = buildSitePolicy();
const figureRoutes = new Map(
  Array.from({ length: 10 }, (_, index) => [
    `https://pouya-parsa.github.io/images/cloud-drive/figure-${String(index + 1).padStart(2, "0")}.svg`,
    { body: "<svg></svg>" },
  ])
);
const routes = new Map([
  [policy.pages[0].fetchUrl, { body: validHomepageHtml }],
  [policy.pages[1].fetchUrl, { body: validArticleHtml }],
  [policy.robotsUrl, { body: validRobots }],
  [policy.sitemapUrl, { body: validSitemap }],
  ["https://pouya-parsa.github.io/profile_image.png", { body: "png" }],
  ...figureRoutes,
]);

test("live audit passes a complete site and reports every fetch", async () => {
  const report = await auditLiveSite({
    policy,
    fetchFn: makeFetch(routes),
    retries: 0,
    timeoutMs: 100,
  });
  assert.equal(report.summary.status, "pass");
  assert.equal(report.summary.fail, 0);
  assert.ok(report.pages.every((page) => page.status === 200));
  assert.ok(report.checks.some((check) => check.id === "resource.http"));
  assert.ok(report.externalUrls.includes("https://arxiv.org/pdf/2607.09045"));
});

test("broken internal resource fails but external link is not fetched", async () => {
  const brokenRoutes = new Map(routes);
  brokenRoutes.set("https://pouya-parsa.github.io/profile_image.png", {
    body: "missing",
    status: 404,
  });
  const report = await auditLiveSite({
    policy,
    fetchFn: makeFetch(brokenRoutes),
    retries: 0,
    timeoutMs: 100,
  });
  assert.equal(report.summary.status, "fail");
  assert.ok(report.checks.some(
    (check) =>
      check.id === "resource.http" &&
      check.status === "fail" &&
      check.url.endsWith("/profile_image.png")
  ));
});

test("fetchWithRetry retries a transient exception", async () => {
  let attempts = 0;
  const response = await fetchWithRetry("https://example.test/", {
    fetchFn: async (url) => {
      attempts += 1;
      if (attempts === 1) throw new Error("temporary network error");
      return ok(url, "ready");
    },
    retries: 1,
    timeoutMs: 100,
  });
  assert.equal(response.status, 200);
  assert.equal(attempts, 2);
});

test("Markdown puts failures before passing checks", async () => {
  const brokenRoutes = new Map(routes);
  brokenRoutes.set(policy.pages[0].fetchUrl, {
    body: validHomepageHtml.replace(/<link rel="canonical"[^>]+>/, ""),
  });
  const report = await auditLiveSite({
    policy,
    fetchFn: makeFetch(brokenRoutes),
    retries: 0,
    timeoutMs: 100,
  });
  const markdown = renderSiteAuditMarkdown(report);
  assert.match(markdown, /Overall: FAIL/);
  assert.ok(markdown.indexOf("meta.canonical") < markdown.indexOf("meta.title"));
});
```

- [ ] **Step 2: Run live-runner tests to verify RED**

Run:

```bash
node --test tests/site-audit-live.test.mjs
```

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for
`monitoring/audit-live.mjs`.

- [ ] **Step 3: Implement retrying fetch and site orchestration**

Create `monitoring/audit-live.mjs` with:

```js
import {
  auditCrossPageMetadata,
  auditHtmlPage,
  auditRobots,
  auditSitemap,
} from "./audit-core.mjs";
import { summarizeChecks } from "./report.mjs";

export async function fetchWithRetry(
  url,
  { fetchFn = globalThis.fetch, retries = 2, timeoutMs = 10_000 } = {}
) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchFn(url, {
        redirect: "follow",
        signal: controller.signal,
        headers: { "user-agent": "PouyaParsa-SiteMonitor/1.0" },
      });
      if (response.status >= 500 && attempt < retries) continue;
      return response;
    } catch (error) {
      lastError = error;
      if (attempt === retries) break;
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error(`Failed to fetch ${url}: ${lastError?.message ?? "unknown error"}`);
}
```

Implement `auditLiveSite` in this order:

1. Fetch both policy pages, robots, and sitemap with `Promise.allSettled`.
2. Convert every rejected or non-2xx required fetch into a `http.required`
   failure containing the URL and observed status/error.
3. For successful HTML responses, fail `http.final-origin` if
   `new URL(response.url).origin` differs from the configured fetch origin.
4. Run `auditHtmlPage`, `auditRobots`, `auditSitemap`, and
   `auditCrossPageMetadata`.
5. Deduplicate every discovered same-origin internal URL and every external
   URL. Keep the external URLs in the report without fetching them.
6. Fetch internal URLs and add one `resource.http` check per URL. A 2xx status
   passes; exceptions and non-2xx statuses fail.
7. Return:

```js
{
  generatedAt: new Date().toISOString(),
  monitorVersion: 1,
  fetchBaseUrl: policy.fetchBaseUrl,
  canonicalBaseUrl: policy.canonicalBaseUrl,
  pages: [{ fetchUrl, canonicalUrl, status, finalUrl }],
  externalUrls: ["https://arxiv.org/pdf/2607.09045"],
  checks,
  summary: summarizeChecks(checks),
}
```

Wrap top-level orchestration so an unexpected exception is converted to a
`monitor.internal` failure and still returns a report.

- [ ] **Step 4: Implement JSON/Markdown reporting**

Create `monitoring/report.mjs`:

```js
export function summarizeChecks(checks) {
  const counts = { pass: 0, warn: 0, fail: 0 };
  for (const item of checks) counts[item.status] += 1;
  return {
    status: counts.fail > 0 ? "fail" : "pass",
    ...counts,
  };
}

const escapeCell = (value) =>
  String(value ?? "").replaceAll("|", "\\|").replaceAll("\n", " ");

export function renderSiteAuditMarkdown(report) {
  const ordered = [...report.checks].sort((left, right) => {
    const rank = { fail: 0, warn: 1, pass: 2 };
    return rank[left.status] - rank[right.status] ||
      left.id.localeCompare(right.id);
  });
  const lines = [
    "## Live-site audit",
    "",
    `**Overall: ${report.summary.status.toUpperCase()}** — ` +
      `${report.summary.pass} passed, ${report.summary.warn} warnings, ` +
      `${report.summary.fail} failed.`,
    "",
    "| Status | Check | URL | Detail |",
    "| --- | --- | --- | --- |",
  ];
  for (const item of ordered) {
    lines.push(
      `| ${item.status.toUpperCase()} | ${escapeCell(item.id)} | ` +
      `${escapeCell(item.url)} | ${escapeCell(item.message)} |`
    );
  }
  if (report.externalUrls.length > 0) {
    lines.push("", "### External links (reported, not fetched)", "");
    for (const url of report.externalUrls) lines.push(`- ${url}`);
  }
  return `${lines.join("\n")}\n`;
}
```

- [ ] **Step 5: Add the site-audit CLI**

Create `scripts/site-audit.mjs` using `node:util.parseArgs`. Defaults:

```js
const defaults = {
  fetchBaseUrl: process.env.SITE_BASE_URL ?? "https://pouya-parsa.github.io/",
  canonicalBaseUrl:
    process.env.SITE_CANONICAL_BASE_URL ?? "https://pouya-parsa.github.io/",
  json: ".monitoring/site-audit.json",
  markdown: ".monitoring/site-audit.md",
};
```

Accept options:

```js
const { values } = parseArgs({
  options: {
    "base-url": { type: "string", default: defaults.fetchBaseUrl },
    "canonical-base-url": {
      type: "string",
      default: defaults.canonicalBaseUrl,
    },
    json: { type: "string", default: defaults.json },
    markdown: { type: "string", default: defaults.markdown },
  },
});
```

Build the policy, run `auditLiveSite`, create both output directories with
`mkdir({ recursive: true })`, write pretty JSON plus Markdown, print the
Markdown, and set `process.exitCode = 1` only when
`report.summary.status === "fail"`.

- [ ] **Step 6: Run focused and complete suites to verify GREEN**

Run:

```bash
node --test tests/site-audit-live.test.mjs
npm test
node --check scripts/site-audit.mjs
git diff --check
```

Expected: all live-runner tests and all repository tests pass; the CLI parses;
the diff check is silent.

- [ ] **Step 7: Commit live audit and reports**

```bash
git add monitoring/audit-live.mjs monitoring/report.mjs scripts/site-audit.mjs tests/site-audit-live.test.mjs
git commit -m "feat: add live site audit and reports"
```

### Task 3: Complete homepage discovery metadata

**Files:**
- Modify: `tests/site-content.test.js`
- Modify: `index.html:4-9`

**Interfaces:**
- Consumes: the Task 1 homepage policy.
- Produces: a homepage canonical URL, social preview metadata, and the stable
  `https://pouya-parsa.github.io/#pouya-parsa` `Person` entity used by the
  article.

- [ ] **Step 1: Write the failing homepage metadata test**

Append to `tests/site-content.test.js`:

```js
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
    /property="og:image" content="https:\/\/pouya-parsa\.github\.io\/profile_image\.png"/
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
```

- [ ] **Step 2: Run the focused test to verify RED**

Run:

```bash
node --test --test-name-pattern="homepage exposes canonical social and Person discovery metadata" tests/site-content.test.js
```

Expected: FAIL because the homepage has no canonical link.

- [ ] **Step 3: Add accurate non-visual homepage metadata**

Immediately after the existing description in `index.html`, add:

```html
    <link rel="canonical" href="https://pouya-parsa.github.io/">

    <meta property="og:type" content="profile">
    <meta property="og:url" content="https://pouya-parsa.github.io/">
    <meta property="og:title" content="Pouya Parsa">
    <meta property="og:description" content="Machine learning researcher focused on large language models, LLM memory, long-context AI systems, and vision-language models.">
    <meta property="og:image" content="https://pouya-parsa.github.io/profile_image.png">
    <meta property="og:image:alt" content="Portrait of Pouya Parsa">

    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="Pouya Parsa">
    <meta name="twitter:description" content="Machine learning researcher focused on LLM memory, long-context AI systems, and vision-language models.">
    <meta name="twitter:image" content="https://pouya-parsa.github.io/profile_image.png">
    <meta name="twitter:image:alt" content="Portrait of Pouya Parsa">

    <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "Person",
        "@id": "https://pouya-parsa.github.io/#pouya-parsa",
        "name": "Pouya Parsa",
        "url": "https://pouya-parsa.github.io/",
        "image": "https://pouya-parsa.github.io/profile_image.png",
        "jobTitle": "Machine Learning Researcher",
        "affiliation": {
          "@type": "CollegeOrUniversity",
          "name": "University of Minnesota Twin Cities"
        },
        "sameAs": "https://github.com/pouya-parsa",
        "knowsAbout": [
          "Large language models",
          "LLM memory",
          "Long-context AI systems",
          "Computer vision",
          "Vision-language models"
        ]
      }
    </script>
```

Keep the stylesheet link after this metadata. Do not change visible homepage
content or CSS.

- [ ] **Step 4: Verify the metadata and all content tests**

Run:

```bash
node --test --test-name-pattern="homepage exposes canonical social and Person discovery metadata" tests/site-content.test.js
node --test tests/site-content.test.js
node -e 'const fs=require("node:fs"); const html=fs.readFileSync("index.html","utf8"); const block=html.match(/<script type="application\\/ld\\+json">([\\s\\S]*?)<\\/script>/); JSON.parse(block[1]); console.log("homepage JSON-LD PASS")'
```

Expected: both test commands pass and the final command prints
`homepage JSON-LD PASS`.

- [ ] **Step 5: Commit homepage discovery metadata**

```bash
git add index.html tests/site-content.test.js
git commit -m "seo: add homepage discovery metadata"
```

### Task 4: Add Lighthouse collection, assertions, and summaries

**Files:**
- Create: `lighthouserc.cjs`
- Create: `monitoring/lighthouse-report.mjs`
- Create: `scripts/lighthouse-summary.mjs`
- Create: `tests/lighthouse-report.test.mjs`

**Interfaces:**
- Produces: `loadLighthouseReports(inputDirectory) -> Lhr[]`
- Produces: `aggregateLighthouseReports(reports) -> LighthousePageSummary[]`
- Produces: `renderLighthouseMarkdown(summary) -> string`
- Produces: CLI flags `--input` and `--output`.

- [ ] **Step 1: Write failing Lighthouse aggregation tests**

Create `tests/lighthouse-report.test.mjs`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import {
  aggregateLighthouseReports,
  renderLighthouseMarkdown,
} from "../monitoring/lighthouse-report.mjs";

const lhr = (url, performance, lcp, cls, tbt) => ({
  finalDisplayedUrl: url,
  categories: {
    performance: { score: performance },
    accessibility: { score: 0.96 },
    "best-practices": { score: 0.94 },
    seo: { score: 1 },
  },
  audits: {
    "largest-contentful-paint": { numericValue: lcp },
    "cumulative-layout-shift": { numericValue: cls },
    "total-blocking-time": { numericValue: tbt },
  },
});

test("Lighthouse aggregation uses the median of three runs per URL", () => {
  const reports = [
    lhr("https://example.test/", 0.92, 1900, 0.02, 80),
    lhr("https://example.test/", 0.84, 2800, 0.08, 250),
    lhr("https://example.test/", 0.88, 2300, 0.04, 140),
  ];
  const [summary] = aggregateLighthouseReports(reports);
  assert.equal(summary.performance, 88);
  assert.equal(summary.lcpMs, 2300);
  assert.equal(summary.cls, 0.04);
  assert.equal(summary.tbtMs, 140);
  assert.equal(summary.status, "pass");
});

test("Lighthouse summary marks threshold violations as failures", () => {
  const reports = [
    lhr("https://example.test/", 0.79, 3100, 0.11, 301),
    lhr("https://example.test/", 0.78, 3200, 0.12, 340),
    lhr("https://example.test/", 0.77, 3300, 0.13, 380),
  ];
  const summary = aggregateLighthouseReports(reports);
  assert.equal(summary[0].status, "fail");
  assert.deepEqual(
    summary[0].failures,
    ["performance", "lcp", "cls", "tbt"]
  );
  assert.match(renderLighthouseMarkdown(summary), /Overall: FAIL/);
});
```

- [ ] **Step 2: Run aggregation tests to verify RED**

Run:

```bash
node --test tests/lighthouse-report.test.mjs
```

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for
`monitoring/lighthouse-report.mjs`.

- [ ] **Step 3: Implement Lighthouse report aggregation**

Create `monitoring/lighthouse-report.mjs` with:

```js
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

export const LIGHTHOUSE_THRESHOLDS = {
  performance: 80,
  accessibility: 90,
  bestPractices: 90,
  seo: 95,
  lcpMs: 3000,
  cls: 0.1,
  tbtMs: 300,
};

const median = (values) => {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.floor(sorted.length / 2)];
};

export async function loadLighthouseReports(inputDirectory) {
  const names = await readdir(inputDirectory);
  const jsonNames = names.filter((name) => name.endsWith(".report.json"));
  return Promise.all(
    jsonNames.map(async (name) =>
      JSON.parse(await readFile(path.join(inputDirectory, name), "utf8"))
    )
  );
}

export function aggregateLighthouseReports(reports) {
  const grouped = Map.groupBy(reports, (report) => report.finalDisplayedUrl);
  return [...grouped.entries()].map(([url, runs]) => {
    const value = (getter) => median(runs.map(getter));
    const page = {
      url,
      runs: runs.length,
      performance: Math.round(value((run) => run.categories.performance.score) * 100),
      accessibility: Math.round(value((run) => run.categories.accessibility.score) * 100),
      bestPractices: Math.round(value((run) => run.categories["best-practices"].score) * 100),
      seo: Math.round(value((run) => run.categories.seo.score) * 100),
      lcpMs: Math.round(value((run) => run.audits["largest-contentful-paint"].numericValue)),
      cls: Number(value((run) => run.audits["cumulative-layout-shift"].numericValue).toFixed(3)),
      tbtMs: Math.round(value((run) => run.audits["total-blocking-time"].numericValue)),
    };
    page.failures = [
      page.performance < LIGHTHOUSE_THRESHOLDS.performance && "performance",
      page.accessibility < LIGHTHOUSE_THRESHOLDS.accessibility && "accessibility",
      page.bestPractices < LIGHTHOUSE_THRESHOLDS.bestPractices && "best-practices",
      page.seo < LIGHTHOUSE_THRESHOLDS.seo && "seo",
      page.lcpMs > LIGHTHOUSE_THRESHOLDS.lcpMs && "lcp",
      page.cls > LIGHTHOUSE_THRESHOLDS.cls && "cls",
      page.tbtMs > LIGHTHOUSE_THRESHOLDS.tbtMs && "tbt",
    ].filter(Boolean);
    page.status = page.failures.length === 0 ? "pass" : "fail";
    return page;
  }).sort((left, right) => left.url.localeCompare(right.url));
}
```

Implement `renderLighthouseMarkdown` with the complete table and failure
details:

```js
export function renderLighthouseMarkdown(pages) {
  const failed = pages.filter((page) => page.status === "fail");
  const overall = pages.length > 0 && failed.length === 0 ? "PASS" : "FAIL";
  const lines = [
    "## Lighthouse mobile audit",
    "",
    `**Overall: ${overall}**`,
    "",
    "| Status | URL | Runs | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |",
    "| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
  ];
  for (const page of pages) {
    lines.push(
      `| ${page.status.toUpperCase()} | ${page.url} | ${page.runs} | ` +
      `${page.performance} | ${page.accessibility} | ${page.bestPractices} | ` +
      `${page.seo} | ${page.lcpMs} ms | ${page.cls} | ${page.tbtMs} ms |`
    );
  }
  if (failed.length > 0) {
    lines.push("", "### Failed thresholds", "");
    for (const page of failed) {
      lines.push(`- ${page.url}: ${page.failures.join(", ")}`);
    }
  }
  return `${lines.join("\n")}\n`;
}
```

- [ ] **Step 4: Add exact Lighthouse CI policy**

Create `lighthouserc.cjs`:

```js
const baseUrl = new URL(
  "/",
  process.env.LHCI_BASE_URL || "https://pouya-parsa.github.io/"
);
const metric = (maxNumericValue) => [
  "error",
  { maxNumericValue, aggregationMethod: "median" },
];
const category = (minScore) => [
  "error",
  { minScore, aggregationMethod: "median" },
];

module.exports = {
  ci: {
    collect: {
      url: [
        new URL("/", baseUrl).href,
        new URL("/cloud-drive/", baseUrl).href,
      ],
      numberOfRuns: 3,
      settings: {
        chromeFlags: "--headless --no-sandbox",
        onlyCategories: [
          "performance",
          "accessibility",
          "best-practices",
          "seo",
        ],
      },
    },
    assert: {
      assertions: {
        "categories:performance": category(0.8),
        "categories:accessibility": category(0.9),
        "categories:best-practices": category(0.9),
        "categories:seo": category(0.95),
        "largest-contentful-paint": metric(3000),
        "cumulative-layout-shift": metric(0.1),
        "total-blocking-time": metric(300),
      },
    },
    upload: {
      target: "filesystem",
      outputDir: ".monitoring/lighthouse",
    },
  },
};
```

- [ ] **Step 5: Add the Lighthouse-summary CLI**

Create `scripts/lighthouse-summary.mjs` using `parseArgs` with:

```js
const { values } = parseArgs({
  options: {
    input: { type: "string", default: ".monitoring/lighthouse" },
    output: {
      type: "string",
      default: ".monitoring/lighthouse-summary.md",
    },
  },
});
```

Load reports, derive the two expected URLs from
`process.env.LHCI_BASE_URL ?? "https://pouya-parsa.github.io/"`, and require
exactly three reports for each URL. Aggregate, write Markdown, print it, and
set a failing exit code when a page fails. Use this error branch so a
missing/unreadable directory still produces a report:

```js
try {
  const reports = await loadLighthouseReports(values.input);
  const base = new URL(
    "/",
    process.env.LHCI_BASE_URL ?? "https://pouya-parsa.github.io/"
  );
  const expectedUrls = [
    new URL("/", base).href,
    new URL("/cloud-drive/", base).href,
  ];
  for (const url of expectedUrls) {
    const count = reports.filter((report) => report.finalDisplayedUrl === url).length;
    if (count !== 3) {
      throw new Error(`Expected 3 Lighthouse reports for ${url}; found ${count}`);
    }
  }
  const pages = aggregateLighthouseReports(reports);
  const markdown = renderLighthouseMarkdown(pages);
  await mkdir(path.dirname(values.output), { recursive: true });
  await writeFile(values.output, markdown);
  process.stdout.write(markdown);
  if (pages.some((page) => page.status === "fail")) process.exitCode = 1;
} catch (error) {
  const markdown =
    `## Lighthouse mobile audit\n\n**Overall: FAIL** — ${error.message}\n`;
  await mkdir(path.dirname(values.output), { recursive: true });
  await writeFile(values.output, markdown);
  process.stdout.write(markdown);
  process.exitCode = 1;
}
```

Import `mkdir` and `writeFile` from `node:fs/promises`, `path` from
`node:path`, and the three report functions from
`monitoring/lighthouse-report.mjs`.

- [ ] **Step 6: Verify Lighthouse configuration and aggregation**

Run:

```bash
node --test tests/lighthouse-report.test.mjs
node --check scripts/lighthouse-summary.mjs
npx lhci healthcheck --config=lighthouserc.cjs
npm test
git diff --check
```

Expected: aggregation tests pass, scripts parse, Lighthouse healthcheck
reports a usable Chrome installation, all tests pass, and the diff check is
silent. If the local machine lacks Chrome, record that local healthcheck as
an environment limitation and require it to pass on `ubuntu-latest` in Task
6.

- [ ] **Step 7: Commit Lighthouse monitoring**

```bash
git add lighthouserc.cjs monitoring/lighthouse-report.mjs scripts/lighthouse-summary.mjs tests/lighthouse-report.test.mjs
git commit -m "feat: add Lighthouse performance monitoring"
```

### Task 5: Add the daily read-only GitHub Actions workflow

**Files:**
- Create: `.github/workflows/daily-site-monitor.yml`
- Create: `docs/monitoring.md`
- Create: `tests/monitoring-config.test.mjs`

**Interfaces:**
- Consumes: `npm test`, all `monitor:*` scripts, and `.monitoring/**`.
- Produces: daily/manual workflow, GitHub job summary, 90-day artifact, and
  final workflow status.

- [ ] **Step 1: Write failing workflow-policy tests**

Create `tests/monitoring-config.test.mjs`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

test("Lighthouse config monitors both pages with approved thresholds", () => {
  const config = require("../lighthouserc.cjs");
  const { collect, assert: assertion } = config.ci;
  assert.equal(collect.numberOfRuns, 3);
  assert.deepEqual(collect.url, [
    "https://pouya-parsa.github.io/",
    "https://pouya-parsa.github.io/cloud-drive/",
  ]);
  assert.deepEqual(
    assertion.assertions["categories:seo"],
    ["error", { minScore: 0.95, aggregationMethod: "median" }]
  );
  assert.deepEqual(
    assertion.assertions["largest-contentful-paint"],
    ["error", { maxNumericValue: 3000, aggregationMethod: "median" }]
  );
});

test("daily workflow is manual, scheduled, read-only, and retains reports", () => {
  const yaml = fs.readFileSync(
    new URL("../.github/workflows/daily-site-monitor.yml", import.meta.url),
    "utf8"
  );
  assert.match(yaml, /schedule:/);
  assert.match(yaml, /cron: ["']17 12 \* \* \*["']/);
  assert.match(yaml, /workflow_dispatch:/);
  assert.match(yaml, /permissions:\s*\n\s+contents: read/);
  assert.doesNotMatch(yaml, /issues: write|contents: write|secrets\./);
  assert.match(yaml, /retention-days: 90/);
  assert.match(yaml, /if: always\(\)/);
  assert.match(yaml, /GITHUB_STEP_SUMMARY/);
});
```

- [ ] **Step 2: Run configuration tests to verify RED**

Run:

```bash
node --test tests/monitoring-config.test.mjs
```

Expected: the Lighthouse test passes and the workflow test fails with
`ENOENT`.

- [ ] **Step 3: Create the daily workflow**

Create `.github/workflows/daily-site-monitor.yml`:

```yaml
name: Daily SEO and GEO monitor

on:
  schedule:
    - cron: "17 12 * * *"
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: daily-site-monitor
  cancel-in-progress: true

jobs:
  monitor:
    runs-on: ubuntu-latest
    timeout-minutes: 25
    env:
      SITE_BASE_URL: https://pouya-parsa.github.io/
      SITE_CANONICAL_BASE_URL: https://pouya-parsa.github.io/
      LHCI_BASE_URL: https://pouya-parsa.github.io/

    steps:
      - name: Check out repository
        uses: actions/checkout@v6

      - name: Set up Node.js
        uses: actions/setup-node@v6
        with:
          node-version: "22"
          cache: npm

      - name: Install monitoring dependencies
        run: npm ci

      - name: Run repository tests
        id: tests
        continue-on-error: true
        run: npm test

      - name: Audit live site
        id: site_audit
        continue-on-error: true
        run: npm run monitor:site

      - name: Collect Lighthouse runs
        id: lighthouse_collect
        if: always()
        continue-on-error: true
        run: npm run monitor:lighthouse:collect

      - name: Save Lighthouse reports
        id: lighthouse_upload
        if: always()
        continue-on-error: true
        run: npm run monitor:lighthouse:upload

      - name: Assert Lighthouse thresholds
        id: lighthouse_assert
        if: always()
        continue-on-error: true
        run: npm run monitor:lighthouse:assert

      - name: Summarize Lighthouse results
        id: lighthouse_summary
        if: always()
        continue-on-error: true
        run: npm run monitor:lighthouse:summary

      - name: Publish monitoring summary
        if: always()
        shell: bash
        run: |
          echo "# Daily SEO and GEO monitor" >> "$GITHUB_STEP_SUMMARY"
          echo "" >> "$GITHUB_STEP_SUMMARY"
          if [[ -f .monitoring/site-audit.md ]]; then
            cat .monitoring/site-audit.md >> "$GITHUB_STEP_SUMMARY"
          else
            echo "## Live-site audit" >> "$GITHUB_STEP_SUMMARY"
            echo "" >> "$GITHUB_STEP_SUMMARY"
            echo "**Overall: FAIL** — no live-site report was produced." >> "$GITHUB_STEP_SUMMARY"
          fi
          echo "" >> "$GITHUB_STEP_SUMMARY"
          if [[ -f .monitoring/lighthouse-summary.md ]]; then
            cat .monitoring/lighthouse-summary.md >> "$GITHUB_STEP_SUMMARY"
          else
            echo "## Lighthouse mobile audit" >> "$GITHUB_STEP_SUMMARY"
            echo "" >> "$GITHUB_STEP_SUMMARY"
            echo "**Overall: FAIL** — no Lighthouse summary was produced." >> "$GITHUB_STEP_SUMMARY"
          fi

      - name: Upload monitoring artifacts
        if: always()
        uses: actions/upload-artifact@v7
        with:
          name: site-monitor-${{ github.run_id }}
          path: |
            .monitoring/
            .lighthouseci/
          include-hidden-files: true
          if-no-files-found: error
          retention-days: 90

      - name: Apply final monitoring gate
        if: always()
        shell: bash
        env:
          TESTS: ${{ steps.tests.outcome }}
          SITE_AUDIT: ${{ steps.site_audit.outcome }}
          LIGHTHOUSE_COLLECT: ${{ steps.lighthouse_collect.outcome }}
          LIGHTHOUSE_UPLOAD: ${{ steps.lighthouse_upload.outcome }}
          LIGHTHOUSE_ASSERT: ${{ steps.lighthouse_assert.outcome }}
          LIGHTHOUSE_SUMMARY: ${{ steps.lighthouse_summary.outcome }}
        run: |
          failed=0
          for outcome in \
            "$TESTS" \
            "$SITE_AUDIT" \
            "$LIGHTHOUSE_COLLECT" \
            "$LIGHTHOUSE_UPLOAD" \
            "$LIGHTHOUSE_ASSERT" \
            "$LIGHTHOUSE_SUMMARY"
          do
            if [[ "$outcome" != "success" ]]; then
              failed=1
            fi
          done
          if [[ "$failed" -ne 0 ]]; then
            echo "One or more required monitoring stages failed."
            exit 1
          fi
```

- [ ] **Step 4: Document operation and interpretation**

Create `docs/monitoring.md` with these concrete sections:

```md
# Daily site monitoring

The **Daily SEO and GEO monitor** workflow checks the deployed homepage and
Cloud Drive article every day at 12:17 UTC. It can also be started from
GitHub's **Actions → Daily SEO and GEO monitor → Run workflow** menu.

## What is measured

- HTTP availability, redirects, internal resources, and page fragments
- robots.txt and sitemap discovery
- Googlebot, OAI-SearchBot, and PerplexityBot access
- canonical, title, description, h1, image alt, social, and JSON-LD metadata
- stable Person and ScholarlyArticle attribution
- mobile Lighthouse SEO, accessibility, best-practices, performance, LCP,
  CLS, and TBT

## Failure thresholds

| Metric | Required |
| --- | ---: |
| Broken required/internal URLs | 0 |
| Metadata or structured-data errors | 0 |
| SEO | >= 95 |
| Accessibility | >= 90 |
| Best Practices | >= 90 |
| Performance | >= 80 |
| LCP | <= 3,000 ms |
| CLS | <= 0.10 |
| TBT | <= 300 ms |

Open a workflow run to see failures first in its job summary. Download the
the artifact named for that workflow run for the full JSON, Markdown, HTML, and
Lighthouse reports. Artifacts are retained for 90 days. GitHub sends failed
workflow notifications according to each account's Actions notification
settings.

## Run locally

```bash
npm ci
npm test
npm run monitor:site
npm run monitor:lighthouse:collect
npm run monitor:lighthouse:upload
npm run monitor:lighthouse:assert
npm run monitor:lighthouse:summary
```

For a local HTTP server, set `SITE_BASE_URL` and `LHCI_BASE_URL` to its URL
while keeping `SITE_CANONICAL_BASE_URL=https://pouya-parsa.github.io/`.

## Interpretation limits

The GEO checks verify crawlability, attribution, primary-source links,
semantic structure, and machine-readable entities. They do not measure
whether an answer engine cited a page. Search impressions, clicks, real-user
INP, AI citations, and referral traffic require a later credentialed data
source such as Search Console or privacy-conscious analytics.
```

- [ ] **Step 5: Verify workflow policy and all tests**

Run:

```bash
node --test tests/monitoring-config.test.mjs
npm test
git diff --check
git status --short
```

Expected: all tests pass; the diff check is silent; status lists only the
workflow, monitoring guide, configuration test, and the pre-existing
untracked `main.tex`.

- [ ] **Step 6: Commit workflow and operator guide**

```bash
git add .github/workflows/daily-site-monitor.yml docs/monitoring.md tests/monitoring-config.test.mjs
git commit -m "ci: add daily SEO and GEO monitor"
```

### Task 6: Verify locally and activate production monitoring

**Files:**
- Verify: all files created or modified in Tasks 1–5
- Preserve: `main.tex`

**Interfaces:**
- Consumes: completed monitor commits and GitHub Pages deployment.
- Produces: local evidence, deployed metadata, one passing manual monitoring
  run, and the active daily schedule.

- [ ] **Step 1: Run the complete static and monitor unit suite**

Run:

```bash
npm ci
npm test
node --check scripts/site-audit.mjs
node --check scripts/lighthouse-summary.mjs
node --check monitoring/audit-core.mjs
node --check monitoring/audit-live.mjs
node --check monitoring/report.mjs
node --check monitoring/lighthouse-report.mjs
git diff --check
```

Expected: every test passes, every module parses, and the diff check is
silent.

- [ ] **Step 2: Verify the complete site against a local server**

Start a task-owned server:

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

In a second shell run:

```bash
SITE_BASE_URL=http://127.0.0.1:8000/ \
SITE_CANONICAL_BASE_URL=https://pouya-parsa.github.io/ \
npm run monitor:site
```

Expected: `Overall: PASS`; both pages, robots, sitemap, internal links,
figures, scripts, stylesheets, and documents pass. Stop the task-owned server
afterward.

- [ ] **Step 3: Run local Lighthouse collection and assertions**

With the same local server running:

```bash
LHCI_BASE_URL=http://127.0.0.1:8000/ npm run monitor:lighthouse:collect
LHCI_BASE_URL=http://127.0.0.1:8000/ npm run monitor:lighthouse:upload
LHCI_BASE_URL=http://127.0.0.1:8000/ npm run monitor:lighthouse:assert
npm run monitor:lighthouse:summary
```

Expected: six reports are produced, both URLs appear in the Markdown table,
and all approved thresholds pass. Stop the local server.

- [ ] **Step 4: Inspect scope and history before publishing**

Run:

```bash
git status --short --branch
git log --oneline --decorate -8
git diff origin/main...HEAD --stat
```

Expected: the branch contains the design, plan, and implementation commits;
there are no unstaged implementation changes; `main.tex` remains untracked
and absent from every commit.

- [ ] **Step 5: Push the completed main branch**

Run:

```bash
git push origin main
```

Expected: `origin/main` advances to the completed monitoring commit and the
GitHub Pages deployment begins.

- [ ] **Step 6: Confirm the metadata deployment before the first audit**

Poll the live homepage with bounded retries:

```bash
deployed=0
for attempt in {1..20}
do
  if curl --fail --silent https://pouya-parsa.github.io/ |
    rg --quiet 'rel="canonical" href="https://pouya-parsa.github.io/"'
  then
    deployed=1
    break
  fi
  sleep 15
done
if [[ "$deployed" -ne 1 ]]
then
  echo "Homepage metadata did not deploy within five minutes."
  exit 1
fi
```

Then verify:

```bash
curl --fail --silent https://pouya-parsa.github.io/ | rg 'rel="canonical" href="https://pouya-parsa.github.io/"'
curl --fail --silent https://pouya-parsa.github.io/cloud-drive/ | rg 'citation_arxiv_id" content="2607.09045"'
curl --fail --silent https://pouya-parsa.github.io/robots.txt | rg 'Sitemap: https://pouya-parsa.github.io/sitemap.xml'
```

Expected: all three commands print their matching live metadata.

- [ ] **Step 7: Dispatch and watch the first production monitor**

Run:

```bash
gh workflow run daily-site-monitor.yml
gh run list \
  --workflow=daily-site-monitor.yml \
  --limit=1 \
  --json databaseId \
  --jq '.[0].databaseId' > /tmp/daily-site-monitor-run-id
```

Watch and inspect that exact run:

```bash
gh run watch "$(cat /tmp/daily-site-monitor-run-id)" --exit-status
gh run view "$(cat /tmp/daily-site-monitor-run-id)"
```

Expected: the run concludes successfully, its summary contains both
live-site and Lighthouse tables, and the artifact named for that run is
available with 90-day retention.

- [ ] **Step 8: Record final evidence**

Run:

```bash
git status --short --branch
git rev-parse HEAD origin/main
```

Expected: local and remote commit IDs match; the only unrelated working-tree
entry is `?? main.tex`. Report the test count, production workflow run URL,
live audit status, Lighthouse metrics for both pages, and confirmation that
the daily schedule and manual trigger are active.
