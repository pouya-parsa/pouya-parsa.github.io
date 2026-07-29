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
  const jsonNames = names
    .filter((name) => name.endsWith(".report.json"))
    .sort();

  return Promise.all(
    jsonNames.map(async (name) =>
      JSON.parse(await readFile(path.join(inputDirectory, name), "utf8"))
    )
  );
}

export function aggregateLighthouseReports(reports) {
  const grouped = new Map();
  for (const report of reports) {
    const runs = grouped.get(report.finalDisplayedUrl) ?? [];
    runs.push(report);
    grouped.set(report.finalDisplayedUrl, runs);
  }

  return [...grouped.entries()]
    .map(([url, runs]) => {
      const value = (getter) => median(runs.map(getter));
      const page = {
        url,
        runs: runs.length,
        performance: Math.round(
          value((run) => run.categories.performance.score) * 100
        ),
        accessibility: Math.round(
          value((run) => run.categories.accessibility.score) * 100
        ),
        bestPractices: Math.round(
          value((run) => run.categories["best-practices"].score) * 100
        ),
        seo: Math.round(value((run) => run.categories.seo.score) * 100),
        lcpMs: Math.round(
          value(
            (run) =>
              run.audits["largest-contentful-paint"].numericValue
          )
        ),
        cls: Number(
          value(
            (run) =>
              run.audits["cumulative-layout-shift"].numericValue
          ).toFixed(3)
        ),
        tbtMs: Math.round(
          value((run) => run.audits["total-blocking-time"].numericValue)
        ),
      };

      page.failures = [
        page.performance < LIGHTHOUSE_THRESHOLDS.performance &&
          "performance",
        page.accessibility < LIGHTHOUSE_THRESHOLDS.accessibility &&
          "accessibility",
        page.bestPractices < LIGHTHOUSE_THRESHOLDS.bestPractices &&
          "best-practices",
        page.seo < LIGHTHOUSE_THRESHOLDS.seo && "seo",
        page.lcpMs > LIGHTHOUSE_THRESHOLDS.lcpMs && "lcp",
        page.cls > LIGHTHOUSE_THRESHOLDS.cls && "cls",
        page.tbtMs > LIGHTHOUSE_THRESHOLDS.tbtMs && "tbt",
      ].filter(Boolean);
      page.status = page.failures.length === 0 ? "pass" : "fail";

      return page;
    })
    .sort((left, right) => left.url.localeCompare(right.url));
}

export function renderLighthouseMarkdown(pages) {
  const failed = pages.filter((page) => page.status === "fail");
  const overall =
    pages.length > 0 && failed.length === 0 ? "PASS" : "FAIL";
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
        `${page.performance} | ${page.accessibility} | ` +
        `${page.bestPractices} | ${page.seo} | ${page.lcpMs} ms | ` +
        `${page.cls} | ${page.tbtMs} ms |`
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
