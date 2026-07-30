const NOTES = [
  "Search Console dates use America/Los_Angeles and finalized data.",
  "Cloudflare dates use complete UTC days.",
  "Visits and action counts are approximate.",
  "AI assistants means browser referrals, not crawler requests.",
];

const ACTIONS = [
  ["paper_pdf", "Paper PDF"],
  ["interactive_article", "Interactive article"],
  ["cv", "CV"],
  ["github_profile", "GitHub profile"],
  ["copy_citation", "Copy citation"],
];

function sanitizeErrorMessage(source, reason) {
  const message = String(reason?.message ?? "");
  const allowedProviderMessage =
    /^(?:Search Console|Cloudflare Analytics(?: Engine)?) (?:request failed(?: \((?:\d{3}|network)\))?|account unavailable|credentials are not configured)$/;
  const allowedConfiguration =
    /^Missing configuration: [A-Z][A-Z0-9_]*(?:, [A-Z][A-Z0-9_]*)*$/;
  if (
    allowedProviderMessage.test(message) ||
    allowedConfiguration.test(message)
  ) {
    return message;
  }
  return `${source} unavailable`;
}

function unavailableProvider(source, reason) {
  return {
    status: "unavailable",
    error: {
      source,
      message: sanitizeErrorMessage(source, reason),
    },
  };
}

export function buildTrafficReport({
  generatedAt,
  searchResult,
  cloudflareResult,
}) {
  const search =
    searchResult.status === "fulfilled"
      ? { status: "available", ...searchResult.value }
      : unavailableProvider("Google Search Console", searchResult.reason);

  let audience;
  let actions;
  if (cloudflareResult.status === "fulfilled") {
    const { windows, audience: audienceValue, actions: actionsValue } =
      cloudflareResult.value;
    audience = { status: "available", windows, ...audienceValue };
    actions = { status: "available", windows, ...actionsValue };
  } else {
    const unavailable = unavailableProvider(
      "Cloudflare Analytics",
      cloudflareResult.reason
    );
    audience = unavailable;
    actions = { ...unavailable, error: { ...unavailable.error } };
  }

  const errors = [];
  if (search.status === "unavailable") errors.push(search.error);
  if (audience.status === "unavailable") errors.push(audience.error);

  return {
    generatedAt: new Date(generatedAt).toISOString(),
    status: errors.length === 0 ? "pass" : "unavailable",
    search,
    audience,
    actions,
    errors,
    notes: [...NOTES],
  };
}

const escapeCell = (value) =>
  String(value ?? "")
    .replaceAll("|", "\\|")
    .replaceAll("\r", " ")
    .replaceAll("\n", " ");

function formatNumber(value, options = {}) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) {
    return "—";
  }
  return new Intl.NumberFormat("en-US", options).format(Number(value));
}

function formatCtr(value) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) {
    return "—";
  }
  return `${(Number(value) * 100).toFixed(2)}%`;
}

function formatPosition(value) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) {
    return "—";
  }
  return Number(value).toFixed(1);
}

function pushSearchTable(lines, search) {
  lines.push(
    `Finalized through **${escapeCell(search.latestFinalizedDate)}**.`,
    "",
    "| Period | Clicks | Impressions | CTR | Avg. position |",
    "| --- | ---: | ---: | ---: | ---: |",
    `| ${escapeCell(search.latestFinalizedDate)} | ` +
      `${formatNumber(search.daily.clicks)} | ` +
      `${formatNumber(search.daily.impressions)} | ` +
      `${formatCtr(search.daily.ctr)} | ` +
      `${formatPosition(search.daily.position)} |`,
    `| ${escapeCell(search.trailing7.startDate)} to ` +
      `${escapeCell(search.trailing7.endDate)} | ` +
      `${formatNumber(search.trailing7.clicks)} | ` +
      `${formatNumber(search.trailing7.impressions)} | ` +
      `${formatCtr(search.trailing7.ctr)} | ` +
      `${formatPosition(search.trailing7.position)} |`,
    "",
    "#### Top search pages (finalized seven-day window)",
    "",
    "| Page | Clicks | Impressions | CTR | Avg. position |",
    "| --- | ---: | ---: | ---: | ---: |"
  );

  if (search.topPages.length === 0) {
    lines.push("| No rows returned | — | — | — | — |");
  } else {
    for (const row of search.topPages) {
      lines.push(
        `| ${escapeCell(row.page)} | ${formatNumber(row.clicks)} | ` +
          `${formatNumber(row.impressions)} | ${formatCtr(row.ctr)} | ` +
          `${formatPosition(row.position)} |`
      );
    }
  }

  lines.push(
    "",
    "#### Top search queries (finalized seven-day window)",
    "",
    "| Query | Clicks | Impressions | CTR | Avg. position |",
    "| --- | ---: | ---: | ---: | ---: |"
  );
  if (search.topQueries.length === 0) {
    lines.push("| No rows returned | — | — | — | — |");
  } else {
    for (const row of search.topQueries) {
      lines.push(
        `| ${escapeCell(row.query)} | ${formatNumber(row.clicks)} | ` +
          `${formatNumber(row.impressions)} | ${formatCtr(row.ctr)} | ` +
          `${formatPosition(row.position)} |`
      );
    }
  }
}

