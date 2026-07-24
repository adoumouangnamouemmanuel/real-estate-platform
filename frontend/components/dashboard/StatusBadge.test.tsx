import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  AppointmentStatusBadge,
  PropertyStatusBadge,
  StatusBadge,
} from "./StatusBadge";

describe("StatusBadge", () => {
  it("renders the label text", () => {
    render(<StatusBadge label="Reserved" tone="warning" />);
    expect(screen.getByText("Reserved")).toBeInTheDocument();
  });

  it("maps each property status to a human label", () => {
    const { rerender } = render(<PropertyStatusBadge status="ACTIVE" />);
    expect(screen.getByText("Active")).toBeInTheDocument();

    rerender(<PropertyStatusBadge status="DRAFT" />);
    expect(screen.getByText("Draft")).toBeInTheDocument();

    rerender(<PropertyStatusBadge status="SOLD" />);
    expect(screen.getByText("Sold")).toBeInTheDocument();
  });

  it("maps each appointment status to a human label", () => {
    const { rerender } = render(<AppointmentStatusBadge status="REQUESTED" />);
    expect(screen.getByText("Requested")).toBeInTheDocument();

    rerender(<AppointmentStatusBadge status="COMPLETED" />);
    expect(screen.getByText("Completed")).toBeInTheDocument();
  });
});
