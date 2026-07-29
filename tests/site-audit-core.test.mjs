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
const articlePolicy = policy.pages.find(
  (page) => page.path === "/cloud-drive/"
);
const failedIds = (result) =>
  result.checks
    .filter((check) => check.status === "fail")
    .map((check) => check.id);

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

test("invalid JSON-LD fails schema validation", () => {
  const invalidJson = validArticleHtml.replace(
    /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
    '<script type="application/ld+json">{"@type":</script>'
  );

  const result = auditHtmlPage({
    html: invalidJson,
    fetchUrl: articlePolicy.fetchUrl,
    policy: articlePolicy,
  });

  assert.ok(failedIds(result).includes("schema.json"));
});

test("inconsistent paper identifier fails attribution", () => {
  const inconsistent = validArticleHtml.replace(
    "arXiv:2607.09045",
    "arXiv:0000.00000"
  );

  const result = auditHtmlPage({
    html: inconsistent,
    fetchUrl: articlePolicy.fetchUrl,
    policy: articlePolicy,
  });

  assert.ok(failedIds(result).includes("geo.paper-identity"));
});

test("blocked answer-engine crawler fails", () => {
  const checks = auditRobots({
    text: `User-agent: OAI-SearchBot
Disallow: /
User-agent: *
Allow: /`,
    robotsUrl: policy.robotsUrl,
    sitemapUrl: policy.canonicalSitemapUrl,
    pageUrls: policy.pages.map((page) => page.fetchUrl),
    userAgents: policy.userAgents,
  });

  assert.ok(
    checks.some(
      (check) =>
        check.id === "robots.OAI-SearchBot" && check.status === "fail"
    )
  );
});

test("missing and duplicate sitemap entries fail", () => {
  const xml = validSitemap
    .replace(
      "</urlset>",
      "<url><loc>https://pouya-parsa.github.io/</loc></url></urlset>"
    )
    .replace(
      "<url><loc>https://pouya-parsa.github.io/cloud-drive/</loc></url>",
      ""
    );

  const checks = auditSitemap({
    xml,
    requiredCanonicalUrls: policy.pages.map((page) => page.canonicalUrl),
  });

  assert.ok(
    checks.some(
      (check) =>
        check.id === "sitemap.required" && check.status === "fail"
    )
  );
  assert.ok(
    checks.some(
      (check) =>
        check.id === "sitemap.duplicates" && check.status === "fail"
    )
  );
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

test("explicit empty alt on an uninitialized dialog image is allowed", () => {
  const withDialogImage = validArticleHtml.replace(
    "</body>",
    '<dialog><img id="dialog-image" alt=""></dialog></body>'
  );

  const result = auditHtmlPage({
    html: withDialogImage,
    fetchUrl: articlePolicy.fetchUrl,
    policy: articlePolicy,
  });

  assert.equal(failedIds(result).includes("images.alt"), false);
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

  assert.ok(
    checks.some(
      (check) =>
        check.id === "meta.unique-title" && check.status === "fail"
    )
  );
});

test("valid robots and sitemap discovery files pass", () => {
  const robotsChecks = auditRobots({
    text: validRobots,
    robotsUrl: policy.robotsUrl,
    sitemapUrl: policy.canonicalSitemapUrl,
    pageUrls: policy.pages.map((page) => page.fetchUrl),
    userAgents: policy.userAgents,
  });
  const sitemapChecks = auditSitemap({
    xml: validSitemap,
    requiredCanonicalUrls: policy.pages.map((page) => page.canonicalUrl),
  });

  assert.equal(
    [...robotsChecks, ...sitemapChecks].some(
      (check) => check.status === "fail"
    ),
    false
  );
});
