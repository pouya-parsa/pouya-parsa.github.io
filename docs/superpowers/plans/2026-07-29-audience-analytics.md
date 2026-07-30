# Audience Analytics and Search Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add privacy-conscious Google Search, audience, referral, real-user performance, and high-value action metrics to the personal website and its existing daily GitHub Actions summary.

**Architecture:** Keep the public site static, adding Cloudflare's deferred Web Analytics beacon and a small first-party action module. Send only allowlisted action names and normalized page paths to a Cloudflare Worker backed by Analytics Engine. Query Search Console and Cloudflare from a separate daily workflow job through short-lived Google credentials and a read-only Cloudflare token, normalize both providers into one report model, and preserve the existing site-health gate as an independent job.

**Tech Stack:** Static HTML, browser ES modules, Node.js 22 built-in test runner and `fetch`, Cloudflare Workers/Wrangler 4, Workers Analytics Engine, Cloudflare GraphQL Analytics API, Google Search Console API, Google Workload Identity Federation, GitHub Actions.

## Global Constraints

- Preserve the current visual design and all current site content.
- Keep the public website static; no page content may depend on analytics JavaScript.
- Track only `paper_pdf`, `interactive_article`, `cv`, `github_profile`, and `copy_citation`.
- Store only an allowlisted event name and normalized page path for action events.
- Do not store cookies, persistent visitor IDs, names, email addresses, raw IP addresses, user agents, full URLs, query strings, fragments, or referrer values in Analytics Engine.
- Label visits, action counts, sampled Cloudflare data, and AI-assistant browser referrals accurately; do not describe them as exact humans or crawler counts.
- Use `https://www.googleapis.com/auth/webmasters.readonly` for daily Search Console access.
- Use GitHub Workload Identity Federation restricted to `pouya-parsa/pouya-parsa.github.io` on `refs/heads/main`; do not create a Google service-account key.
- Give GitHub only `Account Analytics: Read` on Cloudflare; keep Worker deployment permission in local Wrangler OAuth stored in the macOS keychain.
- Keep site health and traffic reporting as separate workflow jobs.
- Use fixture-based automated tests; unit tests must not contact Google or Cloudflare.
- Keep Node.js at `>=22`, the current daily schedule at `17 12 * * *`, and artifact retention at 90 days.
- Preserve the unrelated untracked `main.tex`.
- Use `apply_patch` for repository edits and make a focused commit after each
  task that changes repository files.

---

## File Structure

### Public site

- `googlec2d107d84ed0147d.html` — root Search Console ownership token.
- `scripts/site-analytics.mjs` — allowlisted browser action tracking and transport.
- `index.html` — homepage Web Analytics beacon, event endpoint, and action annotations.
- `cloud-drive/index.html` — article Web Analytics beacon, event endpoint, and action annotations.

### Cloudflare Worker

- `workers/site-events/wrangler.jsonc` — Worker name, compatibility date, allowed origins, and Analytics Engine binding.
- `workers/site-events/src/index.mjs` — CORS, payload validation, and aggregate event writes.

### Traffic reporting

- `monitoring/traffic-dates.mjs` — Pacific and UTC reporting windows.
- `monitoring/search-console.mjs` — Search Analytics API requests and normalized search metrics.
- `monitoring/cloudflare-analytics.mjs` — RUM GraphQL, Analytics Engine SQL, sampling correction, and referrer grouping.
- `monitoring/traffic-report.mjs` — provider-independent report model and Markdown renderer.
- `scripts/traffic-report.mjs` — environment validation, partial-failure handling, artifact writes, and exit status.

### Tests and fixtures

- `tests/analytics-worker.test.mjs` — Worker validation, CORS, and storage privacy.
- `tests/site-analytics.test.mjs` — browser payload, path normalization, and transport.
- `tests/traffic-dates.test.mjs` — reporting windows and finalized-date selection.
- `tests/search-console.test.mjs` — Search Console requests and response normalization.
- `tests/cloudflare-analytics.test.mjs` — RUM/action aggregation and AI-referrer classification.
- `tests/traffic-report.test.mjs` — report rendering and partial-provider failures.
- `tests/fixtures/traffic-responses.mjs` — sanitized Google and Cloudflare response objects.
- `tests/site-content.test.js` — root token, beacon, endpoint, and annotation assertions.
- `tests/monitoring-config.test.mjs` — exact workflow permissions, secrets, jobs, and artifact behavior.

### Operations

- `.github/workflows/daily-site-monitor.yml` — separate credentialed traffic-report job.
- `docs/analytics.md` — credential acquisition, dashboards, metrics, interpretation, rotation, and recovery.
- `docs/monitoring.md` — link from the existing site-health guide to audience reporting.
- `package.json` and `package-lock.json` — Wrangler and traffic-report scripts.

---

### Task 1: Publish and verify the Search Console ownership file

**Files:**
- Create: `googlec2d107d84ed0147d.html`
- Delete: `google-console/googlec2d107d84ed0147d.html`
- Modify: `tests/site-content.test.js`

**Interfaces:**
- Consumes: The owner-supplied verification content `google-site-verification: googlec2d107d84ed0147d.html`.
- Produces: A live root URL that Google can fetch and a permanent content regression test.

- [ ] **Step 1: Write the failing root-path test**

Append this test to `tests/site-content.test.js`:

```js
test("Search Console verification file is published at the site root", () => {
  const rootToken = path.join(root, "googlec2d107d84ed0147d.html");
  const nestedToken = path.join(
    root,
    "google-console/googlec2d107d84ed0147d.html"
  );

  assert.equal(fs.existsSync(rootToken), true);
  assert.equal(
    fs.readFileSync(rootToken, "utf8").trim(),
    "google-site-verification: googlec2d107d84ed0147d.html"
  );
  assert.equal(fs.existsSync(nestedToken), false);
});
```

- [ ] **Step 2: Run the test and verify the root-path failure**

Run:

```bash
node --test tests/site-content.test.js
```

Expected: FAIL because `googlec2d107d84ed0147d.html` is not at the repository root.

- [ ] **Step 3: Relocate the verification file with an exact body**

Use `apply_patch` to add `googlec2d107d84ed0147d.html` containing:

```text
google-site-verification: googlec2d107d84ed0147d.html
```

Use `apply_patch` to delete
`google-console/googlec2d107d84ed0147d.html`. Remove the now-empty directory
only if it is still present.

- [ ] **Step 4: Run the focused and complete test suites**

Run:

```bash
node --test tests/site-content.test.js
npm test
```

Expected: both commands PASS.

- [ ] **Step 5: Commit only the verification change**

```bash
git add googlec2d107d84ed0147d.html tests/site-content.test.js
git commit -m "feat: publish Search Console verification"
```

Confirm `main.tex` is not staged.

- [ ] **Step 6: Publish the token and complete owner verification**

Push this focused commit to `main`, wait for GitHub Pages, and run:

```bash
curl --fail --silent \
  https://pouya-parsa.github.io/googlec2d107d84ed0147d.html
```

Expected:

```text
google-site-verification: googlec2d107d84ed0147d.html
```

The owner then clicks **Verify** for the URL-prefix property
`https://pouya-parsa.github.io/` in Search Console. Keep the token file
published permanently.

---

### Task 2: Build the privacy-preserving Cloudflare action collector

