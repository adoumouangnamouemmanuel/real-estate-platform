import { afterEach, describe, expect, it } from "vitest";

import { notificationService } from "./notification.service";
import { MOCK_NOTIFICATIONS } from "./mocks/notifications.mock";

/** Deep-clones the mock inbox so mutation tests can restore it afterward and never leak state into other tests importing the same module. */
function snapshotNotifications() {
  return MOCK_NOTIFICATIONS.map((item) => ({ ...item }));
}

function restore(snapshot: ReturnType<typeof snapshotNotifications>) {
  MOCK_NOTIFICATIONS.length = 0;
  MOCK_NOTIFICATIONS.push(...snapshot);
}

describe("notificationService.getNotifications", () => {
  it("paginates with the default page size", async () => {
    const result = await notificationService.getNotifications({ page: 1 });
    expect(result.pageSize).toBe(10);
    expect(result.total).toBe(MOCK_NOTIFICATIONS.length);
  });

  it("filters by status", async () => {
    const result = await notificationService.getNotifications({
      status: "UNREAD",
      pageSize: 50,
    });
    expect(result.items.every((item) => item.status === "UNREAD")).toBe(true);
    expect(result.items.length).toBeGreaterThan(0);
  });

  it("filters by category, derived from type rather than stored", async () => {
    const result = await notificationService.getNotifications({
      category: "APPOINTMENT",
      pageSize: 50,
    });
    expect(result.items.length).toBeGreaterThan(0);
    expect(
      result.items.every((item) => item.type.startsWith("APPOINTMENT_")),
    ).toBe(true);
  });

  it("sorts newest-first by default and oldest-first on request", async () => {
    const desc = await notificationService.getNotifications({
      pageSize: 50,
    });
    const asc = await notificationService.getNotifications({
      sort: "date_asc",
      pageSize: 50,
    });

    expect(new Date(desc.items[0].createdAt).getTime()).toBeGreaterThanOrEqual(
      new Date(desc.items[desc.items.length - 1].createdAt).getTime(),
    );
    expect(new Date(asc.items[0].createdAt).getTime()).toBeLessThanOrEqual(
      new Date(asc.items[asc.items.length - 1].createdAt).getTime(),
    );
  });
});

describe("notificationService.getUnreadCount", () => {
  it("matches the number of UNREAD items in the mock inbox", async () => {
    const count = await notificationService.getUnreadCount();
    const expected = MOCK_NOTIFICATIONS.filter(
      (item) => item.status === "UNREAD",
    ).length;
    expect(count).toBe(expected);
  });
});

describe("notificationService mutations", () => {
  let snapshot: ReturnType<typeof snapshotNotifications>;

  afterEach(() => {
    restore(snapshot);
  });

  it("markAsRead moves an UNREAD notification to READ", async () => {
    snapshot = snapshotNotifications();
    const unread = MOCK_NOTIFICATIONS.find((item) => item.status === "UNREAD")!;

    const updated = await notificationService.markAsRead(unread.id);

    expect(updated.status).toBe("READ");
  });

  it("markAsRead is a no-op on an already-READ notification", async () => {
    snapshot = snapshotNotifications();
    const read = MOCK_NOTIFICATIONS.find((item) => item.status === "READ")!;

    const updated = await notificationService.markAsRead(read.id);

    expect(updated.status).toBe("READ");
  });

  it("markAsRead rejects an unknown id", async () => {
    await expect(notificationService.markAsRead("no-such-id")).rejects.toThrow(
      /not found/,
    );
  });

  it("markAllAsRead moves every UNREAD notification to READ and reports what changed", async () => {
    snapshot = snapshotNotifications();
    const unreadIds = MOCK_NOTIFICATIONS.filter(
      (item) => item.status === "UNREAD",
    ).map((item) => item.id);

    const result = await notificationService.markAllAsRead();

    expect(result.updated.sort()).toEqual(unreadIds.sort());
    expect(MOCK_NOTIFICATIONS.every((item) => item.status !== "UNREAD")).toBe(
      true,
    );
  });
});
