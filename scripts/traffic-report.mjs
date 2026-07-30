import fs from "node:fs/promises";
import path from "node:path";
import { collectCloudflareMetrics } from "../monitoring/cloudflare-analytics.mjs";
import { collectSearchConsoleMetrics } from "../monitoring/search-console.mjs";
import {
  buildTrafficReport,
  renderTrafficReportMarkdown,
} from "../monitoring/traffic-report.mjs";

function configuredProvider(variableNames, operation) {
  const missing = variableNames.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    return Promise.reject(
      new Error(`Missing configuration: ${missing.join(", ")}`)
    );
  }
  return operation();
}

const now = new Date();
const [searchResult, cloudflareResult] = await Promise.allSettled([
  configuredProvider(
    ["GOOGLE_SEARCH_CONSOLE_TOKEN", "SEARCH_CONSOLE_SITE_URL"],
    () =>
      collectSearchConsoleMetrics({
        accessToken: process.env.GOOGLE_SEARCH_CONSOLE_TOKEN,
        siteUrl: process.env.SEARCH_CONSOLE_SITE_URL,
        now,
      })
  ),
  configuredProvider(
    [
      "CLOUDFLARE_API_TOKEN",
      "CLOUDFLARE_ACCOUNT_ID",
      "CLOUDFLARE_WEB_ANALYTICS_SITE_TAG",
      "CLOUDFLARE_ANALYTICS_DATASET",
    ],
    () =>
      collectCloudflareMetrics({
        apiToken: process.env.CLOUDFLARE_API_TOKEN,
        accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
        siteTag: process.env.CLOUDFLARE_WEB_ANALYTICS_SITE_TAG,
        dataset: process.env.CLOUDFLARE_ANALYTICS_DATASET,
        now,
      })
  ),
]);

const report = buildTrafficReport({
  generatedAt: now,
  searchResult,
  cloudflareResult,
});
const markdown = renderTrafficReportMarkdown(report);
const outputDirectory = path.resolve(".monitoring");

await fs.mkdir(outputDirectory, { recursive: true });
await Promise.all([
  fs.writeFile(
    path.join(outputDirectory, "traffic-report.json"),
    `${JSON.stringify(report, null, 2)}\n`
  ),
  fs.writeFile(path.join(outputDirectory, "traffic-report.md"), markdown),
]);

process.stdout.write(markdown);
if (report.status !== "pass") process.exitCode = 1;
