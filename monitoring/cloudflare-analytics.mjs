import { cloudflareWindows } from "./traffic-dates.mjs";

const GRAPHQL_ENDPOINT = "https://api.cloudflare.com/client/v4/graphql";
const DATASET_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;
const ISO_INSTANT_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
const ALLOWED_ACTION_EVENTS = new Set([
  "paper_pdf",
  "interactive_article",
  "cv",
  "github_profile",
  "copy_citation",
]);

const REFERRER_DOMAINS = new Map([
  [
    "AI assistants",
    [
      "chatgpt.com",
      "chat.openai.com",
      "perplexity.ai",
      "claude.ai",
      "gemini.google.com",
      "copilot.microsoft.com",
    ],
  ],
  [
    "Search engines",
    ["google.com", "bing.com", "duckduckgo.com", "yahoo.com"],
  ],
  [
    "Social / developer",
    ["github.com", "linkedin.com", "x.com", "twitter.com"],
  ],
]);

const RUM_QUERY = `
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
}`;

function hostMatches(host, domain) {
  return host === domain || host.endsWith(`.${domain}`);
}

export function classifyReferrerHost(referrerHost) {
  const host = String(referrerHost ?? "")
    .trim()
    .toLowerCase()
    .replace(/^www\./, "");
  if (!host) return "Direct / unknown";

  for (const [category, domains] of REFERRER_DOMAINS) {
    if (domains.some((domain) => hostMatches(host, domain))) return category;
  }
  return "Other";
}

export function scaleRumCount(group) {
  const count = Number(group?.count ?? 0);
  const sampleInterval = Number(group?.avg?.sampleInterval ?? 1);
  if (!Number.isFinite(count) || !Number.isFinite(sampleInterval)) return 0;
  return count * sampleInterval;
}

function normalizeInstant(instant) {
  if (!ISO_INSTANT_PATTERN.test(instant)) {
    throw new TypeError("Invalid Analytics Engine time window");
  }
  return instant.replace("T", " ").replace(/\.\d{3}Z$|Z$/, "");
}

export function buildActionsSql({ dataset, start, end }) {
  if (!DATASET_PATTERN.test(dataset ?? "")) {
    throw new TypeError("Invalid Analytics Engine dataset");
  }
  const sqlStart = normalizeInstant(start);
  const sqlEnd = normalizeInstant(end);

  return `SELECT
  blob1 AS event,
  blob2 AS page_path,
  SUM(_sample_interval * double1) AS count
FROM ${dataset}
WHERE timestamp >= toDateTime('${sqlStart}')
  AND timestamp < toDateTime('${sqlEnd}')
GROUP BY event, page_path
ORDER BY count DESC
FORMAT JSON`;
}

function normalizeWebVitals(groups) {
  const group = groups?.[0];
  const sampleCount = Number(group?.count ?? 0);
  if (sampleCount < 75) {
    return {
      status: "unavailable",
      reason: "insufficient-sample",
      sampleCount,
    };
  }

  const quantiles = group?.quantiles ?? {};
  return {
    status: "available",
    sampleCount,
    lcpP75Ms: quantiles.largestContentfulPaintP75 ?? null,
    inpP75Ms: quantiles.interactionToNextPaintP75 ?? null,
    clsP75: quantiles.cumulativeLayoutShiftP75 ?? null,
  };
}

function normalizeDimensionGroups(groups, sourceField, outputField) {
  return (groups ?? []).map((group) => ({
    [outputField]: group?.dimensions?.[sourceField] ?? "",
    pageViews: scaleRumCount(group),
    visits: Number(group?.sum?.visits ?? 0),
  }));
}

function groupReferrers(groups) {
  const categories = new Map();
  for (const group of groups ?? []) {
    const category = classifyReferrerHost(group?.dimensions?.refererHost);
    const current = categories.get(category) ?? {
      category,
      pageViews: 0,
      visits: 0,
    };
    current.pageViews += scaleRumCount(group);
    current.visits += Number(group?.sum?.visits ?? 0);
    categories.set(category, current);
  }
  return [...categories.values()].sort(
    (left, right) =>
      right.pageViews - left.pageViews ||
      left.category.localeCompare(right.category)
  );
}

