import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

test("Lighthouse config monitors both pages with approved thresholds", () => {
  const config = require("../lighthouserc.cjs");
  const { collect, assert: assertion } = config.ci;

  assert.equal(collect.numberOfRuns, 3);
  assert.deepEqual(collect.url, [
    "https://pouya-parsa.github.io/",
    "https://pouya-parsa.github.io/cloud-drive/",
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
  assert.doesNotMatch(yaml, /issues: write|contents: write|secrets\./);
  assert.match(yaml, /retention-days: 90/);
  assert.match(yaml, /if: always\(\)/);
  assert.match(yaml, /GITHUB_STEP_SUMMARY/);
});
