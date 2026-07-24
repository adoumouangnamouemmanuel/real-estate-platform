import { afterEach, describe, expect, it } from "vitest";

import { appointmentService } from "./appointment.service";
import { MOCK_APPOINTMENTS } from "./mocks/appointments.mock";

/** Deep-clones the mock appointment book so mutation tests can restore it afterward and never leak state into other tests importing the same module. */
function snapshotAppointments() {
  return MOCK_APPOINTMENTS.map((item) => ({
    ...item,
    history: item.history ? [...item.history] : item.history,
  }));
}

function restore(snapshot: ReturnType<typeof snapshotAppointments>) {
  MOCK_APPOINTMENTS.length = 0;
  MOCK_APPOINTMENTS.push(...snapshot);
}

describe("appointmentService.getAppointments", () => {
  it("paginates with the default page size", async () => {
    const result = await appointmentService.getAppointments({ page: 1 });
    expect(result.pageSize).toBe(10);
    expect(result.total).toBe(MOCK_APPOINTMENTS.length);
  });

  it("filters by status", async () => {
    const result = await appointmentService.getAppointments({
      status: "REQUESTED",
      pageSize: 50,
    });
    expect(result.items.every((item) => item.status === "REQUESTED")).toBe(
      true,
    );
    expect(result.items.length).toBeGreaterThan(0);
  });

  it("matches a keyword against client name or property title, case-insensitively", async () => {
    const result = await appointmentService.getAppointments({
      q: "sarpong",
      pageSize: 50,
    });
    expect(result.items.length).toBeGreaterThan(0);
    expect(
      result.items.every((item) =>
        item.clientName.toLowerCase().includes("sarpong"),
      ),
    ).toBe(true);
  });

  it("sorts soonest-first and latest-first", async () => {
    const asc = await appointmentService.getAppointments({
      sort: "date_asc",
      pageSize: 50,
    });
    const desc = await appointmentService.getAppointments({
      sort: "date_desc",
      pageSize: 50,
    });
    expect(new Date(asc.items[0].scheduledFor).getTime()).toBeLessThanOrEqual(
      new Date(asc.items[asc.items.length - 1].scheduledFor).getTime(),
    );
    expect(
      new Date(desc.items[0].scheduledFor).getTime(),
    ).toBeGreaterThanOrEqual(
      new Date(desc.items[desc.items.length - 1].scheduledFor).getTime(),
    );
  });

  it("filters to today's appointments only", async () => {
    const result = await appointmentService.getAppointments({
      timeframe: "today",
      pageSize: 50,
    });
    const now = new Date();
    expect(
      result.items.every((item) => {
        const date = new Date(item.scheduledFor);
        return (
          date.getFullYear() === now.getFullYear() &&
          date.getMonth() === now.getMonth() &&
          date.getDate() === now.getDate()
        );
      }),
    ).toBe(true);
  });
});

describe("appointmentService.getStatusCounts", () => {
  it("adds up to the full appointment book size", async () => {
    const counts = await appointmentService.getStatusCounts();
    const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
    expect(total).toBe(MOCK_APPOINTMENTS.length);
  });
});

describe("appointmentService mutations", () => {
  let snapshot: ReturnType<typeof snapshotAppointments>;

  afterEach(() => {
    restore(snapshot);
  });

  it("updateStatus applies a valid transition and appends history", async () => {
    snapshot = snapshotAppointments();
    const requested = MOCK_APPOINTMENTS.find(
      (item) => item.status === "REQUESTED",
    )!;
    const historyLength = requested.history?.length ?? 0;

    const updated = await appointmentService.updateStatus(
      requested.id,
      "CONFIRMED",
    );

    expect(updated.status).toBe("CONFIRMED");
    expect(updated.history).toHaveLength(historyLength + 1);
    expect(updated.history?.at(-1)?.type).toBe("APPOINTMENT_CONFIRMED");
  });

  it("updateStatus rejects an invalid transition", async () => {
    snapshot = snapshotAppointments();
    const completed = MOCK_APPOINTMENTS.find(
      (item) => item.status === "COMPLETED",
    )!;

    await expect(
      appointmentService.updateStatus(completed.id, "CONFIRMED"),
    ).rejects.toThrow(/Cannot move/);
  });

  it("reschedule moves an appointment to RESCHEDULED and records the previous date", async () => {
    snapshot = snapshotAppointments();
    const confirmed = MOCK_APPOINTMENTS.find(
      (item) => item.status === "CONFIRMED",
    )!;
    const previousScheduledFor = confirmed.scheduledFor;
    const newDate = "2026-08-01T09:00:00.000Z";

    const updated = await appointmentService.reschedule(confirmed.id, newDate);

    expect(updated.status).toBe("RESCHEDULED");
    expect(updated.scheduledFor).toBe(newDate);
    expect(updated.previousScheduledFor).toBe(previousScheduledFor);
  });

  it("reschedule rejects a terminal appointment", async () => {
    snapshot = snapshotAppointments();
    const cancelled = MOCK_APPOINTMENTS.find(
      (item) => item.status === "CANCELLED",
    )!;

    await expect(
      appointmentService.reschedule(cancelled.id, "2026-08-01T09:00:00.000Z"),
    ).rejects.toThrow(/can't be rescheduled/);
  });

  it("bulkUpdateStatus applies to eligible rows and skips the rest", async () => {
    snapshot = snapshotAppointments();
    const requested = MOCK_APPOINTMENTS.find(
      (item) => item.status === "REQUESTED",
    )!;
    const completed = MOCK_APPOINTMENTS.find(
      (item) => item.status === "COMPLETED",
    )!;

    const result = await appointmentService.bulkUpdateStatus(
      [requested.id, completed.id],
      "CANCELLED",
    );

    expect(result.updated).toEqual([requested.id]);
    expect(result.skipped).toEqual([completed.id]);
  });

  it("getAppointment rejects an unknown id", async () => {
    await expect(
      appointmentService.getAppointment("no-such-id"),
    ).rejects.toThrow(/not found/);
  });
});
