import test from "node:test";
import assert from "node:assert/strict";
import {
  buildTrafficReport,
  renderTrafficReportMarkdown,
} from "../monitoring/traffic-report.mjs";

const searchMetrics = {
  latestFinalizedDate: "2026-07-26",
  daily: { clicks: 3, impressions: 100, ctr: 0.03, position: 8.4 },
  trailing7: {
    startDate: "2026-07-20",
    endDate: "2026-07-26",
    clicks: 14,
    impressions: 500,
    ctr: 0.028,
    position: 9.1,
  },
  topPages: [
    {
      page: "https://pouya-parsa.github.io/cloud-drive/",
      clicks: 8,
      impressions: 220,
      ctr: 0.03636,
      position: 7.5,
    },
  ],
  topQueries: [
    {
      query: "cloud | vla\nquery",
      clicks: 4,
      impressions: 70,
      ctr: 0.05714,
      position: 6.2,
    },
  ],
};

const audienceDaily = {
  pageViews: 12,
  visits: 8,
  topPaths: [{ path: "/cloud-drive/", pageViews: 7, visits: 5 }],
  topReferrers: [{ host: "chatgpt.com", pageViews: 3, visits: 2 }],
  referrerCategories: [
    { category: "Search engines", pageViews: 4, visits: 3 },
    { category: "AI assistants", pageViews: 3, visits: 2 },
  ],
  countries: [],
  devices: [],
  webVitals: {
    status: "available",
    sampleCount: 100,
    lcpP75Ms: 1350,
    inpP75Ms: 120,
    clsP75: 0.01,
  },
};

const cloudflareMetrics = {
  windows: {
    daily: {
      start: "2026-07-28T00:00:00Z",
      end: "2026-07-29T00:00:00Z",
      label: "2026-07-28",
    },
    trailing7: {
      start: "2026-07-22T00:00:00Z",
      end: "2026-07-29T00:00:00Z",
      label: "2026-07-22 to 2026-07-28",
    },
  },
  audience: {
    daily: audienceDaily,
    trailing7: {
      ...audienceDaily,
      pageViews: 70,
      visits: 40,
    },
  },
  actions: {
    daily: {
      state: "available",
      total: 6,
      events: [
        { event: "copy_citation", pagePath: "/cloud-drive/", count: 2 },
        { event: "paper_pdf", pagePath: "/cloud-drive/", count: 4 },
      ],
    },
    trailing7: {
      state: "available",
      total: 20,
      events: [
        { event: "copy_citation", pagePath: "/cloud-drive/", count: 5 },
        { event: "paper_pdf", pagePath: "/cloud-drive/", count: 15 },
      ],
    },
  },
};

test("combined report exposes a stable public model and readable Markdown", () => {
  const report = buildTrafficReport({
    generatedAt: new Date("2026-07-29T13:00:00Z"),
    searchResult: { status: "fulfilled", value: searchMetrics },
    cloudflareResult: { status: "fulfilled", value: cloudflareMetrics },
  });

  assert.deepEqual(
    {
      generatedAt: report.generatedAt,
      status: report.status,
      search: { status: report.search.status },
      audience: { status: report.audience.status },
      actions: { status: report.actions.status },
      errors: report.errors,
      notes: report.notes,
    },
    {
      generatedAt: "2026-07-29T13:00:00.000Z",
      status: "pass",
      search: { status: "available" },
      audience: { status: "available" },
      actions: { status: "available" },
      errors: [],
      notes: [
        "Search Console dates use America/Los_Angeles and finalized data.",
        "Cloudflare dates use complete UTC days.",
        "Visits and action counts are approximate.",
        "AI assistants means browser referrals, not crawler requests.",
      ],
    }
  );

  const markdown = renderTrafficReportMarkdown(report);
  assert.match(markdown, /## Traffic and search performance/);
  assert.match(markdown, /\*\*Overall: PASS\*\*/);
  assert.match(markdown, /### Google Search/);
  assert.match(markdown, /### Audience/);
  assert.match(markdown, /### High-value actions/);
  assert.match(markdown, /### Data quality/);
  assert.match(markdown, /3\.00%/);
  assert.match(markdown, /\| 8\.4 \|/);
  assert.match(markdown, /cloud \\\| vla query/);
  assert.match(markdown, /AI-assistant browser referrals/);
  assert.ok(
    markdown.indexOf("Paper PDF") < markdown.indexOf("Copy citation"),
    "actions should use the approved order"
  );
});

test("one failed provider does not suppress successful metrics", () => {
  const report = buildTrafficReport({
    generatedAt: new Date("2026-07-29T13:00:00Z"),
    searchResult: {
      status: "rejected",
      reason: new Error(
        "Search Console request failed (403): test-google-token raw response"
      ),
    },
    cloudflareResult: { status: "fulfilled", value: cloudflareMetrics },
  });
  const markdown = renderTrafficReportMarkdown(report);

  assert.equal(report.status, "unavailable");
  assert.equal(report.search.status, "unavailable");
  assert.equal(report.audience.status, "available");
  assert.equal(report.actions.status, "available");
  assert.match(markdown, /\*\*Overall: DATA UNAVAILABLE\*\*/);
  assert.match(markdown, /### Audience/);
  assert.match(markdown, /### High-value actions/);
  assert.match(markdown, /70/);
  assert.doesNotMatch(JSON.stringify(report), /test-google-token|raw response/);
  assert.doesNotMatch(markdown, /test-google-token|raw response/);
});
