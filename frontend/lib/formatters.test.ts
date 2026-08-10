import { describe, expect, it } from "vitest";

import {
  formatCompactNumber,
  formatDate,
  formatDateTime,
  formatFullDate,
  formatRelativeTime,
  formatTime,
} from "./formatters";

describe("formatCompactNumber", () => {
  it("shortens thousands and millions", () => {
    expect(formatCompactNumber(1240)).toBe("1.2K");
    expect(formatCompactNumber(2_000_000)).toBe("2M");
  });

  it("leaves small numbers intact", () => {
    expect(formatCompactNumber(42)).toBe("42");
  });
});

describe("date formatters", () => {
  const iso = "2026-07-23T14:30:00.000Z";

  it("formats a short date", () => {
    expect(formatDate(iso)).toBe("Jul 23, 2026");
  });

  it("formats a full, spelled-out date", () => {
    expect(formatFullDate(iso)).toBe("Thursday, July 23, 2026");
  });

  it("includes the time in a date-time", () => {
    expect(formatDateTime(iso)).toMatch(/Jul 23, 2026/);
    expect(formatDateTime(iso)).toMatch(/\d{1,2}:\d{2}/);
  });

  it("formats just the time, with no date", () => {
    expect(formatTime(iso)).toMatch(/^\d{1,2}:\d{2}\s?[AP]M$/);
  });
});

describe("formatRelativeTime", () => {
  const now = new Date("2026-07-23T12:00:00.000Z").getTime();

  it("describes past times", () => {
    expect(formatRelativeTime("2026-07-23T10:00:00.000Z", now)).toBe(
      "2 hours ago",
    );
    expect(formatRelativeTime("2026-07-21T12:00:00.000Z", now)).toBe(
      "2 days ago",
    );
  });

  it("describes future times", () => {
    expect(formatRelativeTime("2026-07-23T15:00:00.000Z", now)).toBe(
      "in 3 hours",
    );
    expect(formatRelativeTime("2026-07-26T12:00:00.000Z", now)).toBe(
      "in 3 days",
    );
  });

  it("uses 'auto' phrasing for the immediate day boundary", () => {
    expect(formatRelativeTime("2026-07-24T12:00:00.000Z", now)).toBe(
      "tomorrow",
    );
    expect(formatRelativeTime("2026-07-22T12:00:00.000Z", now)).toBe(
      "yesterday",
    );
  });
});
