import { describe, expect, it } from "vitest";

import {
  AppointmentActionPolicy,
  isOverdueAppointment,
} from "./appointmentActionPolicy";

describe("AppointmentActionPolicy.getActions", () => {
  it("offers Confirm and Cancel for a REQUESTED appointment", () => {
    const keys = AppointmentActionPolicy.getActions("REQUESTED").map(
      (a) => a.key,
    );
    expect(keys).toEqual(["CONFIRM", "CANCEL"]);
  });

  it("offers the full set of onward moves for a CONFIRMED appointment", () => {
    const keys = AppointmentActionPolicy.getActions("CONFIRMED").map(
      (a) => a.key,
    );
    expect(keys).toEqual(["RESCHEDULE", "COMPLETE", "NO_SHOW", "CANCEL"]);
  });

  it("offers no actions for terminal statuses", () => {
    expect(AppointmentActionPolicy.getActions("COMPLETED")).toEqual([]);
    expect(AppointmentActionPolicy.getActions("CANCELLED")).toEqual([]);
    expect(AppointmentActionPolicy.getActions("NO_SHOW")).toEqual([]);
  });
});

describe("AppointmentActionPolicy.getBulkActions", () => {
  it("only returns bulk-safe actions (Confirm, Cancel)", () => {
    const keys = AppointmentActionPolicy.getBulkActions().map((a) => a.key);
    expect(keys).toEqual(["CONFIRM", "CANCEL"]);
  });

  it("excludes Reschedule, Complete, and No-Show even though they're valid per-appointment actions", () => {
    const keys = AppointmentActionPolicy.getBulkActions().map((a) => a.key);
    expect(keys).not.toContain("RESCHEDULE");
    expect(keys).not.toContain("COMPLETE");
    expect(keys).not.toContain("NO_SHOW");
  });
});

describe("AppointmentActionPolicy.isValidTransition", () => {
  it("allows REQUESTED -> CONFIRMED", () => {
    expect(
      AppointmentActionPolicy.isValidTransition("REQUESTED", "CONFIRMED"),
    ).toBe(true);
  });

  it("rejects REQUESTED -> COMPLETED", () => {
    expect(
      AppointmentActionPolicy.isValidTransition("REQUESTED", "COMPLETED"),
    ).toBe(false);
  });

  it("rejects any move out of a terminal status", () => {
    expect(
      AppointmentActionPolicy.isValidTransition("COMPLETED", "CONFIRMED"),
    ).toBe(false);
  });
});

describe("AppointmentActionPolicy.isTerminal", () => {
  it("marks COMPLETED, CANCELLED, and NO_SHOW as terminal", () => {
    expect(AppointmentActionPolicy.isTerminal("COMPLETED")).toBe(true);
    expect(AppointmentActionPolicy.isTerminal("CANCELLED")).toBe(true);
    expect(AppointmentActionPolicy.isTerminal("NO_SHOW")).toBe(true);
  });

  it("does not mark REQUESTED, CONFIRMED, or RESCHEDULED as terminal", () => {
    expect(AppointmentActionPolicy.isTerminal("REQUESTED")).toBe(false);
    expect(AppointmentActionPolicy.isTerminal("CONFIRMED")).toBe(false);
    expect(AppointmentActionPolicy.isTerminal("RESCHEDULED")).toBe(false);
  });
});

describe("isOverdueAppointment", () => {
  const now = new Date("2026-07-24T12:00:00.000Z");

  it("is overdue when REQUESTED and the scheduled date has passed", () => {
    expect(
      isOverdueAppointment(
        { status: "REQUESTED", scheduledFor: "2026-07-20T10:00:00.000Z" },
        now,
      ),
    ).toBe(true);
  });

  it("is not overdue when REQUESTED but still in the future", () => {
    expect(
      isOverdueAppointment(
        { status: "REQUESTED", scheduledFor: "2026-07-28T10:00:00.000Z" },
        now,
      ),
    ).toBe(false);
  });

  it("is not overdue once acted on, even if the date has passed (CONFIRMED)", () => {
    expect(
      isOverdueAppointment(
        { status: "CONFIRMED", scheduledFor: "2026-07-20T10:00:00.000Z" },
        now,
      ),
    ).toBe(false);
  });

  it("is not overdue for terminal statuses even with a past date", () => {
    for (const status of ["COMPLETED", "CANCELLED", "NO_SHOW"] as const) {
      expect(
        isOverdueAppointment(
          { status, scheduledFor: "2026-07-20T10:00:00.000Z" },
          now,
        ),
      ).toBe(false);
    }
  });
});
