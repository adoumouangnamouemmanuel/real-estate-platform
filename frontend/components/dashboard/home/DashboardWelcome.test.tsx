import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { dashboardService } from "@/services";
import { useAuthStore } from "@/store/authStore";
import { renderWithQueryClient } from "@/test/renderWithQueryClient";

import { DashboardWelcome } from "./DashboardWelcome";

vi.mock("@/services", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services")>();
  return {
    ...actual,
    dashboardService: { getSummary: vi.fn(), getMetrics: vi.fn() },
  };
});

const getSummary = vi.mocked(dashboardService.getSummary);
const getMetrics = vi.mocked(dashboardService.getMetrics);

describe("DashboardWelcome", () => {
  beforeEach(() => {
    getSummary.mockReset();
    getMetrics.mockReset();
    useAuthStore.getState().setAuth(
      {
        id: "u2",
        fullName: "Kwame Mensah",
        email: "developer@byte.africa",
        role: "DEVELOPER",
      },
      "token",
    );
  });

  it("greets the signed-in developer by first name in the page heading", () => {
    getSummary.mockResolvedValue({
      developerName: "Kwame Mensah",
      companyName: "Atlantic Properties",
    });
    getMetrics.mockResolvedValue({
      totalProperties: 6,
      activeListings: 2,
      draftListings: 2,
      appointmentRequests: 2,
      unreadNotifications: 3,
      totalPropertyViews: 3742,
    });

    renderWithQueryClient(<DashboardWelcome />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      /Kwame/,
    );
  });

  it("surfaces the company name and the pending-work summary from the service", async () => {
    getSummary.mockResolvedValue({
      developerName: "Kwame Mensah",
      companyName: "Atlantic Properties",
    });
    getMetrics.mockResolvedValue({
      totalProperties: 6,
      activeListings: 2,
      draftListings: 2,
      appointmentRequests: 1,
      unreadNotifications: 3,
      totalPropertyViews: 3742,
    });

    renderWithQueryClient(<DashboardWelcome />);

    await waitFor(() =>
      expect(screen.getByText("Atlantic Properties")).toBeInTheDocument(),
    );
    // Singular noun when exactly one request is pending.
    expect(screen.getByText("1 new appointment request")).toBeInTheDocument();
    expect(screen.getByText("3 unread notifications")).toBeInTheDocument();
  });
});
