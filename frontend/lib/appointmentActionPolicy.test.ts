import { describe, expect, it } from "vitest";

import { AppointmentActionPolicy } from "./appointmentActionPolicy";

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
