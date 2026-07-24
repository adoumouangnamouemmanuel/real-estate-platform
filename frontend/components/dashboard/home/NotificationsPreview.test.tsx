import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { dashboardService } from "@/services";
import { renderWithQueryClient } from "@/test/renderWithQueryClient";
import type { Notification } from "@/types";

import { NotificationsPreview } from "./NotificationsPreview";

vi.mock("@/services", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services")>();
  return {
    ...actual,
    dashboardService: { getNotifications: vi.fn() },
  };
});

const getNotifications = vi.mocked(dashboardService.getNotifications);

function makeNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: "n1",
    type: "APPOINTMENT_REQUESTED",
    title: "New viewing request",
    body: "Someone requested a viewing.",
    createdAt: "2026-07-23T10:00:00.000Z",
    status: "UNREAD",
    ...overrides,
  };
}

describe("NotificationsPreview", () => {
  beforeEach(() => getNotifications.mockReset());

  it("marks unread notifications non-visually", async () => {
    getNotifications.mockResolvedValue([
      makeNotification({ id: "n1", title: "Unread one", status: "UNREAD" }),
      makeNotification({ id: "n2", title: "Read one", status: "READ" }),
    ]);

    renderWithQueryClient(<NotificationsPreview />);

    await waitFor(() =>
      expect(screen.getByText("Unread one")).toBeInTheDocument(),
    );
    // The unread item carries a screen-reader-only "Unread:" prefix; the read one does not.
    expect(screen.getByText("Unread:")).toBeInTheDocument();
    expect(screen.getAllByText(/Unread:/)).toHaveLength(1);
  });

  it("shows the caught-up empty state when there are no notifications", async () => {
    getNotifications.mockResolvedValue([]);

    renderWithQueryClient(<NotificationsPreview />);

    await waitFor(() =>
      expect(screen.getByText("You're all caught up")).toBeInTheDocument(),
    );
  });

  // Error-state coverage lives in the full-page integration test — see the note
  // in DashboardKpis.test.tsx.
});
