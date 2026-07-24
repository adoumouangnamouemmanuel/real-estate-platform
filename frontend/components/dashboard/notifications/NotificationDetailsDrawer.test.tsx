import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { makeNotification } from "@/test/fixtures";

import { NotificationDetailsDrawer } from "./NotificationDetailsDrawer";

describe("NotificationDetailsDrawer", () => {
  it("renders nothing when no notification is given", () => {
    render(
      <NotificationDetailsDrawer
        notification={null}
        onOpenChange={vi.fn()}
        onMarkAsRead={vi.fn()}
        isPending={false}
      />,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows the title, type label, category, and full body", () => {
    const notification = makeNotification({
      title: "New viewing request",
      type: "APPOINTMENT_REQUESTED",
      body: "Nadia Owusu requested a viewing.",
    });

    render(
      <NotificationDetailsDrawer
        notification={notification}
        onOpenChange={vi.fn()}
        onMarkAsRead={vi.fn()}
        isPending={false}
      />,
    );

    expect(screen.getByText("New viewing request")).toBeInTheDocument();
    expect(screen.getByText("Appointment Requested")).toBeInTheDocument();
    expect(screen.getByText("Appointment")).toBeInTheDocument();
    expect(
      screen.getByText("Nadia Owusu requested a viewing."),
    ).toBeInTheDocument();
  });

  it("offers Mark as read only when unread, and dispatches it", async () => {
    const user = userEvent.setup();
    const onMarkAsRead = vi.fn();
    const notification = makeNotification({ id: "n1", status: "UNREAD" });

    render(
      <NotificationDetailsDrawer
        notification={notification}
        onOpenChange={vi.fn()}
        onMarkAsRead={onMarkAsRead}
        isPending={false}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Mark as read" }));
    expect(onMarkAsRead).toHaveBeenCalledWith("n1");
  });

  it("does not offer Mark as read for an already-read notification", () => {
    const notification = makeNotification({ status: "READ" });

    render(
      <NotificationDetailsDrawer
        notification={notification}
        onOpenChange={vi.fn()}
        onMarkAsRead={vi.fn()}
        isPending={false}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "Mark as read" }),
    ).not.toBeInTheDocument();
  });

  it("offers a View details link when the notification carries a deep link", () => {
    const notification = makeNotification({ link: "/appointments" });

    render(
      <NotificationDetailsDrawer
        notification={notification}
        onOpenChange={vi.fn()}
        onMarkAsRead={vi.fn()}
        isPending={false}
      />,
    );

    expect(screen.getByRole("link", { name: "View details" })).toHaveAttribute(
      "href",
      "/appointments",
    );
  });

  it("omits the View details link when there is no deep link", () => {
    const notification = makeNotification({ link: undefined });

    render(
      <NotificationDetailsDrawer
        notification={notification}
        onOpenChange={vi.fn()}
        onMarkAsRead={vi.fn()}
        isPending={false}
      />,
    );

    expect(
      screen.queryByRole("link", { name: "View details" }),
    ).not.toBeInTheDocument();
  });
});