**Files:**
- Create: `workers/site-events/src/index.mjs`
- Create: `workers/site-events/wrangler.jsonc`
- Create: `tests/analytics-worker.test.mjs`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: `POST /event` with JSON `{ event: string, pagePath: string }` and an allowed `Origin`.
- Produces: `handleRequest(request, env)` and one Analytics Engine point with `blob1=event`, `blob2=pagePath`, `double1=1`, and `index1=event`.

- [ ] **Step 1: Write the failing valid-event and privacy tests**

Create `tests/analytics-worker.test.mjs` with a fake Analytics Engine binding:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { handleRequest } from "../workers/site-events/src/index.mjs";

const origin = "https://pouya-parsa.github.io";

const post = (body, headers = {}) =>
  new Request("https://events.example.test/event", {
    method: "POST",
    headers: {
      origin,
      "content-type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });

const environment = () => {
  const points = [];
  return {
    points,
    env: {
      EVENTS: {
        writeDataPoint(point) {
          points.push(point);
        },
      },
      ALLOWED_ORIGINS:
        "https://pouya-parsa.github.io,http://localhost:8000,http://127.0.0.1:8000",
    },
  };
};

test("collector stores only event and normalized page path", async () => {
  const { env, points } = environment();
  const response = await handleRequest(
    post({ event: "paper_pdf", pagePath: "/cloud-drive/" }),
    env
  );

  assert.equal(response.status, 202);
  assert.equal(response.headers.get("access-control-allow-origin"), origin);
  assert.deepEqual(points, [
    {
      blobs: ["paper_pdf", "/cloud-drive/"],
      doubles: [1],
      indexes: ["paper_pdf"],
    },
  ]);
  assert.doesNotMatch(JSON.stringify(points), /email|userAgent|referrer|ip/i);
});

test("collector rejects extra fields and disallowed events", async () => {
  for (const body of [
    { event: "page_view", pagePath: "/" },
    { event: "cv", pagePath: "/", email: "visitor@example.test" },
    { event: "cv", pagePath: "/?source=mail" },
  ]) {
    const { env, points } = environment();
    const response = await handleRequest(post(body), env);
    assert.equal(response.status, 400);
    assert.deepEqual(points, []);
  }
});
```

- [ ] **Step 2: Run the Worker test and verify the missing-module failure**

Run:

```bash
node --test tests/analytics-worker.test.mjs
```

Expected: FAIL because `workers/site-events/src/index.mjs` does not exist.

- [ ] **Step 3: Implement strict event, path, method, size, and CORS validation**

Create `workers/site-events/src/index.mjs` around these exact contracts:

```js
export const EVENT_NAMES = new Set([
  "paper_pdf",
  "interactive_article",
  "cv",
  "github_profile",
  "copy_citation",
]);

export const PAGE_PATHS = new Set(["/", "/cloud-drive/"]);
const MAX_BODY_BYTES = 512;

const corsHeaders = (origin) => ({
  "access-control-allow-origin": origin,
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "Content-Type",
  "access-control-max-age": "86400",
  vary: "Origin",
});

const response = (status, message, origin = "") =>
  new Response(message, {
    status,
    headers: {
      "cache-control": "no-store",
      "content-type": "text/plain; charset=utf-8",
      ...(origin ? corsHeaders(origin) : {}),
    },
  });

export async function handleRequest(request, env) {
  const origin = request.headers.get("origin") ?? "";
  const allowedOrigins = new Set(
    String(env.ALLOWED_ORIGINS ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
  );

  if (!allowedOrigins.has(origin)) return response(403, "Forbidden");
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }
  if (new URL(request.url).pathname !== "/event") {
    return response(404, "Not found", origin);
  }
  if (request.method !== "POST") {
    return response(405, "Method not allowed", origin);
  }
  if (
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  ) {
    return response(415, "JSON required", origin);
  }

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_BODY_BYTES) {
    return response(413, "Payload too large", origin);
  }

  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) {
    return response(413, "Payload too large", origin);
  }

  let body;
  try {
    body = JSON.parse(text);
  } catch {
    return response(400, "Invalid JSON", origin);
  }

  const keys = Object.keys(body ?? {}).sort();
  if (
    keys.join(",") !== "event,pagePath" ||
    !EVENT_NAMES.has(body.event) ||
    !PAGE_PATHS.has(body.pagePath)
  ) {
    return response(400, "Invalid event", origin);
  }

  env.EVENTS.writeDataPoint({
    blobs: [body.event, body.pagePath],
    doubles: [1],
    indexes: [body.event],
  });
  return response(202, "Accepted", origin);
}

export default {
  fetch(request, env) {
    return handleRequest(request, env);
  },
};
```

Extend the test file with cases for `OPTIONS`, wrong origin, wrong path,
wrong method, wrong content type, malformed JSON, and bodies over 512 bytes.
Each rejection must assert that `points` remains empty.

- [ ] **Step 4: Add Wrangler 4 and the Analytics Engine configuration**

Install the current project-local Wrangler:

```bash
npm install --save-dev wrangler@latest
```

Create `workers/site-events/wrangler.jsonc`:

```jsonc
{
  "$schema": "../../node_modules/wrangler/config-schema.json",
  "name": "pouya-parsa-site-events",
  "main": "src/index.mjs",
  "compatibility_date": "2026-07-29",
  "workers_dev": true,
  "vars": {
    "ALLOWED_ORIGINS": "https://pouya-parsa.github.io,http://localhost:8000,http://127.0.0.1:8000"
  },
  "analytics_engine_datasets": [
    {
      "binding": "EVENTS",
      "dataset": "pouya_parsa_site_events"
    }
  ]
}
```

Add these package scripts:

```json
{
  "analytics:worker:dry-run": "wrangler deploy --dry-run --config workers/site-events/wrangler.jsonc",
  "analytics:worker:startup": "wrangler check startup --config workers/site-events/wrangler.jsonc"
}
```

- [ ] **Step 5: Verify the Worker locally and as a deployment bundle**

Run:

```bash
node --test tests/analytics-worker.test.mjs
npm run analytics:worker:dry-run
npm run analytics:worker:startup
npm test
```

Expected: all tests PASS, Wrangler produces a valid dry-run bundle, and the
startup check stays within Cloudflare's Worker startup limit.

- [ ] **Step 6: Commit the collector**

```bash
git add package.json package-lock.json workers/site-events tests/analytics-worker.test.mjs
git commit -m "feat: add aggregate action collector"
```

---

### Task 3: Deploy Cloudflare resources and instrument the two pages

**Files:**
- Create: `scripts/site-analytics.mjs`
- Create: `tests/site-analytics.test.mjs`
- Modify: `index.html`
- Modify: `cloud-drive/index.html`
- Modify: `tests/site-content.test.js`

**Interfaces:**
- Consumes: The deployed Worker `/event` URL and the Cloudflare Web Analytics site's public `site_token`.
- Produces: `createActionPayload`, `normalizePagePath`, `transmitAction`, `initActionTracking`, Cloudflare page-view beacons, and explicit `data-analytics-event` annotations.

- [ ] **Step 1: Authenticate Wrangler with keychain storage**

Run:

```bash
npx wrangler login --use-keyring
npx wrangler whoami
```

The owner completes the Cloudflare browser sign-in. Expected: `whoami` shows
the intended account and confirms encrypted keychain-backed OAuth storage.

- [ ] **Step 2: Deploy the tested Worker**

Run:

```bash
npx wrangler deploy --config workers/site-events/wrangler.jsonc \
  | tee /tmp/pouya-site-events-deploy.txt
SITE_EVENTS_ORIGIN="$(
  sed -nE \
    's#.*(https://[^[:space:]]+\.workers\.dev).*#\1#p' \
    /tmp/pouya-site-events-deploy.txt \
    | tail -n 1
)"
test -n "$SITE_EVENTS_ORIGIN"
```

Confirm that a `GET` returns `405` with an allowed origin:

```bash
curl --include \
  --header "Origin: https://pouya-parsa.github.io" \
  "${SITE_EVENTS_ORIGIN}/event"
