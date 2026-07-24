import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { ActivityItem } from "@/types";

import { ActivityTimeline } from "./ActivityTimeline";

const items: ActivityItem[] = [
  {
    id: "act1",
    type: "LISTING_PUBLISHED",
    message: "You published Serviced Office, Airport City.",
    timestamp: "2026-07-23T10:00:00.000Z",
  },
  {
    id: "act2",
    type: "APPOINTMENT_REQUESTED",
    message: "Nadia Owusu requested a viewing.",
    timestamp: "2026-07-22T10:00:00.000Z",
  },
];

describe("ActivityTimeline", () => {
  it("renders one list item per activity, in order", () => {
    render(<ActivityTimeline items={items} />);

    const entries = screen.getAllByRole("listitem");
    expect(entries).toHaveLength(2);
    expect(entries[0]).toHaveTextContent(
      "You published Serviced Office, Airport City.",
    );
    expect(entries[1]).toHaveTextContent("Nadia Owusu requested a viewing.");
  });

  it("exposes each timestamp as a machine-readable <time>", () => {
    render(<ActivityTimeline items={items} />);

    const times = screen.getAllByText(/ago|in /);
    expect(times[0].closest("time")).toHaveAttribute(
      "datetime",
      "2026-07-23T10:00:00.000Z",
    );
  });
});
