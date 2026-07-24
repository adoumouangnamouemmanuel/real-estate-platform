import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { makeNotification } from "@/test/fixtures";
import type { Notification } from "@/types";

import { NotificationsList } from "./NotificationsList";

const unread: Notification = makeNotification({
  id: "n1",
  title: "Unread one",
  status: "UNREAD",
});
const read: Notification = makeNotification({
  id: "n2",
  title: "Read one",
  status: "READ",
});

const noop = {
  onOpenDetails: vi.fn(),
  onMarkAsRead: vi.fn(),
  onClearFilters: vi.fn(),
};

function renderList(
  overrides: Partial<React.ComponentProps<typeof NotificationsList>> = {},
) {
  return render(
    <NotificationsList
      notifications={[unread, read]}
      isLoading={false}
      isError={false}
      pendingIds={new Set()}
      hasActiveFilters={false}
      {...noop}
      {...overrides}
    />,
  );
}

describe("NotificationsList", () => {
  it("renders each notification's title and body", () => {
    renderList();

    expect(screen.getByText("Unread one")).toBeInTheDocument();
    expect(screen.getByText("Read one")).toBeInTheDocument();
  });

  it("marks unread notifications non-visually and offers a Mark as read action only for them", () => {
    renderList();

    expect(screen.getAllByText(/Unread:/)).toHaveLength(1);
    expect(
      screen.getAllByRole("button", { name: "Mark as read" }),
    ).toHaveLength(1);
  });

  it("dispatches onOpenDetails when a card is clicked", async () => {
    const user = userEvent.setup();
    const onOpenDetails = vi.fn();
    renderList({ onOpenDetails });

    await user.click(screen.getByText("Unread one"));
    expect(onOpenDetails).toHaveBeenCalledWith(unread);
  });

  it("dispatches onMarkAsRead when its button is clicked", async () => {
    const user = userEvent.setup();
    const onMarkAsRead = vi.fn();
    renderList({ onMarkAsRead });

    await user.click(screen.getByRole("button", { name: "Mark as read" }));
    expect(onMarkAsRead).toHaveBeenCalledWith("n1");
  });

  it("disables a card's Mark as read action while it has a mutation pending", () => {
    renderList({ pendingIds: new Set(["n1"]) });

    expect(screen.getByRole("button", { name: "Mark as read" })).toBeDisabled();
  });

  it("shows a loading skeleton", () => {
    renderList({ isLoading: true, notifications: [] });
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("shows an error state with the given message", () => {
    renderList({
      isError: true,
      notifications: [],
      error: new Error("Network unreachable"),
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Couldn't load your notifications.",
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Network unreachable");
  });

  it("shows the true-empty state when the inbox has nothing at all", () => {
    renderList({ notifications: [], hasActiveFilters: false });
    expect(screen.getByText("You're all caught up")).toBeInTheDocument();
  });

  it("shows the filtered-empty state with a clear-filters action", async () => {
    const user = userEvent.setup();
    const onClearFilters = vi.fn();
    renderList({
      notifications: [],
      hasActiveFilters: true,
      onClearFilters,
    });

    expect(
      screen.getByText("No notifications match your filters"),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(onClearFilters).toHaveBeenCalled();
  });
});
