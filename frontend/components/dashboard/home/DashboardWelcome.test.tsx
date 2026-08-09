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
    dashboardService: { getSummary: vi.fn() },
  };
});

const getSummary = vi.mocked(dashboardService.getSummary);

describe("DashboardWelcome", () => {
  beforeEach(() => {
    getSummary.mockReset();
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

    renderWithQueryClient(<DashboardWelcome />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      /Kwame/,
    );
  });

  it("surfaces the company name from the service", async () => {
    getSummary.mockResolvedValue({
      developerName: "Kwame Mensah",
      companyName: "Atlantic Properties",
    });

    renderWithQueryClient(<DashboardWelcome />);

    await waitFor(() =>
      expect(screen.getByText("Atlantic Properties")).toBeInTheDocument(),
    );
  });
});
