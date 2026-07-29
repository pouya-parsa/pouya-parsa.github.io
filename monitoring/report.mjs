export function summarizeChecks(checks) {
  const counts = { pass: 0, warn: 0, fail: 0 };

  for (const item of checks) {
    counts[item.status] += 1;
  }

  return {
    status: counts.fail > 0 ? "fail" : "pass",
    ...counts,
  };
}

const escapeCell = (value) =>
  String(value ?? "").replaceAll("|", "\\|").replaceAll("\n", " ");

export function renderSiteAuditMarkdown(report) {
  const ordered = [...report.checks].sort((left, right) => {
    const rank = { fail: 0, warn: 1, pass: 2 };
    return (
      rank[left.status] - rank[right.status] ||
      left.id.localeCompare(right.id)
    );
  });
  const lines = [
    "## Live-site audit",
    "",
    `**Overall: ${report.summary.status.toUpperCase()}** — ` +
      `${report.summary.pass} passed, ${report.summary.warn} warnings, ` +
      `${report.summary.fail} failed.`,
    "",
    "| Status | Check | URL | Detail |",
    "| --- | --- | --- | --- |",
  ];

  for (const item of ordered) {
    lines.push(
      `| ${item.status.toUpperCase()} | ${escapeCell(item.id)} | ` +
        `${escapeCell(item.url)} | ${escapeCell(item.message)} |`
    );
  }

  if ((report.externalUrls ?? []).length > 0) {
    lines.push("", "### External links (reported, not fetched)", "");
    for (const url of report.externalUrls) {
      lines.push(`- ${url}`);
    }
  }

  return `${lines.join("\n")}\n`;
}