```

Keep the exact `${SITE_EVENTS_ORIGIN}/event` value for the page metadata in
Step 7.

- [ ] **Step 3: Create the Cloudflare Web Analytics site**

In the authenticated Cloudflare dashboard:

1. Open **Analytics & Logs → Web Analytics**.
2. Select **Add a site**.
3. Enter `pouya-parsa.github.io`.
4. Keep automatic injection disabled because GitHub Pages is not proxied by
   Cloudflare.
5. Save the returned JavaScript snippet, public `site_token`, and API
   `site_tag` separately.

The `site_token` is embedded in HTML. The `site_tag` is used only as the
non-secret GitHub variable `CLOUDFLARE_WEB_ANALYTICS_SITE_TAG`.

- [ ] **Step 4: Write failing browser-module tests**

Create `tests/site-analytics.test.mjs`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import {
  createActionPayload,
  normalizePagePath,
  transmitAction,
} from "../scripts/site-analytics.mjs";

test("action payload is limited to event and normalized page path", () => {
  assert.equal(normalizePagePath("/cloud-drive/index.html"), "/cloud-drive/");
  assert.equal(normalizePagePath("/"), "/");
  assert.equal(normalizePagePath("/unknown/"), null);
  assert.deepEqual(createActionPayload("paper_pdf", "/cloud-drive/"), {
    event: "paper_pdf",
    pagePath: "/cloud-drive/",
  });
  assert.equal(createActionPayload("page_view", "/"), null);
});

test("fetch fallback uses keepalive and sends no visitor fields", async () => {
  const calls = [];
  const accepted = transmitAction({
    endpoint: "https://events.example.test/event",
    event: "cv",
    pagePath: "/",
    navigatorImpl: {},
    fetchImpl: async (url, options) => calls.push({ url, options }),
  });

  assert.equal(accepted, true);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(calls[0].options.keepalive, true);
  assert.equal(calls[0].options.headers["content-type"], "application/json");
  assert.deepEqual(JSON.parse(calls[0].options.body), {
    event: "cv",
    pagePath: "/",
  });
  assert.doesNotMatch(calls[0].options.body, /email|referrer|userAgent|ip/i);
});
```

- [ ] **Step 5: Run the browser-module tests and verify they fail**

Run:

```bash
node --test tests/site-analytics.test.mjs
```

Expected: FAIL because `scripts/site-analytics.mjs` does not exist.

- [ ] **Step 6: Implement the allowlisted browser action module**

Create `scripts/site-analytics.mjs` with:

```js
export const ACTION_EVENTS = new Set([
  "paper_pdf",
  "interactive_article",
  "cv",
  "github_profile",
  "copy_citation",
]);

export function normalizePagePath(pathname) {
  if (pathname === "/") return "/";
  if (pathname === "/cloud-drive/" || pathname === "/cloud-drive/index.html") {
    return "/cloud-drive/";
  }
  return null;
}

export function createActionPayload(event, pathname) {
  const pagePath = normalizePagePath(pathname);
  if (!ACTION_EVENTS.has(event) || !pagePath) return null;
  return { event, pagePath };
}

export function transmitAction({
  endpoint,
  event,
  pagePath,
  navigatorImpl = globalThis.navigator,
  fetchImpl = globalThis.fetch,
}) {
  const payload = createActionPayload(event, pagePath);
  if (!endpoint || !payload) return false;
  const body = JSON.stringify(payload);

  if (typeof navigatorImpl?.sendBeacon === "function") {
    const blob = new Blob([body], { type: "application/json" });
    if (navigatorImpl.sendBeacon(endpoint, blob)) return true;
  }

  void fetchImpl(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    keepalive: true,
    mode: "cors",
    credentials: "omit",
  }).catch(() => {});
  return true;
}

export function initActionTracking({
  documentImpl = globalThis.document,
  locationImpl = globalThis.location,
  navigatorImpl = globalThis.navigator,
  fetchImpl = globalThis.fetch,
} = {}) {
  const endpoint = documentImpl
    ?.querySelector('meta[name="site-analytics-endpoint"]')
    ?.getAttribute("content");
  const pagePath = normalizePagePath(locationImpl?.pathname ?? "");
  if (!endpoint || !pagePath) return;

  documentImpl.addEventListener("click", (event) => {
    const target = event.target?.closest?.("[data-analytics-event]");
    if (!target) return;
    transmitAction({
      endpoint,
      event: target.getAttribute("data-analytics-event"),
      pagePath,
      navigatorImpl,
      fetchImpl,
    });
  });
}

if (typeof document !== "undefined") initActionTracking();
```

- [ ] **Step 7: Add failing content assertions, then instrument both pages**

Extend `tests/site-content.test.js` to assert:

- Both `index.html` and `cloud-drive/index.html` contain exactly one
  Cloudflare beacon with the actual 32-character public `site_token`.
- Both contain a `site-analytics-endpoint` meta tag whose value is the exact
  deployed HTTPS Worker `/event` URL.
- Both load their relative `scripts/site-analytics.mjs` module.
- Every homepage `cloud-drive/` link has
  `data-analytics-event="interactive_article"`.
- Every homepage `PouyaParsa_CV.pdf` link has
  `data-analytics-event="cv"`.
- The visible GitHub profile link has
  `data-analytics-event="github_profile"`.
- Every visible arXiv PDF link has `data-analytics-event="paper_pdf"`.
- `#copy-citation` has `data-analytics-event="copy_citation"`.

Run the new content test and confirm it fails. Then:

1. Add the exact Worker endpoint meta tag to both `<head>` elements.
2. Add the exact deferred/module Web Analytics snippet returned by
   Cloudflare to both pages.
3. Add the module script before each closing `</body>`.
4. Add the exact action attributes listed above without changing link text,
   destinations, layout, or citation behavior.

- [ ] **Step 8: Verify instrumentation and commit**

Run:

```bash
node --test tests/site-analytics.test.mjs
node --test tests/site-content.test.js
npm test
```

Expected: all tests PASS.

Commit:

```bash
git add scripts/site-analytics.mjs index.html cloud-drive/index.html tests/site-analytics.test.mjs tests/site-content.test.js
git commit -m "feat: instrument privacy-conscious site analytics"
```

---

### Task 4: Implement finalized Search Console metrics

**Files:**
- Create: `monitoring/traffic-dates.mjs`
- Create: `monitoring/search-console.mjs`
- Create: `tests/traffic-dates.test.mjs`
- Create: `tests/search-console.test.mjs`
- Create: `tests/fixtures/traffic-responses.mjs`

