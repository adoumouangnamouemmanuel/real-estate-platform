import { describe, expect, it } from "vitest";

import { makeAppointment, makeProperty } from "@/test/fixtures";
import type { Appointment, ActivityItem } from "@/types";

import {
  buildActionNeeded,
  buildAnalyticsStats,
  buildAppointmentFunnel,
  buildPortfolioComposition,
  getPeriodStart,
} from "./analyticsCalculations";

const NOW = new Date("2026-07-24T12:00:00.000Z");

const HOUR_MS = 1000 * 60 * 60;
const DAY_MS = HOUR_MS * 24;

function historyEntry(type: ActivityItem["type"], msAgo: number): ActivityItem {
  const timestamp = new Date(NOW.getTime() - msAgo);
  return {
    id: `h-${Math.random()}`,
    type,
    message: "",
    timestamp: timestamp.toISOString(),
  };
}

/** An appointment requested `requestedDaysAgo` days ago, with a status and an optional confirmed-after-N-hours event. */
function makeCohortAppointment(overrides: {
  status: Appointment["status"];
  requestedDaysAgo: number;
  confirmedHoursAfterRequest?: number;
}): Appointment {
  const requestedMsAgo = overrides.requestedDaysAgo * DAY_MS;
  const history: ActivityItem[] = [
    historyEntry("APPOINTMENT_REQUESTED", requestedMsAgo),
  ];
  if (overrides.confirmedHoursAfterRequest !== undefined) {
    const confirmedMsAgo =
      requestedMsAgo - overrides.confirmedHoursAfterRequest * HOUR_MS;
    history.push(historyEntry("APPOINTMENT_CONFIRMED", confirmedMsAgo));
  }

  return makeAppointment({
    id: `ap-${Math.random()}`,
    status: overrides.status,
    history,
  });
}

describe("getPeriodStart", () => {
  it("subtracts the right number of days for each period", () => {
    expect(getPeriodStart("7d", NOW).toISOString()).toBe(
      "2026-07-17T12:00:00.000Z",
    );
    expect(getPeriodStart("30d", NOW).toISOString()).toBe(
      "2026-06-24T12:00:00.000Z",
    );
    expect(getPeriodStart("90d", NOW).toISOString()).toBe(
      "2026-04-25T12:00:00.000Z",
    );
  });
});

