import { describe, expect, it } from "vitest";

import { buildDashboardActionNeeded } from "@/lib/dashboardActionNeeded";
import { makeAppointment, makeProperty } from "@/test/fixtures";

const NOW = new Date("2026-07-24T12:00:00.000Z");
const DAY_MS = 1000 * 60 * 60 * 24;

function isoDaysAgo(days: number): string {
  return new Date(NOW.getTime() - days * DAY_MS).toISOString();
}

function isoDaysFromNow(days: number): string {
  return new Date(NOW.getTime() + days * DAY_MS).toISOString();
}

describe("buildDashboardActionNeeded", () => {
  it("returns nothing when the portfolio has no pending requests, stale drafts, or suspensions", () => {
    const properties = [makeProperty({ status: "ACTIVE" })];
    const appointments = [
      makeAppointment({ status: "CONFIRMED", scheduledFor: isoDaysFromNow(1) }),
    ];

    expect(buildDashboardActionNeeded(properties, appointments, NOW)).toEqual(
      [],
    );
  });

  it("flags a requested appointment scheduled in the past as overdue, not as a new request", () => {
    const appointments = [
      makeAppointment({ status: "REQUESTED", scheduledFor: isoDaysAgo(1) }),
    ];

    const items = buildDashboardActionNeeded([], appointments, NOW);

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      type: "OVERDUE_APPOINTMENTS",
      severity: "medium",
      count: 1,
      href: "/appointments?timeframe=overdue",
    });
  });

  it("escalates to high severity once overdue appointments reach 3", () => {
    const appointments = Array.from({ length: 3 }, () =>
      makeAppointment({ status: "REQUESTED", scheduledFor: isoDaysAgo(2) }),
    );

    const [item] = buildDashboardActionNeeded([], appointments, NOW);

    expect(item).toMatchObject({
      type: "OVERDUE_APPOINTMENTS",
      severity: "high",
    });
  });

  it("counts a future-dated requested appointment as a new request, not overdue", () => {
    const appointments = [
      makeAppointment({ status: "REQUESTED", scheduledFor: isoDaysFromNow(2) }),
    ];

    const items = buildDashboardActionNeeded([], appointments, NOW);

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      type: "NEW_APPOINTMENT_REQUESTS",
      severity: "medium",
      count: 1,
      href: "/appointments?status=REQUESTED",
    });
  });

  it("splits a mix of overdue and future requests into their own items", () => {
    const appointments = [
      makeAppointment({
        id: "a1",
        status: "REQUESTED",
        scheduledFor: isoDaysAgo(1),
      }),
      makeAppointment({
        id: "a2",
        status: "REQUESTED",
        scheduledFor: isoDaysFromNow(1),
      }),
    ];

    const items = buildDashboardActionNeeded([], appointments, NOW);

    expect(items.find((i) => i.type === "OVERDUE_APPOINTMENTS")).toMatchObject({
      count: 1,
    });
    expect(
      items.find((i) => i.type === "NEW_APPOINTMENT_REQUESTS"),
    ).toMatchObject({ count: 1 });
  });

  it("flags a draft untouched for more than 5 days as stale, not one updated 2 days ago", () => {
    const properties = [
      makeProperty({ id: "p1", status: "DRAFT", updatedAt: isoDaysAgo(6) }),
      makeProperty({ id: "p2", status: "DRAFT", updatedAt: isoDaysAgo(2) }),
    ];

    const items = buildDashboardActionNeeded(properties, [], NOW);

    expect(items).toEqual([
      expect.objectContaining({
        type: "STALE_DRAFTS",
        severity: "medium",
        count: 1,
        href: "/listings?status=DRAFT",
      }),
    ]);
  });

  it("flags suspended listings", () => {
    const properties = [
      makeProperty({ status: "SUSPENDED" }),
      makeProperty({ status: "ACTIVE" }),
    ];

    const items = buildDashboardActionNeeded(properties, [], NOW);

    expect(items).toEqual([
      expect.objectContaining({
        type: "SUSPENDED_LISTINGS",
        severity: "medium",
        count: 1,
        href: "/listings?status=SUSPENDED",
      }),
    ]);
  });

  it("never invents an unread-notifications item — that count already has its own surfaces", () => {
    const items = buildDashboardActionNeeded([], [], NOW);
    expect(
      items.some((item) => String(item.type).includes("NOTIFICATION")),
    ).toBe(false);
  });
});