function normalizeAudience(account) {
  const total = account.total?.[0];
  return {
    pageViews: scaleRumCount(total),
    visits: Number(total?.sum?.visits ?? 0),
    topPaths: normalizeDimensionGroups(
      account.topPaths,
      "requestPath",
      "path"
    ),
    topReferrers: normalizeDimensionGroups(
      account.topReferrers,
      "refererHost",
      "host"
    ),
    referrerCategories: groupReferrers(account.topReferrers),
    countries: normalizeDimensionGroups(
      account.countries,
      "countryName",
      "country"
    ),
    devices: normalizeDimensionGroups(
      account.devices,
      "deviceType",
      "device"
    ),
    webVitals: normalizeWebVitals(account.webVitals),
  };
}

async function queryRum({
  apiToken,
  accountId,
  siteTag,
  window,
  fetchImpl,
}) {
  let response;
  try {
    response = await fetchImpl(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        query: RUM_QUERY,
        variables: {
          accountTag: accountId,
          siteTag,
          start: window.start,
          end: window.end,
        },
      }),
    });
  } catch {
    throw new Error("Cloudflare Analytics request failed (network)");
  }

  if (!response.ok) {
    throw new Error(`Cloudflare Analytics request failed (${response.status})`);
  }
  const payload = await response.json();
  if (payload?.errors?.length) {
    throw new Error("Cloudflare Analytics request failed");
  }
  const account = payload?.data?.viewer?.accounts?.[0];
  if (!account) throw new Error("Cloudflare Analytics account unavailable");
  return normalizeAudience(account);
}

async function readErrorPayload(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function isMissingDataset(response, payload) {
  if (response.status !== 404) return false;
  return /(?:table|dataset).*(?:not exist|not found)|unknown table/i.test(
    JSON.stringify(payload ?? {})
  );
}

function normalizeActions(payload) {
  const events = (payload?.data ?? [])
    .filter((row) => ALLOWED_ACTION_EVENTS.has(row?.event))
    .map((row) => {
      const count = Number(row.count ?? 0);
      return {
        event: row.event,
        pagePath: row.page_path ?? "",
        count: Number.isFinite(count) ? count : 0,
      };
    });
  return {
    state: "available",
    total: events.reduce((total, event) => total + event.count, 0),
    events,
  };
}

async function queryActions({
  apiToken,
  accountId,
  dataset,
  window,
  fetchImpl,
}) {
  const endpoint =
    `https://api.cloudflare.com/client/v4/accounts/${accountId}` +
    "/analytics_engine/sql";
  let response;
  try {
    response = await fetchImpl(endpoint, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiToken}`,
        "content-type": "text/plain",
      },
      body: buildActionsSql({
        dataset,
        start: window.start,
        end: window.end,
      }),
    });
  } catch {
    throw new Error("Cloudflare Analytics Engine request failed (network)");
  }

  if (!response.ok) {
    const payload = await readErrorPayload(response);
    if (isMissingDataset(response, payload)) {
      return { state: "no-data-yet", total: 0, events: [] };
    }
    throw new Error(
      `Cloudflare Analytics Engine request failed (${response.status})`
    );
  }
  return normalizeActions(await response.json());
}

export async function collectCloudflareMetrics({
  apiToken,
  accountId,
  siteTag,
  dataset,
  now = new Date(),
  fetchImpl = globalThis.fetch,
}) {
  if (
    !apiToken ||
    !/^[0-9a-f]{32}$/i.test(accountId ?? "") ||
    !/^[0-9a-f]{32}$/i.test(siteTag ?? "") ||
    !DATASET_PATTERN.test(dataset ?? "") ||
    typeof fetchImpl !== "function"
  ) {
    throw new Error("Cloudflare Analytics credentials are not configured");
  }

  const windows = cloudflareWindows(now);
  const [dailyAudience, trailing7Audience, dailyActions, trailing7Actions] =
    await Promise.all([
      queryRum({
        apiToken,
        accountId,
        siteTag,
        window: windows.daily,
        fetchImpl,
      }),
      queryRum({
        apiToken,
        accountId,
        siteTag,
        window: windows.trailing7,
        fetchImpl,
      }),
      queryActions({
        apiToken,
        accountId,
        dataset,
        window: windows.daily,
        fetchImpl,
      }),
      queryActions({
        apiToken,
        accountId,
        dataset,
        window: windows.trailing7,
        fetchImpl,
      }),
    ]);

  return {
    windows,
    audience: {
      daily: dailyAudience,
      trailing7: trailing7Audience,
    },
    actions: {
      daily: dailyActions,
      trailing7: trailing7Actions,
    },
  };
}
