import {
  auditCrossPageMetadata,
  auditHtmlPage,
  auditRobots,
  auditSitemap,
} from "./audit-core.mjs";
import { summarizeChecks } from "./report.mjs";

const makeCheck = (id, passed, message, detail = {}) => ({
  id,
  status: passed ? "pass" : "fail",
  message,
  ...detail,
});

const failureCheck = (id, message, detail = {}) =>
  makeCheck(id, false, message, detail);

const errorMessage = (reason) =>
  reason instanceof Error ? reason.message : String(reason);

const responseOriginMatches = (response, expectedOrigin) => {
  try {
    return new URL(response.url).origin === expectedOrigin;
  } catch {
    return false;
  }
};

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

  throw new Error(
    `Failed to fetch ${url}: ${lastError?.message ?? "unknown error"}`
  );
}

async function runLiveAudit({
  policy,
  fetchFn = globalThis.fetch,
  retries = 2,
  timeoutMs = 10_000,
}) {
  const checks = [];
  const pages = [];
  const pageResults = [];
  const internalUrls = new Set();
  const externalUrls = new Set();
  const expectedOrigin = new URL(policy.fetchBaseUrl).origin;
  const requiredTargets = [
    ...policy.pages.map((page) => ({
      kind: "page",
      url: page.fetchUrl,
      policy: page,
    })),
    { kind: "robots", url: policy.robotsUrl },
    { kind: "sitemap", url: policy.sitemapUrl },
  ];
  const requiredResults = await Promise.allSettled(
    requiredTargets.map((target) =>
      fetchWithRetry(target.url, { fetchFn, retries, timeoutMs })
    )
  );
  let robotsText;
  let sitemapText;

  for (let index = 0; index < requiredTargets.length; index += 1) {
    const target = requiredTargets[index];
    const result = requiredResults[index];

    if (result.status === "rejected") {
      checks.push(
        failureCheck("http.required", "Required URL could not be fetched", {
          url: target.url,
          observed: errorMessage(result.reason),
        })
      );
      if (target.kind === "page") {
        pages.push({
          fetchUrl: target.url,
          canonicalUrl: target.policy.canonicalUrl,
          status: null,
          finalUrl: null,
        });
      }
      continue;
    }

    const response = result.value;
    checks.push(
      makeCheck(
        "http.required",
        response.ok,
        `Required URL returned HTTP ${response.status}`,
        { url: target.url, observed: response.status }
      )
    );
    checks.push(
      makeCheck(
        "http.final-origin",
        responseOriginMatches(response, expectedOrigin),
        "Final response remains on the expected host",
        {
          url: target.url,
          expected: expectedOrigin,
          observed: response.url,
        }
      )
    );

    if (target.kind === "page") {
      pages.push({
        fetchUrl: target.url,
        canonicalUrl: target.policy.canonicalUrl,
        status: response.status,
        finalUrl: response.url,
      });
    }
    if (!response.ok) continue;

    const body = await response.text();
    if (target.kind === "page") {
      const pageResult = auditHtmlPage({
        html: body,
        fetchUrl: target.url,
        policy: target.policy,
      });
      pageResults.push(pageResult);
      checks.push(...pageResult.checks);
      for (const url of pageResult.internalUrls) internalUrls.add(url);
      for (const url of pageResult.externalUrls) externalUrls.add(url);
    } else if (target.kind === "robots") {
      robotsText = body;
    } else if (target.kind === "sitemap") {
      sitemapText = body;
    }
  }

  if (robotsText !== undefined) {
    checks.push(
      ...auditRobots({
        text: robotsText,
        robotsUrl: policy.robotsUrl,
        sitemapUrl: policy.canonicalSitemapUrl,
        pageUrls: policy.pages.map((page) => page.fetchUrl),
        userAgents: policy.userAgents,
      })
    );
  }
  if (sitemapText !== undefined) {
    checks.push(
      ...auditSitemap({
        xml: sitemapText,
        requiredCanonicalUrls: policy.pages.map(
          (page) => page.canonicalUrl
        ),
      })
    );
  }
  if (pageResults.length > 0) {
    checks.push(...auditCrossPageMetadata(pageResults));
  }

  const resourceUrls = [...internalUrls].sort();
  const resourceResults = await Promise.allSettled(
    resourceUrls.map(async (url) => {
      const response = await fetchWithRetry(url, {
        fetchFn,
        retries,
        timeoutMs,
      });
      if (response.body && !response.bodyUsed) {
        await response.body.cancel();
      }
      return response;
    })
  );

  for (let index = 0; index < resourceUrls.length; index += 1) {
    const url = resourceUrls[index];
    const result = resourceResults[index];

    if (result.status === "rejected") {
      checks.push(
        failureCheck("resource.http", "Internal resource could not be fetched", {
          url,
          observed: errorMessage(result.reason),
        })
      );
      continue;
    }

    const response = result.value;
    const healthy =
      response.ok && responseOriginMatches(response, expectedOrigin);
    checks.push(
      makeCheck(
        "resource.http",
        healthy,
        healthy
          ? `Internal resource returned HTTP ${response.status}`
          : `Internal resource failed with HTTP ${response.status} or an off-origin redirect`,
        {
          url,
          expected: expectedOrigin,
          observed: {
            status: response.status,
            finalUrl: response.url,
          },
        }
      )
    );
  }

  return {
    generatedAt: new Date().toISOString(),
    monitorVersion: 1,
    fetchBaseUrl: policy.fetchBaseUrl,
    canonicalBaseUrl: policy.canonicalBaseUrl,
    pages,
    externalUrls: [...externalUrls].sort(),
    checks,
    summary: summarizeChecks(checks),
  };
}

export async function auditLiveSite(options) {
  try {
    return await runLiveAudit(options);
  } catch (error) {
    const checks = [
      failureCheck(
        "monitor.internal",
        "The monitor stopped on an unexpected internal error",
        { observed: errorMessage(error) }
      ),
    ];

    return {
      generatedAt: new Date().toISOString(),
      monitorVersion: 1,
      fetchBaseUrl: options?.policy?.fetchBaseUrl ?? null,
      canonicalBaseUrl: options?.policy?.canonicalBaseUrl ?? null,
      pages: [],
      externalUrls: [],
      checks,
      summary: summarizeChecks(checks),
    };
  }
}
