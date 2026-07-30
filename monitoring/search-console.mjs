import {
  pacificDate,
  selectLatestFinalizedDate,
  shiftDate,
} from "./traffic-dates.mjs";

function aggregateMetrics(response) {
  const row = response?.rows?.[0];
  if (!row) {
    return {
      clicks: 0,
      impressions: 0,
      ctr: null,
      position: null,
    };
  }

  return {
    clicks: row.clicks ?? 0,
    impressions: row.impressions ?? 0,
    ctr: row.ctr ?? null,
    position: row.position ?? null,
  };
}

function dimensionRows(response, dimensionName) {
  return (response?.rows ?? []).map((row) => ({
    [dimensionName]: row.keys?.[0] ?? "",
    clicks: row.clicks ?? 0,
    impressions: row.impressions ?? 0,
    ctr: row.ctr ?? null,
    position: row.position ?? null,
  }));
}

export async function querySearchAnalytics({
  accessToken,
  siteUrl,
  body,
  fetchImpl = globalThis.fetch,
}) {
  if (!accessToken || !siteUrl || typeof fetchImpl !== "function") {
    throw new Error("Search Console credentials are not configured");
  }

  const endpoint =
    "https://www.googleapis.com/webmasters/v3/sites/" +
    `${encodeURIComponent(siteUrl)}/searchAnalytics/query`;

  let response;
  try {
    response = await fetchImpl(endpoint, {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Search Console request failed (network)");
  }

  if (!response.ok) {
    throw new Error(`Search Console request failed (${response.status})`);
  }
  return response.json();
}

export async function collectSearchConsoleMetrics({
  accessToken,
  siteUrl,
  now = new Date(),
  fetchImpl = globalThis.fetch,
}) {
  const currentPacificDate = pacificDate(now);
  const common = { type: "web" };
  const dates = await querySearchAnalytics({
    accessToken,
    siteUrl,
    fetchImpl,
    body: {
      ...common,
      startDate: shiftDate(currentPacificDate, -13),
      endDate: currentPacificDate,
      dimensions: ["date"],
      dataState: "all",
      rowLimit: 14,
    },
  });

  const latestFinalizedDate = selectLatestFinalizedDate(dates, now);
  const trailing7StartDate = shiftDate(latestFinalizedDate, -6);
  const finalizedAggregate = {
    ...common,
    dataState: "final",
    aggregationType: "byProperty",
  };

  const [dailyResponse, trailing7Response, pagesResponse, queriesResponse] =
    await Promise.all([
      querySearchAnalytics({
        accessToken,
        siteUrl,
        fetchImpl,
        body: {
          ...finalizedAggregate,
          startDate: latestFinalizedDate,
          endDate: latestFinalizedDate,
        },
      }),
      querySearchAnalytics({
        accessToken,
        siteUrl,
        fetchImpl,
        body: {
          ...finalizedAggregate,
          startDate: trailing7StartDate,
          endDate: latestFinalizedDate,
        },
      }),
      querySearchAnalytics({
        accessToken,
        siteUrl,
        fetchImpl,
        body: {
          ...common,
          startDate: trailing7StartDate,
          endDate: latestFinalizedDate,
          dimensions: ["page"],
          dataState: "final",
          aggregationType: "auto",
          rowLimit: 10,
        },
      }),
      querySearchAnalytics({
        accessToken,
        siteUrl,
        fetchImpl,
        body: {
          ...finalizedAggregate,
          startDate: trailing7StartDate,
          endDate: latestFinalizedDate,
          dimensions: ["query"],
          rowLimit: 10,
        },
      }),
    ]);

  return {
    latestFinalizedDate,
    daily: aggregateMetrics(dailyResponse),
    trailing7: {
      startDate: trailing7StartDate,
      endDate: latestFinalizedDate,
      ...aggregateMetrics(trailing7Response),
    },
    topPages: dimensionRows(pagesResponse, "page"),
    topQueries: dimensionRows(queriesResponse, "query"),
  };
}