**Interfaces:**
- Produces: `shiftDate(date, days)`, `pacificDate(now)`, `cloudflareWindows(now)`, `selectLatestFinalizedDate(response, now)`, `querySearchAnalytics(options)`, and `collectSearchConsoleMetrics(options)`.
- Returns: `{ latestFinalizedDate, daily, trailing7, topPages, topQueries }`.

- [ ] **Step 1: Write failing date-window tests**

Create `tests/traffic-dates.test.mjs`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import {
  cloudflareWindows,
  pacificDate,
  selectLatestFinalizedDate,
  shiftDate,
} from "../monitoring/traffic-dates.mjs";

test("date helpers preserve provider time-zone contracts", () => {
  const now = new Date("2026-07-29T13:00:00Z");
  assert.equal(pacificDate(now), "2026-07-29");
  assert.equal(shiftDate("2026-03-01", -1), "2026-02-28");
  assert.deepEqual(cloudflareWindows(now), {
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
  });
});

test("latest finalized Search Console date precedes incomplete data", () => {
  assert.equal(
    selectLatestFinalizedDate(
      { metadata: { first_incomplete_date: "2026-07-27" } },
      new Date("2026-07-29T13:00:00Z")
    ),
    "2026-07-26"
  );
});
```

- [ ] **Step 2: Run the date tests and verify the missing-module failure**

Run:

```bash
node --test tests/traffic-dates.test.mjs
```

Expected: FAIL because `monitoring/traffic-dates.mjs` does not exist.

- [ ] **Step 3: Implement deterministic Pacific and UTC date helpers**

Implement `monitoring/traffic-dates.mjs` using
`Intl.DateTimeFormat(..., { timeZone: "America/Los_Angeles" })` for Search
Console dates and UTC ISO slicing for Cloudflare. `shiftDate` must parse and
shift with `Date.UTC`, not the machine's local timezone.

`selectLatestFinalizedDate` must:

1. Return one day before `metadata.first_incomplete_date` when provided.
2. Otherwise return one day before the current Pacific date.

Run `node --test tests/traffic-dates.test.mjs`; expected PASS.

- [ ] **Step 4: Add sanitized Search Console fixtures and failing client tests**

Create `tests/fixtures/traffic-responses.mjs` with:

```js
export const searchDates = {
  rows: [
    { keys: ["2026-07-25"], clicks: 2, impressions: 80, ctr: 0.025, position: 9.2 },
    { keys: ["2026-07-26"], clicks: 3, impressions: 100, ctr: 0.03, position: 8.4 },
  ],
  metadata: { first_incomplete_date: "2026-07-27" },
};

export const searchDaily = {
  rows: [{ clicks: 3, impressions: 100, ctr: 0.03, position: 8.4 }],
};

export const searchTrailing7 = {
  rows: [{ clicks: 14, impressions: 500, ctr: 0.028, position: 9.1 }],
};

export const searchPages = {
  rows: [
    {
      keys: ["https://pouya-parsa.github.io/cloud-drive/"],
      clicks: 8,
      impressions: 220,
      ctr: 0.03636,
      position: 7.5,
    },
  ],
};

export const searchQueries = {
  rows: [
    {
      keys: ["cloud vla inference"],
      clicks: 4,
      impressions: 70,
      ctr: 0.05714,
      position: 6.2,
    },
  ],
};
```

Create `tests/search-console.test.mjs` with a route-aware fake `fetch` that
returns the fixture matching `body.dimensions` and date range. Assert:

```js
const metrics = await collectSearchConsoleMetrics({
  accessToken: "test-google-token",
  siteUrl: "https://pouya-parsa.github.io/",
  now: new Date("2026-07-29T13:00:00Z"),
  fetchImpl,
});

assert.equal(metrics.latestFinalizedDate, "2026-07-26");
assert.deepEqual(metrics.daily, {
  clicks: 3,
  impressions: 100,
  ctr: 0.03,
  position: 8.4,
});
assert.equal(metrics.trailing7.startDate, "2026-07-20");
assert.equal(metrics.topPages[0].page, "https://pouya-parsa.github.io/cloud-drive/");
assert.equal(metrics.topQueries[0].query, "cloud vla inference");
assert.equal(requests[0].headers.authorization, "Bearer test-google-token");
assert.equal(requests[0].body.dataState, "all");
```

Also test that an aggregate response with no `rows` becomes zero clicks and
impressions with `ctr` and `position` set to `null`.

- [ ] **Step 5: Implement the Search Analytics API client**

`querySearchAnalytics` must POST to:

```js
const endpoint =
  "https://www.googleapis.com/webmasters/v3/sites/" +
  `${encodeURIComponent(siteUrl)}/searchAnalytics/query`;
```

Use `Authorization: Bearer`, `Content-Type: application/json`, and reject
non-2xx responses with a sanitized message such as
`Search Console request failed (403)` without including tokens or response
bodies.

`collectSearchConsoleMetrics` makes five requests:

1. A 14-day date discovery query with `dimensions: ["date"]`,
   `dataState: "all"`, `type: "web"`, and `rowLimit: 14`.
2. Latest finalized daily aggregate with no dimensions,
   `dataState: "final"`, and `aggregationType: "byProperty"`.
3. Seven-day aggregate with the same options.
4. Top pages with `dimensions: ["page"]`, `aggregationType: "auto"`, and
   `rowLimit: 10`.
5. Top queries with `dimensions: ["query"]`,
   `aggregationType: "byProperty"`, and `rowLimit: 10`.

Use the API's aggregate row for headline CTR and position; do not average
row-level CTR or average-position values.

- [ ] **Step 6: Verify and commit Search Console reporting**

Run:

```bash
node --test tests/traffic-dates.test.mjs tests/search-console.test.mjs
npm test
```

Expected: all tests PASS.

Commit:

```bash
git add monitoring/traffic-dates.mjs monitoring/search-console.mjs tests/traffic-dates.test.mjs tests/search-console.test.mjs tests/fixtures/traffic-responses.mjs
git commit -m "feat: collect Search Console performance"
```

---

### Task 5: Implement Cloudflare audience, Web Vitals, referral, and action metrics

**Files:**
- Create: `monitoring/cloudflare-analytics.mjs`
- Create: `tests/cloudflare-analytics.test.mjs`
- Modify: `tests/fixtures/traffic-responses.mjs`

**Interfaces:**
- Produces: `classifyReferrerHost`, `scaleRumCount`, `buildActionsSql`, `collectCloudflareMetrics`.
- Returns: `{ windows, audience: { daily, trailing7 }, actions: { daily, trailing7 } }`.

- [ ] **Step 1: Add Cloudflare fixtures**

Extend `tests/fixtures/traffic-responses.mjs`:

```js
export const cloudflareRum = {
  data: {
    viewer: {
      accounts: [
        {
          total: [{ count: 12, avg: { sampleInterval: 1 }, sum: { visits: 8 } }],
          topPaths: [
            {
              count: 7,
              avg: { sampleInterval: 1 },
              sum: { visits: 5 },
              dimensions: { requestPath: "/cloud-drive/" },
            },
          ],
          topReferrers: [
            {
              count: 3,
              avg: { sampleInterval: 1 },
              sum: { visits: 2 },
              dimensions: { refererHost: "chatgpt.com" },
            },
            {
              count: 4,
              avg: { sampleInterval: 1 },
              sum: { visits: 3 },
              dimensions: { refererHost: "www.google.com" },
            },
          ],
          countries: [],
          devices: [],
          webVitals: [
            {
              count: 100,
              quantiles: {
                largestContentfulPaintP75: 1350,
                interactionToNextPaintP75: 120,
                cumulativeLayoutShiftP75: 0.01,
              },
            },
          ],
        },
      ],
    },
  },
};

