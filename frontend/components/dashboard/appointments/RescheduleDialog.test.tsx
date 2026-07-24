import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { makeAppointment } from "@/test/fixtures";

import { RescheduleDialog } from "./RescheduleDialog";

describe("RescheduleDialog", () => {
  it("renders nothing when no appointment target is given", () => {
    render(
      <RescheduleDialog
        appointment={null}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        isPending={false}
      />,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("prefills the current scheduled date/time and confirms a new one", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const appointment = makeAppointment({
      clientName: "Kofi Antwi",
      scheduledFor: "2026-08-01T10:00:00.000Z",
    });

    render(
      <RescheduleDialog
        appointment={appointment}
        onOpenChange={vi.fn()}
        onConfirm={onConfirm}
        isPending={false}
      />,
    );

    expect(
      screen.getByText(/Pick a new date and time for Kofi Antwi/),
    ).toBeInTheDocument();

    const input = screen.getByLabelText(/New date/);
    await user.clear(input);
    await user.type(input, "2026-08-15T14:30");

    await user.click(
      screen.getByRole("button", { name: "Confirm reschedule" }),
    );

    expect(onConfirm).toHaveBeenCalledTimes(1);
    const [isoValue] = onConfirm.mock.calls[0];
    expect(new Date(isoValue).getFullYear()).toBe(2026);
  });

  it("disables confirm while pending", () => {
    const appointment = makeAppointment();

    render(
      <RescheduleDialog
        appointment={appointment}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        isPending
      />,
    );

    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
  });
});
