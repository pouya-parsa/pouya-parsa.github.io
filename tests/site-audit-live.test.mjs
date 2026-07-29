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

const response = (url, body, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  url,
  headers: new Headers({
    "content-type": body.startsWith("<!doctype html")
      ? "text/html"
      : "text/plain",
  }),
  text: async () => body,
});

const makeFetch = (routes) => async (url) => {
  const route = routes.get(String(url));
  if (!route) return response(String(url), "missing", 404);
  if (route instanceof Error) throw route;
  return response(
    route.finalUrl ?? String(url),
    route.body,
    route.status ?? 200
  );
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
  assert.equal(
    report.checks.filter((check) => check.id === "resource.http").length,
    11
  );
  assert.ok(
    report.externalUrls.includes("https://arxiv.org/pdf/2607.09045")
  );
});

test("broken internal resource fails without fetching third parties", async () => {
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
  assert.ok(
    report.checks.some(
      (check) =>
        check.id === "resource.http" &&
        check.status === "fail" &&
        check.url.endsWith("/profile_image.png")
    )
  );
  assert.ok(
    report.externalUrls.includes("https://arxiv.org/pdf/2607.09045")
  );
});

test("fetchWithRetry retries a transient exception", async () => {
  let attempts = 0;

  const result = await fetchWithRetry("https://example.test/", {
    fetchFn: async (url) => {
      attempts += 1;
      if (attempts === 1) throw new Error("temporary network error");
      return response(url, "ready");
    },
    retries: 1,
    timeoutMs: 100,
  });

  assert.equal(result.status, 200);
  assert.equal(attempts, 2);
});

test("fetchWithRetry retries a transient server response", async () => {
  let attempts = 0;

  const result = await fetchWithRetry("https://example.test/", {
    fetchFn: async (url) => {
      attempts += 1;
      return response(url, attempts === 1 ? "unavailable" : "ready", attempts === 1 ? 503 : 200);
    },
    retries: 1,
    timeoutMs: 100,
  });

  assert.equal(result.status, 200);
  assert.equal(attempts, 2);
});

test("off-origin required redirect fails", async () => {
  const redirectedRoutes = new Map(routes);
  redirectedRoutes.set(policy.pages[0].fetchUrl, {
    body: validHomepageHtml,
    finalUrl: "https://example.test/",
  });

  const report = await auditLiveSite({
    policy,
    fetchFn: makeFetch(redirectedRoutes),
    retries: 0,
    timeoutMs: 100,
  });

  assert.ok(
    report.checks.some(
      (check) =>
        check.id === "http.final-origin" && check.status === "fail"
    )
  );
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
  assert.ok(
    markdown.indexOf("meta.canonical") < markdown.indexOf("meta.title")
  );
  assert.match(markdown, /External links \(reported, not fetched\)/);
});