export const cloudflareActions = {
  meta: [
    { name: "event", type: "String" },
    { name: "page_path", type: "String" },
    { name: "count", type: "UInt64" },
  ],
  data: [
    { event: "paper_pdf", page_path: "/cloud-drive/", count: 4 },
    { event: "copy_citation", page_path: "/cloud-drive/", count: 2 },
  ],
  rows: 2,
};
```

- [ ] **Step 2: Write failing Cloudflare normalization tests**

Create `tests/cloudflare-analytics.test.mjs` to assert:

```js
assert.equal(classifyReferrerHost("chatgpt.com"), "AI assistants");
assert.equal(classifyReferrerHost("www.perplexity.ai"), "AI assistants");
assert.equal(classifyReferrerHost("www.google.com"), "Search engines");
assert.equal(classifyReferrerHost(""), "Direct / unknown");
assert.equal(scaleRumCount({ count: 7, avg: { sampleInterval: 10 } }), 70);

const sql = buildActionsSql({
  dataset: "pouya_parsa_site_events",
  start: "2026-07-22T00:00:00Z",
  end: "2026-07-29T00:00:00Z",
});
assert.match(sql, /SUM\(_sample_interval \* double1\) AS count/);
assert.match(sql, /FROM pouya_parsa_site_events/);
assert.throws(
  () => buildActionsSql({
    dataset: "events; DROP TABLE events",
    start: "2026-07-22T00:00:00Z",
    end: "2026-07-29T00:00:00Z",
  }),
  /Invalid Analytics Engine dataset/
);
```

Use a fake `fetch` to return `cloudflareRum` for GraphQL and
`cloudflareActions` for SQL. Assert 12 daily views, 8 approximate visits,
`AI assistants` with two visits, p75 Web Vitals, and action counts.

- [ ] **Step 3: Run the test and verify the missing-module failure**

Run:

```bash
node --test tests/cloudflare-analytics.test.mjs
```

Expected: FAIL because `monitoring/cloudflare-analytics.mjs` does not exist.

- [ ] **Step 4: Implement the RUM GraphQL query**

Define one parameterized query per time window:

```graphql
query SiteAudience(
  $accountTag: string!
  $siteTag: string!
  $start: Time!
  $end: Time!
) {
  viewer {
    accounts(filter: { accountTag: $accountTag }) {
      total: rumPageloadEventsAdaptiveGroups(
        filter: {
          datetime_geq: $start
          datetime_lt: $end
          siteTag: $siteTag
          bot: 0
        }
        limit: 1
      ) {
        count
        avg { sampleInterval }
        sum { visits }
      }
      topPaths: rumPageloadEventsAdaptiveGroups(
        filter: {
          datetime_geq: $start
          datetime_lt: $end
          siteTag: $siteTag
          bot: 0
        }
        limit: 10
        orderBy: [count_DESC]
      ) {
        count
        avg { sampleInterval }
        sum { visits }
        dimensions { requestPath }
      }
      topReferrers: rumPageloadEventsAdaptiveGroups(
        filter: {
          datetime_geq: $start
          datetime_lt: $end
          siteTag: $siteTag
          bot: 0
        }
        limit: 20
        orderBy: [count_DESC]
      ) {
        count
        avg { sampleInterval }
        sum { visits }
        dimensions { refererHost }
      }
      countries: rumPageloadEventsAdaptiveGroups(
        filter: {
          datetime_geq: $start
          datetime_lt: $end
          siteTag: $siteTag
          bot: 0
        }
        limit: 10
        orderBy: [count_DESC]
      ) {
        count
        avg { sampleInterval }
        sum { visits }
        dimensions { countryName }
      }
      devices: rumPageloadEventsAdaptiveGroups(
        filter: {
          datetime_geq: $start
          datetime_lt: $end
          siteTag: $siteTag
          bot: 0
        }
        limit: 10
        orderBy: [count_DESC]
      ) {
        count
        avg { sampleInterval }
        sum { visits }
        dimensions { deviceType }
      }
      webVitals: rumWebVitalsEventsAdaptiveGroups(
        filter: {
          datetime_geq: $start
          datetime_lt: $end
          siteTag: $siteTag
          bot: 0
        }
        limit: 1
      ) {
        count
        quantiles {
          largestContentfulPaintP75
          interactionToNextPaintP75
          cumulativeLayoutShiftP75
        }
      }
    }
  }
}
```

POST it to `https://api.cloudflare.com/client/v4/graphql` with the read-only
Bearer token. Treat GraphQL `errors`, a missing account, and non-2xx responses
as sanitized provider errors. Scale RUM event counts by
`avg.sampleInterval`; use `sum.visits` for approximate visits.

Group referrer visits into these exact labels:

- `AI assistants`: `chatgpt.com`, `chat.openai.com`, `perplexity.ai`,
  `claude.ai`, `gemini.google.com`, `copilot.microsoft.com`
- `Search engines`: Google, Bing, DuckDuckGo, Yahoo
- `Social / developer`: GitHub, LinkedIn, X/Twitter
- `Direct / unknown`: empty referrer host
- `Other`: every remaining host

Strip a leading `www.` before classification.

Expose p75 Web Vitals only when `webVitals[0].count >= 75`; otherwise return
`null` with reason `insufficient-sample`.

- [ ] **Step 5: Implement sampled Analytics Engine SQL**

`buildActionsSql` must validate the dataset with
`/^[A-Za-z_][A-Za-z0-9_]*$/` and emit:

```sql
SELECT
  blob1 AS event,
  blob2 AS page_path,
  SUM(_sample_interval * double1) AS count
FROM pouya_parsa_site_events
WHERE timestamp >= toDateTime('2026-07-22 00:00:00')
  AND timestamp < toDateTime('2026-07-29 00:00:00')
GROUP BY event, page_path
ORDER BY count DESC
FORMAT JSON
```

POST query text to:

```js
const endpoint =
  `https://api.cloudflare.com/client/v4/accounts/${accountId}/analytics_engine/sql`;
```

Normalize only the five allowed event names. Treat an authenticated
missing-table response as zero data with state `no-data-yet`; treat other API
failures as unavailable.

`collectCloudflareMetrics` runs RUM and action queries for the previous UTC day
and previous seven full UTC days using `cloudflareWindows(now)`.

- [ ] **Step 6: Verify and commit Cloudflare reporting**

Run:

```bash
node --test tests/cloudflare-analytics.test.mjs
npm test
```

Expected: all tests PASS.

Commit:

```bash
git add monitoring/cloudflare-analytics.mjs tests/cloudflare-analytics.test.mjs tests/fixtures/traffic-responses.mjs
git commit -m "feat: collect Cloudflare audience metrics"
```

---

### Task 6: Build the combined traffic report and failure-safe CLI

**Files:**
- Create: `monitoring/traffic-report.mjs`
- Create: `scripts/traffic-report.mjs`
- Create: `tests/traffic-report.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: settled Search Console and Cloudflare results.
- Produces: `buildTrafficReport`, `renderTrafficReportMarkdown`, `.monitoring/traffic-report.json`, `.monitoring/traffic-report.md`, and a non-zero exit code when a configured provider is unavailable.

