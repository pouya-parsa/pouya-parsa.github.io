import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { auditLiveSite } from "../monitoring/audit-live.mjs";
import { renderSiteAuditMarkdown } from "../monitoring/report.mjs";
import { buildSitePolicy } from "../monitoring/site-policy.mjs";

const defaults = {
  fetchBaseUrl:
    process.env.SITE_BASE_URL ?? "https://pouya-parsa.github.io/",
  canonicalBaseUrl:
    process.env.SITE_CANONICAL_BASE_URL ??
    "https://pouya-parsa.github.io/",
  json: ".monitoring/site-audit.json",
  markdown: ".monitoring/site-audit.md",
};

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

const policy = buildSitePolicy({
  fetchBaseUrl: values["base-url"],
  canonicalBaseUrl: values["canonical-base-url"],
});
const report = await auditLiveSite({ policy });
const markdown = renderSiteAuditMarkdown(report);

await Promise.all([
  mkdir(path.dirname(values.json), { recursive: true }),
  mkdir(path.dirname(values.markdown), { recursive: true }),
]);
await Promise.all([
  writeFile(values.json, `${JSON.stringify(report, null, 2)}\n`),
  writeFile(values.markdown, markdown),
]);

process.stdout.write(markdown);
if (report.summary.status === "fail") process.exitCode = 1;
