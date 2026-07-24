import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ListingsFilterBar } from "./ListingsFilterBar";

describe("ListingsFilterBar", () => {
  it("applies the keyword only on submit, not per keystroke", async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();

    render(<ListingsFilterBar filters={{}} onApply={onApply} />);

    await user.type(screen.getByLabelText("Search"), "east legon");
    expect(onApply).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Apply" }));
    expect(onApply).toHaveBeenCalledWith({ q: "east legon" });
  });

  it("applies a status change immediately", async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();

    render(<ListingsFilterBar filters={{}} onApply={onApply} />);

    await user.selectOptions(screen.getByLabelText("Status"), "DRAFT");
    expect(onApply).toHaveBeenCalledWith({ status: "DRAFT" });
  });

  it("applies a page-size change immediately", async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();

    render(<ListingsFilterBar filters={{}} onApply={onApply} />);

    await user.selectOptions(screen.getByLabelText("Rows per page"), "25");
    expect(onApply).toHaveBeenCalledWith({ pageSize: 25 });
  });
});