describe("buildAppointmentFunnel", () => {
  it("returns all-zero rates and a null average for an empty cohort", () => {
    const funnel = buildAppointmentFunnel([], "30d", NOW);

    expect(funnel.totalRequested).toBe(0);
    expect(funnel.responseRate).toBe(0);
    expect(funnel.completionRate).toBe(0);
    expect(funnel.cancellationRate).toBe(0);
    expect(funnel.noShowRate).toBe(0);
    expect(funnel.averageResponseHours).toBeNull();
    expect(funnel.stages.every((stage) => stage.count === 0)).toBe(true);
  });

  it("only counts appointments requested within the period", () => {
    const inPeriod = makeCohortAppointment({
      status: "REQUESTED",
      requestedDaysAgo: 5,
    });
    const outOfPeriod = makeCohortAppointment({
      status: "REQUESTED",
      requestedDaysAgo: 40,
    });

    const funnel = buildAppointmentFunnel([inPeriod, outOfPeriod], "30d", NOW);
    expect(funnel.totalRequested).toBe(1);
  });

  it("excludes appointments with no recorded request timestamp rather than guessing", () => {
    const noHistory = makeAppointment({ status: "REQUESTED", history: [] });
    const funnel = buildAppointmentFunnel([noHistory], "30d", NOW);
    expect(funnel.totalRequested).toBe(0);
  });

  it("computes stage counts by current status within the cohort", () => {
    const appointments = [
      makeCohortAppointment({ status: "REQUESTED", requestedDaysAgo: 2 }),
      makeCohortAppointment({ status: "CONFIRMED", requestedDaysAgo: 3 }),
      makeCohortAppointment({ status: "COMPLETED", requestedDaysAgo: 4 }),
      makeCohortAppointment({ status: "CANCELLED", requestedDaysAgo: 5 }),
      makeCohortAppointment({ status: "NO_SHOW", requestedDaysAgo: 6 }),
    ];

    const funnel = buildAppointmentFunnel(appointments, "30d", NOW);
    expect(funnel.totalRequested).toBe(5);
    expect(funnel.stages.find((s) => s.status === "REQUESTED")?.count).toBe(1);
    expect(funnel.stages.find((s) => s.status === "CONFIRMED")?.count).toBe(1);
    expect(funnel.stages.find((s) => s.status === "COMPLETED")?.count).toBe(1);
    expect(funnel.stages.find((s) => s.status === "CANCELLED")?.count).toBe(1);
    expect(funnel.stages.find((s) => s.status === "NO_SHOW")?.count).toBe(1);
  });

  it("computes responseRate as the share of the cohort no longer just REQUESTED", () => {
    const appointments = [
      makeCohortAppointment({ status: "REQUESTED", requestedDaysAgo: 2 }),
      makeCohortAppointment({ status: "CONFIRMED", requestedDaysAgo: 2 }),
      makeCohortAppointment({ status: "CANCELLED", requestedDaysAgo: 2 }),
      makeCohortAppointment({ status: "REQUESTED", requestedDaysAgo: 2 }),
    ];

    const funnel = buildAppointmentFunnel(appointments, "30d", NOW);
    expect(funnel.responseRate).toBeCloseTo(0.5); // 2 of 4 acted upon
  });

  it("computes completionRate against appointments that reached or passed CONFIRMED", () => {
    const appointments = [
      makeCohortAppointment({ status: "COMPLETED", requestedDaysAgo: 2 }),
      makeCohortAppointment({ status: "COMPLETED", requestedDaysAgo: 2 }),
      makeCohortAppointment({ status: "NO_SHOW", requestedDaysAgo: 2 }),
      makeCohortAppointment({ status: "REQUESTED", requestedDaysAgo: 2 }),
    ];

    const funnel = buildAppointmentFunnel(appointments, "30d", NOW);
    // denominator: CONFIRMED + RESCHEDULED + COMPLETED + NO_SHOW = 3 (the lone REQUESTED is excluded)
    expect(funnel.completionRate).toBeCloseTo(2 / 3);
  });

  it("computes cancellationRate and noShowRate against the full requested cohort", () => {
    const appointments = [
      makeCohortAppointment({ status: "CANCELLED", requestedDaysAgo: 2 }),
      makeCohortAppointment({ status: "NO_SHOW", requestedDaysAgo: 2 }),
      makeCohortAppointment({ status: "COMPLETED", requestedDaysAgo: 2 }),
      makeCohortAppointment({ status: "COMPLETED", requestedDaysAgo: 2 }),
    ];

    const funnel = buildAppointmentFunnel(appointments, "30d", NOW);
    expect(funnel.cancellationRate).toBeCloseTo(0.25);
    expect(funnel.noShowRate).toBeCloseTo(0.25);
  });

  it("averages response hours only over appointments with both a request and confirm timestamp", () => {
    const appointments = [
      makeCohortAppointment({
        status: "CONFIRMED",
        requestedDaysAgo: 5,
        confirmedHoursAfterRequest: 2,
      }),
      makeCohortAppointment({
        status: "CONFIRMED",
        requestedDaysAgo: 5,
        confirmedHoursAfterRequest: 10,
      }),
      makeCohortAppointment({ status: "REQUESTED", requestedDaysAgo: 5 }), // no confirm event
    ];

    const funnel = buildAppointmentFunnel(appointments, "30d", NOW);
    expect(funnel.averageResponseHours).toBeCloseTo(6, 0);
  });
});

describe("buildPortfolioComposition", () => {
  it("counts total listings and breaks down by status and category", () => {
    const properties = [
      makeProperty({ id: "p1", status: "ACTIVE", category: "apartment" }),
      makeProperty({ id: "p2", status: "ACTIVE", category: "house" }),
      makeProperty({ id: "p3", status: "DRAFT", category: "apartment" }),
    ];

    const composition = buildPortfolioComposition(properties);
    expect(composition.totalListings).toBe(3);
    expect(composition.byStatus.find((s) => s.status === "ACTIVE")?.count).toBe(
      2,
    );
    expect(composition.byStatus.find((s) => s.status === "DRAFT")?.count).toBe(
      1,
    );
    expect(composition.byStatus.find((s) => s.status === "SOLD")?.count).toBe(
      0,
    );
    expect(
      composition.byCategory.find((c) => c.category === "apartment")?.count,
    ).toBe(2);
    expect(
      composition.byCategory.find((c) => c.category === "house")?.count,
    ).toBe(1);
  });

  it("returns zeroed breakdowns for an empty portfolio", () => {
    const composition = buildPortfolioComposition([]);
    expect(composition.totalListings).toBe(0);
    expect(composition.byStatus.every((s) => s.count === 0)).toBe(true);
  });
});

