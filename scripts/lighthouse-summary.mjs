import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import {
  aggregateLighthouseReports,
  loadLighthouseReports,
  renderLighthouseMarkdown,
} from "../monitoring/lighthouse-report.mjs";

const { values } = parseArgs({
  options: {
    input: { type: "string", default: ".monitoring/lighthouse" },
    output: {
      type: "string",
      default: ".monitoring/lighthouse-summary.md",
    },
  },
});

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
    const count = reports.filter(
      (report) => report.finalDisplayedUrl === url
    ).length;
    if (count !== 3) {
      throw new Error(
        `Expected 3 Lighthouse reports for ${url}; found ${count}`
      );
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
    `## Lighthouse mobile audit\n\n` +
    `**Overall: FAIL** — ${error.message}\n`;
  await mkdir(path.dirname(values.output), { recursive: true });
  await writeFile(values.output, markdown);
  process.stdout.write(markdown);
  process.exitCode = 1;
}
