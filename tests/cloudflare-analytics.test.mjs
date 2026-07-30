import test from "node:test";
import assert from "node:assert/strict";
import {
  buildActionsSql,
  classifyReferrerHost,
  collectCloudflareMetrics,
  scaleRumCount,
} from "../monitoring/cloudflare-analytics.mjs";
import {
  cloudflareActions,
  cloudflareRum,
} from "./fixtures/traffic-responses.mjs";

test("Cloudflare helpers normalize sampling and referral categories", () => {
  assert.equal(classifyReferrerHost("chatgpt.com"), "AI assistants");
  assert.equal(classifyReferrerHost("www.perplexity.ai"), "AI assistants");
  assert.equal(classifyReferrerHost("www.google.com"), "Search engines");
  assert.equal(classifyReferrerHost(""), "Direct / unknown");
  assert.equal(classifyReferrerHost("news.example"), "Other");
  assert.equal(scaleRumCount({ count: 7, avg: { sampleInterval: 10 } }), 70);
});

test("action SQL accounts for sampling and rejects unsafe datasets", () => {
  const sql = buildActionsSql({
    dataset: "pouya_parsa_site_events",
    start: "2026-07-22T00:00:00Z",
    end: "2026-07-29T00:00:00Z",
  });
  assert.match(sql, /SUM\(_sample_interval \* double1\) AS count/);
  assert.match(sql, /FROM pouya_parsa_site_events/);
  assert.match(
    sql,
    /timestamp >= toDateTime\('2026-07-22 00:00:00'\)/
  );
  assert.throws(
    () =>
      buildActionsSql({
        dataset: "events; DROP TABLE events",
        start: "2026-07-22T00:00:00Z",
        end: "2026-07-29T00:00:00Z",
      }),
    /Invalid Analytics Engine dataset/
  );
});

test("collector returns audience, vitals, referrals, and actions", async () => {
  const requests = [];
  const fetchImpl = async (url, options) => {
    requests.push({ url, options });
    const data = url.endsWith("/graphql")
      ? cloudflareRum
      : cloudflareActions;
    return {
      ok: true,
      status: 200,
      async json() {
        return data;
      },
    };
  };

  const metrics = await collectCloudflareMetrics({
    apiToken: "test-cloudflare-token",
    accountId: "0123456789abcdef0123456789abcdef",
    siteTag: "1efc801764be44e48d702cdc871fa8d4",
    dataset: "pouya_parsa_site_events",
    now: new Date("2026-07-29T13:00:00Z"),
    fetchImpl,
  });

  assert.equal(metrics.audience.daily.pageViews, 12);
  assert.equal(metrics.audience.daily.visits, 8);
  assert.deepEqual(metrics.audience.daily.referrerCategories[0], {
    category: "Search engines",
    pageViews: 4,
    visits: 3,
  });
  assert.deepEqual(
    metrics.audience.daily.referrerCategories.find(
      ({ category }) => category === "AI assistants"
    ),
    { category: "AI assistants", pageViews: 3, visits: 2 }
  );
  assert.deepEqual(metrics.audience.daily.webVitals, {
    status: "available",
    sampleCount: 100,
    lcpP75Ms: 1350,
    inpP75Ms: 120,
    clsP75: 0.01,
  });
  assert.equal(metrics.actions.daily.state, "available");
  assert.equal(metrics.actions.daily.total, 6);
  assert.equal(metrics.actions.daily.events[0].event, "paper_pdf");
  assert.equal(requests.length, 4);
  assert.match(
    requests[0].options.headers.authorization,
    /^Bearer test-cloudflare-token$/
  );
});

test("Web Vitals stay unavailable below the privacy threshold", async () => {
  const sparseRum = structuredClone(cloudflareRum);
  sparseRum.data.viewer.accounts[0].webVitals[0].count = 74;
  const fetchImpl = async (url) => ({
    ok: true,
    status: 200,
    async json() {
      return url.endsWith("/graphql") ? sparseRum : cloudflareActions;
    },
  });

  const metrics = await collectCloudflareMetrics({
    apiToken: "test-cloudflare-token",
    accountId: "0123456789abcdef0123456789abcdef",
    siteTag: "1efc801764be44e48d702cdc871fa8d4",
    dataset: "pouya_parsa_site_events",
    now: new Date("2026-07-29T13:00:00Z"),
    fetchImpl,
  });

  assert.deepEqual(metrics.audience.daily.webVitals, {
    status: "unavailable",
    reason: "insufficient-sample",
    sampleCount: 74,
  });
});

test("authenticated missing action data is a valid empty state", async () => {
  const fetchImpl = async (url) => {
    if (url.endsWith("/graphql")) {
      return {
        ok: true,
        status: 200,
        async json() {
          return cloudflareRum;
        },
      };
    }
    return {
      ok: false,
      status: 404,
      async json() {
        return { error: "Table pouya_parsa_site_events does not exist" };
      },
    };
  };

  const metrics = await collectCloudflareMetrics({
    apiToken: "test-cloudflare-token",
    accountId: "0123456789abcdef0123456789abcdef",
    siteTag: "1efc801764be44e48d702cdc871fa8d4",
    dataset: "pouya_parsa_site_events",
    now: new Date("2026-07-29T13:00:00Z"),
    fetchImpl,
  });

  assert.deepEqual(metrics.actions.daily, {
    state: "no-data-yet",
    total: 0,
    events: [],
  });
});

test("GraphQL provider errors are sanitized", async () => {
  const fetchImpl = async () => ({
    ok: true,
    status: 200,
    async json() {
      return {
        errors: [{ message: "test-cloudflare-token internal provider detail" }],
      };
    },
  });

  await assert.rejects(
    collectCloudflareMetrics({
      apiToken: "test-cloudflare-token",
      accountId: "0123456789abcdef0123456789abcdef",
      siteTag: "1efc801764be44e48d702cdc871fa8d4",
      dataset: "pouya_parsa_site_events",
      now: new Date("2026-07-29T13:00:00Z"),
      fetchImpl,
    }),
    (error) => {
      assert.equal(error.message, "Cloudflare Analytics request failed");
      assert.doesNotMatch(error.message, /token|provider detail/);
      return true;
    }
  );
});