- [ ] **Step 1: Write failing report-model tests**

Create `tests/traffic-report.test.mjs` with a successful search result and
Cloudflare result. Assert this stable top-level shape:

```js
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
    "AI assistants means browser referrals, not crawler requests."
  ]
}
```

Assert Markdown contains:

```text
## Traffic and search performance
**Overall: PASS**
### Google Search
### Audience
### High-value actions
### Data quality
```

Add a partial-failure test where Search Console rejects with
`Search Console request failed (403)` but Cloudflare succeeds. Assert:

- Overall status is `unavailable`.
- Audience and action tables still render.
- Markdown contains `DATA UNAVAILABLE`.
- No token-like string or raw provider response appears.

- [ ] **Step 2: Run the tests and verify the missing-module failure**

Run:

```bash
node --test tests/traffic-report.test.mjs
```

Expected: FAIL because `monitoring/traffic-report.mjs` does not exist.

- [ ] **Step 3: Implement normalized JSON and escaped Markdown rendering**

Implement:

```js
export function buildTrafficReport({
  generatedAt,
  searchResult,
  cloudflareResult,
}) {
  // Convert Promise.allSettled-style inputs into the stable public model.
}

export function renderTrafficReportMarkdown(report) {
  // Render status, source dates, headline metrics, top rows, actions, and notes.
}
```

Requirements:

- Use `fulfilled`/`rejected` inputs so one provider cannot suppress the other.
- Put only sanitized `source` and `message` values in `errors`.
- Render percentage CTR with two decimal places and position with one.
- Render unavailable numeric values as `—`, not `0`.
- Escape Markdown table pipes and newlines.
- Sort high-value actions in the approved event-name order.
- Label Cloudflare `visits` as `Approx. visits`.
- Label AI assistant traffic as `AI-assistant browser referrals`.

- [ ] **Step 4: Implement the CLI and artifact-first error behavior**

`scripts/traffic-report.mjs` must read:

```text
GOOGLE_SEARCH_CONSOLE_TOKEN
SEARCH_CONSOLE_SITE_URL
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_WEB_ANALYTICS_SITE_TAG
CLOUDFLARE_ANALYTICS_DATASET
```

It must:

1. Turn a missing provider variable into a sanitized rejected result.
2. Run Search Console and Cloudflare collection independently.
3. Build the combined report.
4. Create `.monitoring/`.
5. Write JSON and Markdown before setting `process.exitCode = 1`.
6. Print only the Markdown report.

Add to `package.json`:

```json
{
  "monitor:traffic": "node scripts/traffic-report.mjs"
}
```

Do not print environment values, authorization headers, or raw API bodies.

- [ ] **Step 5: Verify success and failure fixtures**

Run:

```bash
node --test tests/traffic-report.test.mjs
npm test
```

Then run the CLI without credentials:

```bash
npm run monitor:traffic
```

Expected: non-zero exit after both `.monitoring/traffic-report.json` and
`.monitoring/traffic-report.md` are written with clear missing-configuration
messages and no secret values.

- [ ] **Step 6: Commit report generation**

```bash
git add monitoring/traffic-report.mjs scripts/traffic-report.mjs tests/traffic-report.test.mjs package.json
git commit -m "feat: generate daily traffic report"
```

---

### Task 7: Configure least-privilege Google and Cloudflare credentials

**Files:**
- No repository files in this task.

**Interfaces:**
- Produces GitHub variables: `GCP_WORKLOAD_IDENTITY_PROVIDER`, `GCP_SERVICE_ACCOUNT_EMAIL`, `SEARCH_CONSOLE_SITE_URL`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_WEB_ANALYTICS_SITE_TAG`, `CLOUDFLARE_ANALYTICS_DATASET`.
- Produces GitHub secret: `CLOUDFLARE_API_TOKEN`.

- [ ] **Step 1: Install and authenticate Google Cloud CLI**

Install the official CLI on macOS:

```bash
brew install --cask google-cloud-sdk
gcloud --version
gcloud auth login
gcloud auth list
```

The owner completes the Google browser sign-in and confirms the intended
account is active.

- [ ] **Step 2: Create a dedicated project and enable required APIs**

Use a unique, valid project ID and select it:

```bash
GCP_ANALYTICS_PROJECT="pp-site-metrics-$(date -u +%y%m%d%H%M)"
gcloud projects create "$GCP_ANALYTICS_PROJECT" \
  --name="Pouya Parsa Site Metrics"
gcloud config set project "$GCP_ANALYTICS_PROJECT"
gcloud services enable \
  searchconsole.googleapis.com \
  iamcredentials.googleapis.com \
  sts.googleapis.com
```

Expected: the project is active and all three services report enabled.

- [ ] **Step 3: Create a keyless reporting service account**

```bash
gcloud iam service-accounts create site-traffic-reporter \
  --display-name="Site traffic reporter"
GCP_ANALYTICS_SA="site-traffic-reporter@${GCP_ANALYTICS_PROJECT}.iam.gserviceaccount.com"
gcloud iam service-accounts describe "$GCP_ANALYTICS_SA"
```

Do not run any `keys create` command.

- [ ] **Step 4: Create repository-and-branch-restricted federation**

```bash
gcloud iam workload-identity-pools create github-actions \
  --location=global \
  --display-name="GitHub Actions"

gcloud iam workload-identity-pools providers create-oidc site-monitor \
  --location=global \
  --workload-identity-pool=github-actions \
  --display-name="pouya-parsa.github.io main" \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.ref=assertion.ref" \
  --attribute-condition="assertion.repository == 'pouya-parsa/pouya-parsa.github.io' && assertion.ref == 'refs/heads/main'"

GCP_ANALYTICS_POOL="$(gcloud iam workload-identity-pools describe github-actions \
  --location=global \
  --format='value(name)')"

gcloud iam service-accounts add-iam-policy-binding "$GCP_ANALYTICS_SA" \
  --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/${GCP_ANALYTICS_POOL}/attribute.repository/pouya-parsa/pouya-parsa.github.io"

GCP_ANALYTICS_PROVIDER="$(gcloud iam workload-identity-pools providers describe site-monitor \
  --location=global \
  --workload-identity-pool=github-actions \
  --format='value(name)')"
```

Inspect the provider and confirm the exact repository and `main` condition:

```bash
gcloud iam workload-identity-pools providers describe site-monitor \
  --location=global \
  --workload-identity-pool=github-actions
```

- [ ] **Step 5: Grant the service account restricted Search Console access**

In the verified `https://pouya-parsa.github.io/` Search Console property:

1. Open **Settings → Users and permissions**.
2. Select **Add user**.
3. Enter the value of `GCP_ANALYTICS_SA`.
4. Choose **Restricted** permission.
5. Save.

Restricted users can view the Performance report but cannot manage owners or
property settings.

- [ ] **Step 6: Create the read-only Cloudflare reporting token**

In Cloudflare:

1. Open **My Profile → API Tokens → Create Token → Create Custom Token**.
2. Name it `GitHub daily site analytics read`.
3. Set **Account → Account Analytics → Read**.
4. Restrict **Account Resources** to the account containing the Worker and Web
   Analytics site.
