import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Pagination } from "./Pagination";

describe("Pagination", () => {
  it("renders nothing when there's only one page", () => {
    const { container } = render(
      <Pagination page={1} totalPages={1} onPageChange={vi.fn()} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renders numbered page buttons when the page count is small", () => {
    render(<Pagination page={2} totalPages={4} onPageChange={vi.fn()} />);

    [1, 2, 3, 4].forEach((n) => {
      expect(
        screen.getByRole("button", { name: String(n) }),
      ).toBeInTheDocument();
    });
  });

  it("marks the current page with aria-current", () => {
    render(<Pagination page={2} totalPages={4} onPageChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: "2" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("button", { name: "1" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("falls back to a compact 'Page X of Y' indicator beyond 7 pages", () => {
    render(<Pagination page={5} totalPages={20} onPageChange={vi.fn()} />);

    expect(screen.getByText("Page 5 of 20")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "10" }),
    ).not.toBeInTheDocument();
  });

  it("disables Previous on the first page and Next on the last page", () => {
    render(<Pagination page={1} totalPages={3} onPageChange={vi.fn()} />);

    expect(
      screen.getByRole("button", { name: "Previous page" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Next page" }),
    ).not.toBeDisabled();
  });

  it("calls onPageChange with the next page number when Next is clicked", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Pagination page={2} totalPages={5} onPageChange={onPageChange} />);

    await user.click(screen.getByRole("button", { name: "Next page" }));

    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("calls onPageChange when a numbered page button is clicked", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Pagination page={1} totalPages={4} onPageChange={onPageChange} />);

    await user.click(screen.getByRole("button", { name: "3" }));

    expect(onPageChange).toHaveBeenCalledWith(3);
  });
});
