import test from "node:test";
import assert from "node:assert/strict";
import {
  collectSearchConsoleMetrics,
  querySearchAnalytics,
} from "../monitoring/search-console.mjs";
import {
  searchDaily,
  searchDates,
  searchPages,
  searchQueries,
  searchTrailing7,
} from "./fixtures/traffic-responses.mjs";

function createSearchConsoleFetch(overrides = {}) {
  const requests = [];
  const fetchImpl = async (url, options) => {
    const body = JSON.parse(options.body);
    requests.push({
      url,
      headers: options.headers,
      method: options.method,
      body,
    });

    let response;
    if (body.dimensions?.includes("date")) response = searchDates;
    else if (body.dimensions?.includes("page")) response = searchPages;
    else if (body.dimensions?.includes("query")) response = searchQueries;
    else if (body.startDate === body.endDate) {
      response = overrides.daily ?? searchDaily;
    } else {
      response = searchTrailing7;
    }

    return {
      ok: true,
      status: 200,
      async json() {
        return response;
      },
    };
  };
  return { fetchImpl, requests };
}

test("collector uses finalized data and provider aggregate rows", async () => {
  const { fetchImpl, requests } = createSearchConsoleFetch();
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
  assert.equal(
    metrics.topPages[0].page,
    "https://pouya-parsa.github.io/cloud-drive/"
  );
  assert.equal(metrics.topQueries[0].query, "cloud vla inference");
  assert.equal(requests.length, 5);
  assert.equal(
    requests[0].headers.authorization,
    "Bearer test-google-token"
  );
  assert.equal(requests[0].body.dataState, "all");
  assert.equal(requests[1].body.dataState, "final");
  assert.equal(requests[1].body.aggregationType, "byProperty");
  assert.equal(requests[3].body.aggregationType, "auto");
  assert.equal(requests[4].body.aggregationType, "byProperty");
});

test("empty aggregate responses become explicit zero-volume metrics", async () => {
  const { fetchImpl } = createSearchConsoleFetch({ daily: {} });
  const metrics = await collectSearchConsoleMetrics({
    accessToken: "test-google-token",
    siteUrl: "https://pouya-parsa.github.io/",
    now: new Date("2026-07-29T13:00:00Z"),
    fetchImpl,
  });

  assert.deepEqual(metrics.daily, {
    clicks: 0,
    impressions: 0,
    ctr: null,
    position: null,
  });
});

test("client encodes the property and sanitizes provider errors", async () => {
  let requestedUrl;
  await assert.rejects(
    querySearchAnalytics({
      accessToken: "secret-google-token",
      siteUrl: "sc-domain:pouya-parsa.github.io",
      body: { startDate: "2026-07-26", endDate: "2026-07-26" },
      fetchImpl: async (url) => {
        requestedUrl = url;
        return {
          ok: false,
          status: 403,
          async text() {
            return "secret-google-token provider details";
          },
        };
      },
    }),
    (error) => {
      assert.equal(error.message, "Search Console request failed (403)");
      assert.doesNotMatch(error.message, /secret|provider details/);
      return true;
    }
  );
  assert.match(requestedUrl, /sites\/sc-domain%3Apouya-parsa\.github\.io\//);
});
