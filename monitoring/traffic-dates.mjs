const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function shiftDate(date, days) {
  if (!DATE_PATTERN.test(date) || !Number.isInteger(days)) {
    throw new TypeError("Expected an ISO date and an integer day offset");
  }

  const [year, month, day] = date.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  return shifted.toISOString().slice(0, 10);
}

export function pacificDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const values = Object.fromEntries(
    parts.filter(({ type }) => type !== "literal").map(({ type, value }) => [
      type,
      value,
    ])
  );
  return `${values.year}-${values.month}-${values.day}`;
}

export function cloudflareWindows(now = new Date()) {
  const currentUtcDate = now.toISOString().slice(0, 10);
  const dailyDate = shiftDate(currentUtcDate, -1);
  const trailing7Start = shiftDate(currentUtcDate, -7);

  return {
    daily: {
      start: `${dailyDate}T00:00:00Z`,
      end: `${currentUtcDate}T00:00:00Z`,
      label: dailyDate,
    },
    trailing7: {
      start: `${trailing7Start}T00:00:00Z`,
      end: `${currentUtcDate}T00:00:00Z`,
      label: `${trailing7Start} to ${dailyDate}`,
    },
  };
}

export function selectLatestFinalizedDate(response, now = new Date()) {
  const firstIncompleteDate = response?.metadata?.first_incomplete_date;
  if (firstIncompleteDate) return shiftDate(firstIncompleteDate, -1);
  return shiftDate(pacificDate(now), -1);
}