function referralLabel(category) {
  return category === "AI assistants"
    ? "AI-assistant browser referrals"
    : category;
}

function pushAudienceTable(lines, audience) {
  lines.push(
    `Complete UTC windows: **${escapeCell(audience.windows.daily.label)}** ` +
      `and **${escapeCell(audience.windows.trailing7.label)}**.`,
    "",
    "| Period | Pageviews | Approx. visits |",
    "| --- | ---: | ---: |",
    `| ${escapeCell(audience.windows.daily.label)} | ` +
      `${formatNumber(audience.daily.pageViews)} | ` +
      `${formatNumber(audience.daily.visits)} |`,
    `| ${escapeCell(audience.windows.trailing7.label)} | ` +
      `${formatNumber(audience.trailing7.pageViews)} | ` +
      `${formatNumber(audience.trailing7.visits)} |`,
    "",
    "#### Referral mix (trailing seven-day window)",
    "",
    "| Referral category | Pageviews | Approx. visits |",
    "| --- | ---: | ---: |"
  );

  if (audience.trailing7.referrerCategories.length === 0) {
    lines.push("| No rows returned | — | — |");
  } else {
    for (const row of audience.trailing7.referrerCategories) {
      lines.push(
        `| ${escapeCell(referralLabel(row.category))} | ` +
          `${formatNumber(row.pageViews)} | ${formatNumber(row.visits)} |`
      );
    }
  }

  lines.push(
    "",
    "#### Top pages (trailing seven-day window)",
    "",
    "| Path | Pageviews | Approx. visits |",
    "| --- | ---: | ---: |"
  );
  if (audience.trailing7.topPaths.length === 0) {
    lines.push("| No rows returned | — | — |");
  } else {
    for (const row of audience.trailing7.topPaths) {
      lines.push(
        `| ${escapeCell(row.path)} | ${formatNumber(row.pageViews)} | ` +
          `${formatNumber(row.visits)} |`
      );
    }
  }

  const vitals = audience.trailing7.webVitals;
  lines.push("", "#### Real-user Core Web Vitals (p75)", "");
  if (vitals.status === "available") {
    lines.push(
      "| Samples | LCP | INP | CLS |",
      "| ---: | ---: | ---: | ---: |",
      `| ${formatNumber(vitals.sampleCount)} | ` +
        `${formatNumber(vitals.lcpP75Ms)} ms | ` +
        `${formatNumber(vitals.inpP75Ms)} ms | ` +
        `${formatNumber(vitals.clsP75, { maximumFractionDigits: 3 })} |`
    );
  } else {
    lines.push(
      `Unavailable until at least 75 samples are present ` +
        `(current sample count: ${formatNumber(vitals.sampleCount)}).`
    );
  }
}

function actionCount(window, eventName) {
  if (window.state !== "available") return null;
  return window.events
    .filter((event) => event.event === eventName)
    .reduce((total, event) => total + Number(event.count ?? 0), 0);
}

function pushActionsTable(lines, actions) {
  lines.push(
    "| Action | Previous UTC day | Trailing seven days |",
    "| --- | ---: | ---: |"
  );
  for (const [eventName, label] of ACTIONS) {
    lines.push(
      `| ${label} | ${formatNumber(actionCount(actions.daily, eventName))} | ` +
        `${formatNumber(actionCount(actions.trailing7, eventName))} |`
    );
  }
  if (
    actions.daily.state === "no-data-yet" ||
    actions.trailing7.state === "no-data-yet"
  ) {
    lines.push(
      "",
      "The action dataset is connected and waiting for its first production events."
    );
  }
}

function providerError(report, source) {
  return report.errors.find((error) => error.source === source)?.message;
}

export function renderTrafficReportMarkdown(report) {
  const overall =
    report.status === "pass" ? "PASS" : "DATA UNAVAILABLE";
  const lines = [
    "## Traffic and search performance",
    "",
    `**Overall: ${overall}**`,
    "",
    `Generated: ${escapeCell(report.generatedAt)}`,
    "",
    "### Google Search",
    "",
  ];

  if (report.search.status === "available") {
    pushSearchTable(lines, report.search);
  } else {
    lines.push(
      `**DATA UNAVAILABLE** — ${escapeCell(
        providerError(report, "Google Search Console")
      )}`
    );
  }

  lines.push("", "### Audience", "");
  if (report.audience.status === "available") {
    pushAudienceTable(lines, report.audience);
  } else {
    lines.push(
      `**DATA UNAVAILABLE** — ${escapeCell(
        providerError(report, "Cloudflare Analytics")
      )}`
    );
  }

  lines.push("", "### High-value actions", "");
  if (report.actions.status === "available") {
    pushActionsTable(lines, report.actions);
  } else {
    lines.push(
      `**DATA UNAVAILABLE** — ${escapeCell(
        providerError(report, "Cloudflare Analytics")
      )}`
    );
  }

  lines.push("", "### Data quality", "");
  for (const note of report.notes) lines.push(`- ${escapeCell(note)}`);
  if (report.errors.length > 0) {
    lines.push(
      "",
      "| Unavailable source | Message |",
      "| --- | --- |"
    );
    for (const error of report.errors) {
      lines.push(
        `| ${escapeCell(error.source)} | ${escapeCell(error.message)} |`
      );
    }
  }

  return `${lines.join("\n")}\n`;
}
