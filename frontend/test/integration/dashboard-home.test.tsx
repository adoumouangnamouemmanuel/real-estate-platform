import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import DashboardHomePage from "@/app/(dashboard)/dashboard/page";
import { dashboardService } from "@/services";
import { useAuthStore } from "@/store/authStore";
import { renderWithQueryClient } from "@/test/renderWithQueryClient";
import type {
  ActivityItem,
  Appointment,
  DashboardMetrics,
  Notification,
  Property,
} from "@/types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/dashboard",
}));

vi.mock("@/services", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services")>();
  return {
    ...actual,
    dashboardService: {
      getSummary: vi.fn(),
      getMetrics: vi.fn(),
      getRecentListings: vi.fn(),
      getAppointmentOverview: vi.fn(),
      getNotifications: vi.fn(),
      getActivity: vi.fn(),
    },
  };
});

const svc = vi.mocked(dashboardService);

const metrics: DashboardMetrics = {
  totalProperties: 6,
  activeListings: 2,
  draftListings: 2,
  appointmentRequests: 2,
  unreadNotifications: 3,
  totalPropertyViews: 3742,
};

const listing: Property = {
  id: "dl1",
  slug: "east-legon",
  title: "Luxury 3BR Apartment in East Legon",
  description: "",
  price: 450000,
  listingType: "SALE",
  category: "apartment",
  city: "Accra",
  region: "Greater Accra",
  status: "ACTIVE",
  media: [],
  updatedAt: "2026-07-23T10:00:00.000Z",
};

const appointment: Appointment = {
  id: "a1",
  propertyId: "dl1",
  propertyTitle: "East Legon Viewing",
  clientName: "Adjoa Sarpong",
  scheduledFor: "2026-07-24T10:00:00.000Z",
  status: "CONFIRMED",
};

const notification: Notification = {
  id: "n1",
  type: "APPOINTMENT_REQUESTED",
  title: "New viewing request",
  body: "Someone requested a viewing.",
  createdAt: "2026-07-23T10:00:00.000Z",
  status: "UNREAD",
};

const activity: ActivityItem = {
  id: "act1",
  type: "LISTING_PUBLISHED",
  message: "You published a new listing.",
  timestamp: "2026-07-23T10:00:00.000Z",
};

function signInAsDeveloper() {
  useAuthStore.getState().setAuth(
    {
      id: "u2",
      fullName: "Kwame Mensah",
      email: "developer@byte.africa",
      role: "DEVELOPER",
    },
    "token",
  );
}

describe("Dashboard Home page (all widgets composed)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    signInAsDeveloper();
  });

  it("renders every section once each service resolves", async () => {
    svc.getSummary.mockResolvedValue({
      developerName: "Kwame Mensah",
      companyName: "Atlantic Properties",
    });
    svc.getMetrics.mockResolvedValue(metrics);
    svc.getRecentListings.mockResolvedValue([listing]);
    svc.getAppointmentOverview.mockResolvedValue({
      upcoming: [appointment],
      requested: [],
      completed: [],
    });
    svc.getNotifications.mockResolvedValue([notification]);
    svc.getActivity.mockResolvedValue([activity]);

    renderWithQueryClient(<DashboardHomePage />);

    // Welcome: greeting from the auth store renders synchronously.
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      /Kwame/,
    );

    // Each data-backed section resolves.
    await waitFor(() =>
      expect(screen.getByText("Total Properties")).toBeInTheDocument(),
    );
    expect(screen.getByText("Atlantic Properties")).toBeInTheDocument();
    expect(
      screen.getByText("Luxury 3BR Apartment in East Legon"),
    ).toBeInTheDocument();
    expect(screen.getByText("East Legon Viewing")).toBeInTheDocument();
    expect(screen.getByText("New viewing request")).toBeInTheDocument();
    expect(
      screen.getByText("You published a new listing."),
    ).toBeInTheDocument();

    // Static Quick Actions panel is always present.
    expect(screen.getByText("Add Property")).toBeInTheDocument();
  });

  it("shows each data section's error state when its service rejects", async () => {
    svc.getSummary.mockRejectedValue(new Error("down"));
    svc.getMetrics.mockRejectedValue(new Error("down"));
    svc.getRecentListings.mockRejectedValue(new Error("down"));
    svc.getAppointmentOverview.mockRejectedValue(new Error("down"));
    svc.getNotifications.mockRejectedValue(new Error("down"));
    svc.getActivity.mockRejectedValue(new Error("down"));

    renderWithQueryClient(<DashboardHomePage />);

    await waitFor(() =>
      expect(
        screen.getByText("Couldn't load your metrics."),
      ).toBeInTheDocument(),
    );
    expect(
      screen.getByText("Couldn't load your listings."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Couldn't load your appointments."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Couldn't load your notifications."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Couldn't load your activity."),
    ).toBeInTheDocument();
  });
});