5. Create the token and keep the one-time value ready for the secure GitHub
   prompt.

Do not add Workers Scripts write, Account Settings write, or zone-edit
permissions.

- [ ] **Step 7: Store GitHub variables and the secret**

Confirm GitHub CLI authentication:

```bash
gh auth status
npx wrangler whoami --json > /tmp/pouya-wrangler-whoami.json
CLOUDFLARE_ACCOUNT_ID="$(
  node -e '
    const fs = require("node:fs");
    const data = JSON.parse(
      fs.readFileSync("/tmp/pouya-wrangler-whoami.json", "utf8")
    );
    const id = data.accounts?.[0]?.id;
    if (!/^[0-9a-f]{32}$/i.test(id ?? "")) process.exit(1);
    process.stdout.write(id);
  '
)"
printf "Paste the Web Analytics site_tag, then press Return: "
IFS= read -r CLOUDFLARE_WEB_ANALYTICS_SITE_TAG
test -n "$CLOUDFLARE_WEB_ANALYTICS_SITE_TAG"
```

Set non-secret variables:

```bash
gh variable set GCP_WORKLOAD_IDENTITY_PROVIDER \
  --body "$GCP_ANALYTICS_PROVIDER"
gh variable set GCP_SERVICE_ACCOUNT_EMAIL \
  --body "$GCP_ANALYTICS_SA"
gh variable set SEARCH_CONSOLE_SITE_URL \
  --body "https://pouya-parsa.github.io/"
gh variable set CLOUDFLARE_ACCOUNT_ID \
  --body "$CLOUDFLARE_ACCOUNT_ID"
gh variable set CLOUDFLARE_WEB_ANALYTICS_SITE_TAG \
  --body "$CLOUDFLARE_WEB_ANALYTICS_SITE_TAG"
gh variable set CLOUDFLARE_ANALYTICS_DATASET \
  --body "pouya_parsa_site_events"
```

For the secret, run the interactive command and paste the token only at its
hidden prompt:

```bash
gh secret set CLOUDFLARE_API_TOKEN
```

Use the authenticated account values and never print the API token.

- [ ] **Step 8: Verify names and federation without revealing values**

```bash
gh variable list
gh secret list
gcloud iam service-accounts keys list \
  --iam-account="$GCP_ANALYTICS_SA"
```

Expected:

- All six variable names are present.
- `CLOUDFLARE_API_TOKEN` is listed by name.
- The service account has no user-managed keys.

---

### Task 8: Add the credentialed workflow job and operating guide

**Files:**
- Modify: `.github/workflows/daily-site-monitor.yml`
- Modify: `tests/monitoring-config.test.mjs`
- Create: `docs/analytics.md`
- Modify: `docs/monitoring.md`

**Interfaces:**
- Consumes: GitHub variables/secrets from Task 7 and `npm run monitor:traffic`.
- Produces: a separate `traffic-report` job, Actions summary, 90-day artifact, clear gate, and credential runbook.

- [ ] **Step 1: Write failing workflow-policy assertions**

Update `tests/monitoring-config.test.mjs` so the workflow test asserts:

```js
assert.match(yaml, /traffic-report:/);
assert.match(
  yaml,
  /traffic-report:[\s\S]*permissions:\s*\n\s+contents: read\s*\n\s+id-token: write/
);
assert.match(yaml, /google-github-actions\/auth@v3/);
assert.match(yaml, /access_token_scopes:\s*https:\/\/www\.googleapis\.com\/auth\/webmasters\.readonly/);
assert.match(yaml, /secrets\.CLOUDFLARE_API_TOKEN/);
assert.equal(
  (yaml.match(/secrets\./g) ?? []).length,
  1,
  "only the read-only Cloudflare secret is allowed"
);
assert.match(yaml, /npm run monitor:traffic/);
assert.match(yaml, /traffic-report-\$\{\{ github\.run_id \}\}/);
assert.doesNotMatch(yaml, /issues: write|contents: write/);
```

Keep the assertions for schedule, manual dispatch, global
`contents: read`, `if: always()`, and 90-day retention.

- [ ] **Step 2: Run the workflow test and verify it fails**

Run:

```bash
node --test tests/monitoring-config.test.mjs
```

Expected: FAIL because the `traffic-report` job is absent.

- [ ] **Step 3: Add the separate traffic-report job**

Add a job with this structure to `.github/workflows/daily-site-monitor.yml`:

```yaml
  traffic-report:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    permissions:
      contents: read
      id-token: write

    steps:
      - name: Check out repository
        uses: actions/checkout@v6

      - name: Set up Node.js
        uses: actions/setup-node@v6
        with:
          node-version: "22"
          cache: npm

      - name: Install monitoring dependencies
        run: npm ci

      - name: Authenticate to Google
        id: google_auth
        continue-on-error: true
        uses: google-github-actions/auth@v3
        with:
          workload_identity_provider: ${{ vars.GCP_WORKLOAD_IDENTITY_PROVIDER }}
          service_account: ${{ vars.GCP_SERVICE_ACCOUNT_EMAIL }}
          token_format: access_token
          access_token_lifetime: 600s
          access_token_scopes: https://www.googleapis.com/auth/webmasters.readonly
          create_credentials_file: false

      - name: Build traffic report
        id: traffic
        if: always()
        continue-on-error: true
        env:
          GOOGLE_SEARCH_CONSOLE_TOKEN: ${{ steps.google_auth.outputs.access_token }}
          SEARCH_CONSOLE_SITE_URL: ${{ vars.SEARCH_CONSOLE_SITE_URL }}
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}
          CLOUDFLARE_WEB_ANALYTICS_SITE_TAG: ${{ vars.CLOUDFLARE_WEB_ANALYTICS_SITE_TAG }}
          CLOUDFLARE_ANALYTICS_DATASET: ${{ vars.CLOUDFLARE_ANALYTICS_DATASET }}
        run: npm run monitor:traffic

      - name: Publish traffic summary
        if: always()
        shell: bash
        run: |
          if [[ -f .monitoring/traffic-report.md ]]; then
            cat .monitoring/traffic-report.md >> "$GITHUB_STEP_SUMMARY"
          else
            echo "## Traffic and search performance" >> "$GITHUB_STEP_SUMMARY"
            echo "" >> "$GITHUB_STEP_SUMMARY"
            echo "**Overall: DATA UNAVAILABLE** — no report was produced." >> "$GITHUB_STEP_SUMMARY"
          fi

      - name: Upload traffic artifacts
        if: always()
        uses: actions/upload-artifact@v7
        with:
          name: traffic-report-${{ github.run_id }}
          path: |
            .monitoring/traffic-report.json
            .monitoring/traffic-report.md
          include-hidden-files: true
          if-no-files-found: warn
          retention-days: 90

      - name: Apply traffic-report gate
        if: always()
        shell: bash
        env:
          GOOGLE_AUTH: ${{ steps.google_auth.outcome }}
          TRAFFIC: ${{ steps.traffic.outcome }}
        run: |
          if [[ "$GOOGLE_AUTH" != "success" || "$TRAFFIC" != "success" ]]; then
            echo "Traffic reporting failed; the independent site-health job may still pass."
            exit 1
          fi
```

Do not add `needs: monitor`; the two jobs must remain independently
interpretable.

