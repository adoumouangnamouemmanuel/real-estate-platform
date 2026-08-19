import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SortSelect } from "./SortSelect";

describe("SortSelect", () => {
  it("reports the chosen sort immediately", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SortSelect value={undefined} onChange={onChange} />);

    await user.selectOptions(screen.getByLabelText("Sort by"), "price_asc");

    expect(onChange).toHaveBeenCalledWith("price_asc");
  });

  it("falls back to newest when no sort is applied", () => {
    render(<SortSelect value={undefined} onChange={vi.fn()} />);

    expect(screen.getByLabelText("Sort by")).toHaveValue("newest");
  });

  it("reflects the sort currently applied by the URL filters", () => {
    render(<SortSelect value="price_desc" onChange={vi.fn()} />);

    expect(screen.getByLabelText("Sort by")).toHaveValue("price_desc");
  });
});
