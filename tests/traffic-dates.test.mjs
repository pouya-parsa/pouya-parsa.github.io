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

test("latest finalized Search Console date falls back to prior Pacific day", () => {
  assert.equal(
    selectLatestFinalizedDate({}, new Date("2026-07-29T06:30:00Z")),
    "2026-07-27"
  );
});
