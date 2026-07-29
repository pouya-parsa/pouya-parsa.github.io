import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  aggregateLighthouseReports,
  loadLighthouseReports,
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
  assert.deepEqual(summary[0].failures, [
    "performance",
    "lcp",
    "cls",
    "tbt",
  ]);
  assert.match(renderLighthouseMarkdown(summary), /Overall: FAIL/);
});

test("Lighthouse report loader reads only report JSON files", async () => {
  const directory = await mkdtemp(
    path.join(os.tmpdir(), "site-monitor-lighthouse-")
  );

  try {
    const report = lhr("https://example.test/", 0.9, 2200, 0.02, 100);
    await writeFile(
      path.join(directory, "home.report.json"),
      JSON.stringify(report)
    );
    await writeFile(
      path.join(directory, "home.report.html"),
      "<html></html>"
    );
    await writeFile(
      path.join(directory, "manifest.json"),
      JSON.stringify([])
    );

    const reports = await loadLighthouseReports(directory);

    assert.equal(reports.length, 1);
    assert.equal(reports[0].finalDisplayedUrl, "https://example.test/");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
