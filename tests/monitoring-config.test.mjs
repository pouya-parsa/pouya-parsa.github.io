import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

test("Lighthouse config monitors all three pages with approved thresholds", () => {
  const config = require("../lighthouserc.cjs");
  const { collect, assert: assertion } = config.ci;

  assert.equal(collect.numberOfRuns, 3);
  assert.deepEqual(collect.url, [
    "https://pouya-parsa.github.io/",
    "https://pouya-parsa.github.io/cloud-drive/",
    "https://pouya-parsa.github.io/visual-distribution-anchoring/",
  ]);
  assert.deepEqual(assertion.assertions["categories:seo"], [
    "error",
    { minScore: 0.95, aggregationMethod: "median" },
  ]);
  assert.deepEqual(
    assertion.assertions["largest-contentful-paint"],
    ["error", { maxNumericValue: 3000, aggregationMethod: "median" }]
  );
});

test("Lighthouse summary rejects a report set missing the VDA page", () => {
  const directory = fs.mkdtempSync(
    path.join(os.tmpdir(), "site-monitor-summary-")
  );
  const output = path.join(directory, "summary.md");
  const urls = [
    "https://pouya-parsa.github.io/",
    "https://pouya-parsa.github.io/cloud-drive/",
  ];
  const report = (url) => ({
    finalDisplayedUrl: url,
    categories: {
      performance: { score: 0.9 },
      accessibility: { score: 0.95 },
      "best-practices": { score: 0.95 },
      seo: { score: 1 },
    },
    audits: {
      "largest-contentful-paint": { numericValue: 1800 },
      "cumulative-layout-shift": { numericValue: 0.01 },
      "total-blocking-time": { numericValue: 50 },
    },
  });

  try {
    for (const [pageIndex, url] of urls.entries()) {
      for (let run = 1; run <= 3; run += 1) {
        fs.writeFileSync(
          path.join(
            directory,
            `page-${pageIndex}-run-${run}.report.json`
          ),
          JSON.stringify(report(url))
        );
      }
    }

    const result = spawnSync(
      process.execPath,
      [
        new URL("../scripts/lighthouse-summary.mjs", import.meta.url)
          .pathname,
        "--input",
        directory,
        "--output",
        output,
      ],
      {
        encoding: "utf8",
        env: {
          ...process.env,
          LHCI_BASE_URL: "https://pouya-parsa.github.io/",
        },
      }
    );

    assert.equal(result.status, 1);
    assert.match(
      result.stdout,
      /Expected 3 Lighthouse reports for https:\/\/pouya-parsa\.github\.io\/visual-distribution-anchoring\/; found 0/
    );
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("daily workflow is manual, scheduled, read-only, and retains reports", () => {
  const yaml = fs.readFileSync(
    new URL(
      "../.github/workflows/daily-site-monitor.yml",
      import.meta.url
    ),
    "utf8"
  );

  assert.match(yaml, /schedule:/);
  assert.match(yaml, /cron: ["']17 12 \* \* \*["']/);
  assert.match(yaml, /workflow_dispatch:/);
  assert.match(yaml, /permissions:\s*\n\s+contents: read/);
  assert.match(yaml, /traffic-report:/);
  assert.match(
    yaml,
    /traffic-report:[\s\S]*permissions:\s*\n\s+contents: read\s*\n\s+id-token: write/
  );
  assert.match(yaml, /google-github-actions\/auth@v3/);
  assert.match(
    yaml,
    /access_token_scopes:\s*https:\/\/www\.googleapis\.com\/auth\/webmasters\.readonly/
  );
  assert.match(yaml, /secrets\.CLOUDFLARE_API_TOKEN/);
  assert.equal(
    (yaml.match(/secrets\./g) ?? []).length,
    1,
    "only the read-only Cloudflare secret is allowed"
  );
  assert.match(yaml, /npm run monitor:traffic/);
  assert.match(yaml, /traffic-report-\$\{\{ github\.run_id \}\}/);
  assert.doesNotMatch(yaml, /issues: write|contents: write/);
  assert.match(yaml, /retention-days: 90/);
  assert.match(yaml, /if: always\(\)/);
  assert.match(yaml, /GITHUB_STEP_SUMMARY/);
});

test("analytics runbook documents metrics, limits, and credential rotation", () => {
  const runbook = fs.readFileSync(
    new URL("../docs/analytics.md", import.meta.url),
    "utf8"
  );
  const requiredNames = [
    "GCP_WORKLOAD_IDENTITY_PROVIDER",
    "GCP_SERVICE_ACCOUNT_EMAIL",
    "SEARCH_CONSOLE_SITE_URL",
    "CLOUDFLARE_ACCOUNT_ID",
    "CLOUDFLARE_WEB_ANALYTICS_SITE_TAG",
    "CLOUDFLARE_ANALYTICS_DATASET",
    "CLOUDFLARE_API_TOKEN",
  ];

  for (const name of requiredNames) assert.match(runbook, new RegExp(name));
  assert.match(runbook, /Account Analytics: Read/);
  assert.match(runbook, /browser referrals, not crawler requests/i);
  assert.match(runbook, /without cookies or persistent\s+identifiers/i);
  assert.match(runbook, /not legal advice/i);
  assert.match(runbook, /gh secret set CLOUDFLARE_API_TOKEN/);
  assert.match(runbook, /wrangler logout/);
});