describe("buildActionNeeded", () => {
  const emptyFunnel = buildAppointmentFunnel([], "30d", NOW);

  it("returns nothing when there is nothing to act on", () => {
    const items = buildActionNeeded([], [], emptyFunnel, NOW);
    expect(items).toEqual([]);
  });

  it("flags overdue REQUESTED appointments with a deep link, medium severity under 3", () => {
    const overdue = makeAppointment({
      status: "REQUESTED",
      scheduledFor: "2026-07-20T10:00:00.000Z",
    });

    const items = buildActionNeeded([overdue], [], emptyFunnel, NOW);
    const item = items.find((i) => i.type === "OVERDUE_APPOINTMENTS");
    expect(item).toBeDefined();
    expect(item?.count).toBe(1);
    expect(item?.severity).toBe("medium");
    expect(item?.href).toContain("timeframe=overdue");
  });

  it("escalates overdue-appointments severity to high at 3 or more", () => {
    const overdue = Array.from({ length: 3 }, () =>
      makeAppointment({
        status: "REQUESTED",
        scheduledFor: "2026-07-20T10:00:00.000Z",
      }),
    );

    const items = buildActionNeeded(overdue, [], emptyFunnel, NOW);
    expect(items.find((i) => i.type === "OVERDUE_APPOINTMENTS")?.severity).toBe(
      "high",
    );
  });

  it("does not flag a CONFIRMED appointment with a past date as overdue", () => {
    const pastConfirmed = makeAppointment({
      status: "CONFIRMED",
      scheduledFor: "2026-07-20T10:00:00.000Z",
    });

    const items = buildActionNeeded([pastConfirmed], [], emptyFunnel, NOW);
    expect(
      items.find((i) => i.type === "OVERDUE_APPOINTMENTS"),
    ).toBeUndefined();
  });

  it("flags stale drafts untouched past the threshold", () => {
    const staleDraft = makeProperty({
      status: "DRAFT",
      updatedAt: "2026-07-10T10:00:00.000Z", // 14 days before NOW
    });
    const freshDraft = makeProperty({
      id: "fresh",
      status: "DRAFT",
      updatedAt: "2026-07-23T10:00:00.000Z", // 1 day before NOW
    });

    const items = buildActionNeeded(
      [],
      [staleDraft, freshDraft],
      emptyFunnel,
      NOW,
    );
    const item = items.find((i) => i.type === "STALE_DRAFTS");
    expect(item?.count).toBe(1);
  });

  it("flags a high cancellation rate only once the sample size is large enough", () => {
    // 2 of 2 cancelled = 100% but sample is below the minimum — should not flag.
    const tinyFunnel = buildAppointmentFunnel(
      [
        makeCohortAppointment({ status: "CANCELLED", requestedDaysAgo: 2 }),
        makeCohortAppointment({ status: "CANCELLED", requestedDaysAgo: 2 }),
      ],
      "30d",
      NOW,
    );
    expect(
      buildActionNeeded([], [], tinyFunnel, NOW).find(
        (i) => i.type === "HIGH_CANCELLATION_RATE",
      ),
    ).toBeUndefined();

    // 3 of 5 cancelled = 60%, sample size 5 meets the minimum — should flag.
    const bigFunnel = buildAppointmentFunnel(
      [
        makeCohortAppointment({ status: "CANCELLED", requestedDaysAgo: 2 }),
        makeCohortAppointment({ status: "CANCELLED", requestedDaysAgo: 2 }),
        makeCohortAppointment({ status: "CANCELLED", requestedDaysAgo: 2 }),
        makeCohortAppointment({ status: "COMPLETED", requestedDaysAgo: 2 }),
        makeCohortAppointment({ status: "COMPLETED", requestedDaysAgo: 2 }),
      ],
      "30d",
      NOW,
    );
    const flagged = buildActionNeeded([], [], bigFunnel, NOW).find(
      (i) => i.type === "HIGH_CANCELLATION_RATE",
    );
    expect(flagged).toBeDefined();
    expect(flagged?.severity).toBe("high");
  });
});

describe("buildAnalyticsStats", () => {
  it("derives active listings, response rate, completed viewings, and cancellation rate", () => {
    const properties = [
      makeProperty({ id: "p1", status: "ACTIVE" }),
      makeProperty({ id: "p2", status: "DRAFT" }),
    ];
    const appointments = [
      makeCohortAppointment({ status: "COMPLETED", requestedDaysAgo: 2 }),
      makeCohortAppointment({ status: "CANCELLED", requestedDaysAgo: 2 }),
    ];
    const portfolio = buildPortfolioComposition(properties);
    const funnel = buildAppointmentFunnel(appointments, "30d", NOW);

    const stats = buildAnalyticsStats(
      appointments,
      portfolio,
      funnel,
      "30d",
      NOW,
    );

    expect(stats.find((s) => s.key === "active_listings")?.value).toBe(1);
    expect(stats.find((s) => s.key === "response_rate")?.value).toBe(100);
    expect(stats.find((s) => s.key === "completed_viewings")?.value).toBe(1);
    expect(stats.find((s) => s.key === "cancellation_rate")?.value).toBe(50);
  });

  it("attaches a trend series only to completed viewings", () => {
    const stats = buildAnalyticsStats(
      [],
      buildPortfolioComposition([]),
      buildAppointmentFunnel([], "7d", NOW),
      "7d",
      NOW,
    );

    expect(
      stats.find((s) => s.key === "completed_viewings")?.trend,
    ).toHaveLength(7);
    expect(
      stats.find((s) => s.key === "active_listings")?.trend,
    ).toBeUndefined();
    expect(stats.find((s) => s.key === "response_rate")?.trend).toBeUndefined();
  });
});