- [ ] **Step 4: Write the exact credential and metrics runbook**

Create `docs/analytics.md` with:

- Provider dashboard paths:
  - Search Console → **Performance → Search results**
  - Cloudflare → **Analytics & Logs → Web Analytics**
  - GitHub → **Actions → Daily SEO and GEO monitor**
- Definitions for clicks, impressions, CTR, average position, page views,
  approximate visits, action events, AI-assistant browser referrals, and p75
  Web Vitals.
- Search Console's normal 2–3 day lag and Pacific date labels.
- Cloudflare's previous complete UTC day and sampling note.
- The exact six variable names and one secret name.
- Search Console root-token and restricted-service-account steps.
- `gcloud` and `wrangler --use-keyring` login verification commands.
- Cloudflare token permission `Account Analytics: Read`.
- How to run and inspect the workflow manually.
- How to revoke/rotate the Cloudflare token, remove the Search Console user,
  disable the WIF provider, and run `wrangler logout`.
- A statement that AI referrals are browser referrals and that AI crawler
  counting requires a future custom domain/proxy.
- A statement that the implementation is designed without cookies or
  persistent identifiers but is not legal advice.

Update `docs/monitoring.md` with a short **Audience and search metrics**
section linking to `docs/analytics.md`.

- [ ] **Step 5: Verify workflow policy, documentation, and all tests**

Run:

```bash
node --test tests/monitoring-config.test.mjs
npm test
git diff --check
```

Expected: all tests PASS and `git diff --check` prints nothing.

- [ ] **Step 6: Commit workflow and documentation**

```bash
git add .github/workflows/daily-site-monitor.yml tests/monitoring-config.test.mjs docs/analytics.md docs/monitoring.md
git commit -m "feat: report daily search and audience metrics"
```

---

### Task 9: Complete production rollout and verify end to end

**Files:**
- Modify only if a production-only defect is found; use the same TDD cycle and a focused commit.

**Interfaces:**
- Consumes: all code, provider resources, GitHub variables/secrets, and the live GitHub Pages deployment.
- Produces: verified production beacons/actions, a successful daily traffic job, downloadable metrics artifacts, and provider dashboards receiving data.

- [ ] **Step 1: Run final local verification**

```bash
npm ci
npm test
npm run analytics:worker:dry-run
npm run analytics:worker:startup
npm run monitor:site
git diff --check
git status --short
```

Expected:

- All local tests pass.
- Worker dry-run/startup checks pass.
- Live-site audit passes.
- Only intended analytics files/commits and the unrelated untracked
  `main.tex` appear.

- [ ] **Step 2: Confirm the deployed Worker accepts and rejects correctly**

Send one aggregate test event using the exact deployed URL:

```bash
SITE_EVENTS_ENDPOINT="$(
  node -e '
    const fs = require("node:fs");
    const html = fs.readFileSync("index.html", "utf8");
    const match = html.match(
      /<meta\s+name="site-analytics-endpoint"\s+content="([^"]+)"/
    );
    if (!match) process.exit(1);
    process.stdout.write(match[1]);
  '
)"
case "$SITE_EVENTS_ENDPOINT" in
  https://*.workers.dev/event) ;;
  *) echo "Unexpected Worker endpoint"; exit 1 ;;
esac
curl --fail --include \
  --request POST \
  --header "Origin: https://pouya-parsa.github.io" \
  --header "Content-Type: application/json" \
  --data '{"event":"paper_pdf","pagePath":"/cloud-drive/"}' \
  "$SITE_EVENTS_ENDPOINT"
```

Expected: `202 Accepted`.

Repeat with `{"event":"page_view","pagePath":"/"}` and expect `400`. Confirm no
request body, IP, user agent, or referrer is logged by application code.

- [ ] **Step 3: Push implementation commits to main**

Review commits and push:

```bash
git log --oneline --decorate -12
git push origin main
```

Do not add or modify `main.tex`.

- [ ] **Step 4: Verify the live static deployment**

After GitHub Pages publishes, fetch both pages and the token:

```bash
curl --fail --silent https://pouya-parsa.github.io/ > /tmp/pouya-home.html
curl --fail --silent https://pouya-parsa.github.io/cloud-drive/ > /tmp/pouya-cloud-drive.html
curl --fail --silent https://pouya-parsa.github.io/googlec2d107d84ed0147d.html
rg "data-cf-beacon|site-analytics-endpoint|data-analytics-event" \
  /tmp/pouya-home.html /tmp/pouya-cloud-drive.html
```

Expected: both pages have one beacon, the same Worker endpoint, the intended
action annotations, and the root token has the exact Google content.

- [ ] **Step 5: Generate real browser data**

Open the homepage and article in a normal browser. Exercise:

- One interactive-article link
- One paper PDF link
- One CV link
- The GitHub profile link
- Copy citation

Use the browser Network panel to confirm:

- Cloudflare beacon requests are sent without a site cookie.
- Action requests contain only `event` and `pagePath`.
- The Worker responds `202`.

- [ ] **Step 6: Run the credentialed workflow manually**

```bash
gh workflow run daily-site-monitor.yml
gh run list --workflow daily-site-monitor.yml --limit 1
```

Watch the returned run:

```bash
gh run watch --exit-status
```

Expected:

- `monitor` passes independently.
- `traffic-report` authenticates through WIF.
- The job summary shows Google Search, Audience, High-value actions, and Data
  quality.
- A new low-traffic property may legitimately show zero Search Console rows;
  this is not an authentication error.

- [ ] **Step 7: Inspect artifacts and provider dashboards**

Download the run artifact:

```bash
TRAFFIC_RUN_ID="$(gh run list \
  --workflow daily-site-monitor.yml \
  --limit 1 \
  --json databaseId \
  --jq '.[0].databaseId')"
mkdir -p /tmp/pouya-traffic-artifact
gh run download "$TRAFFIC_RUN_ID" \
  --name "traffic-report-${TRAFFIC_RUN_ID}" \
  --dir /tmp/pouya-traffic-artifact
sed -n '1,240p' /tmp/pouya-traffic-artifact/traffic-report.md
```

Confirm:

- Source dates are explicit.
- Visits/actions are labeled approximate.
- AI assistants are labeled browser referrals.
- No secret, authorization header, raw unexpected response, or personal field
  is present.
- Search Console shows the verified property and service-account user.
- Cloudflare Web Analytics begins showing both page paths after processing.
- Analytics Engine shows the approved event names after processing.

- [ ] **Step 8: Re-run production performance checks**

Run the existing Lighthouse sequence:

```bash
npm run monitor:lighthouse:collect
npm run monitor:lighthouse:upload
npm run monitor:lighthouse:assert
npm run monitor:lighthouse:summary
```

Expected: existing SEO, accessibility, best-practices, performance, LCP, CLS,
and TBT thresholds still pass. If a deferred analytics script causes a
regression, write a failing content/performance regression test before
changing load behavior.

- [ ] **Step 9: Final security and status audit**

```bash
gcloud iam service-accounts keys list \
  --iam-account="$GCP_ANALYTICS_SA"
gh secret list
gh variable list
npx wrangler whoami
git status --short
```

Expected:

- No user-managed Google service-account key.
- One Cloudflare secret by name only.
- Six expected GitHub variables.
- Wrangler OAuth stored through the keychain.
- `main.tex` remains untouched and untracked.
