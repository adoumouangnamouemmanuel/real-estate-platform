import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { makeAppointment } from "@/test/fixtures";

import { AppointmentDetailsDrawer } from "./AppointmentDetailsDrawer";

describe("AppointmentDetailsDrawer", () => {
  it("renders nothing when no appointment is given", () => {
    render(
      <AppointmentDetailsDrawer
        appointment={null}
        onOpenChange={vi.fn()}
        onAction={vi.fn()}
        isPending={false}
      />,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows the client, property, status, and history via ActivityTimeline", () => {
    const appointment = makeAppointment({
      clientName: "Adjoa Sarpong",
      propertyTitle: "Luxury 3BR Apartment",
      status: "CONFIRMED",
      history: [
        {
          id: "h1",
          type: "APPOINTMENT_REQUESTED",
          message: "Adjoa Sarpong requested a viewing.",
          timestamp: "2026-07-20T10:00:00.000Z",
        },
        {
          id: "h2",
          type: "APPOINTMENT_CONFIRMED",
          message: "You confirmed the viewing.",
          timestamp: "2026-07-21T10:00:00.000Z",
        },
      ],
    });

    render(
      <AppointmentDetailsDrawer
        appointment={appointment}
        onOpenChange={vi.fn()}
        onAction={vi.fn()}
        isPending={false}
      />,
    );

    expect(screen.getByText("Adjoa Sarpong")).toBeInTheDocument();
    expect(screen.getByText("Luxury 3BR Apartment")).toBeInTheDocument();
    expect(screen.getByText("Confirmed")).toBeInTheDocument();
    expect(
      screen.getByText("Adjoa Sarpong requested a viewing."),
    ).toBeInTheDocument();
    expect(screen.getByText("You confirmed the viewing.")).toBeInTheDocument();
  });

  it("shows the original date when the appointment was rescheduled", () => {
    const appointment = makeAppointment({
      status: "RESCHEDULED",
      previousScheduledFor: "2026-07-01T10:00:00.000Z",
    });

    render(
      <AppointmentDetailsDrawer
        appointment={appointment}
        onOpenChange={vi.fn()}
        onAction={vi.fn()}
        isPending={false}
      />,
    );

    expect(screen.getByText(/Originally scheduled for/)).toBeInTheDocument();
  });

  it("offers status-aware actions and dispatches onAction", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    const appointment = makeAppointment({ status: "REQUESTED" });

    render(
      <AppointmentDetailsDrawer
        appointment={appointment}
        onOpenChange={vi.fn()}
        onAction={onAction}
        isPending={false}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Confirm" }));
    expect(onAction).toHaveBeenCalledWith(
      appointment,
      expect.objectContaining({ key: "CONFIRM" }),
    );
  });

  it("offers no action buttons for a terminal appointment", () => {
    const appointment = makeAppointment({ status: "COMPLETED" });

    render(
      <AppointmentDetailsDrawer
        appointment={appointment}
        onOpenChange={vi.fn()}
        onAction={vi.fn()}
        isPending={false}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "Confirm" }),
    ).not.toBeInTheDocument();
  });
});
