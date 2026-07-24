import { describe, expect, it } from "vitest";

import {
  buildNotificationFilterChips,
  parseNotificationFilters,
} from "./notificationFilters";

describe("parseNotificationFilters", () => {
  it("defaults page to 1 and pageSize to 10", () => {
    expect(parseNotificationFilters({})).toMatchObject({
      page: 1,
      pageSize: 10,
    });
  });

  it("clamps an invalid page to 1", () => {
    expect(parseNotificationFilters({ page: "-5" })).toMatchObject({
      page: 1,
    });
    expect(parseNotificationFilters({ page: "not-a-number" })).toMatchObject({
      page: 1,
    });
  });

  it("only accepts an allow-listed page size", () => {
    expect(parseNotificationFilters({ pageSize: "25" })).toMatchObject({
      pageSize: 25,
    });
    expect(parseNotificationFilters({ pageSize: "999" })).toMatchObject({
      pageSize: 10,
    });
  });

  it("passes through a valid status, category, and sort", () => {
    expect(
      parseNotificationFilters({
        status: "UNREAD",
        category: "LISTING",
        sort: "date_asc",
      }),
    ).toMatchObject({
      status: "UNREAD",
      category: "LISTING",
      sort: "date_asc",
    });
  });

  it("drops an invalid status, category, or sort", () => {
    expect(
      parseNotificationFilters({
        status: "ARCHIVED",
        category: "NOT_A_CATEGORY",
        sort: "not-a-sort",
      }),
    ).toMatchObject({
      status: undefined,
      category: undefined,
      sort: undefined,
    });
  });
});

describe("buildNotificationFilterChips", () => {
  it("builds a chip for each active filter", () => {
    const chips = buildNotificationFilterChips({
      status: "UNREAD",
      category: "APPOINTMENT",
    });

    expect(chips).toEqual([
      { key: "status", label: "Unread" },
      { key: "category", label: "Appointment" },
    ]);
  });

  it("returns no chips when nothing is filtered", () => {
    expect(buildNotificationFilterChips({})).toEqual([]);
  });
});
