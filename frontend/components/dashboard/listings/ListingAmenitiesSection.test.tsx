import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { FormProvider, useForm } from "react-hook-form";

import type { PropertyCategory } from "@/constants/categories";
import type { ListingFormValues } from "@/lib/validation/listing";
import { renderWithQueryClient } from "@/test/renderWithQueryClient";

import { ListingAmenitiesSection } from "./ListingAmenitiesSection";

function Harness({ category }: { category?: PropertyCategory }) {
  const form = useForm<ListingFormValues>({
    defaultValues: {
      title: "",
      description: "",
      category,
      amenities: [],
      media: [],
    } as ListingFormValues,
  });
  return (
    <FormProvider {...form}>
      <ListingAmenitiesSection />
    </FormProvider>
  );
}

describe("ListingAmenitiesSection", () => {
  it("prompts for a category before showing any features", () => {
    renderWithQueryClient(<Harness />);
    expect(screen.getByText("No category selected yet.")).toBeInTheDocument();
  });

  it("shows the category's feature catalog once a category is set", async () => {
    renderWithQueryClient(<Harness category="apartment" />);
    expect(
      await screen.findByRole("button", { name: "24/7 Security" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Fitted Kitchen" }),
    ).toBeInTheDocument();
  });

  it("excludes features not offered for the selected category", async () => {
    renderWithQueryClient(<Harness category="land" />);
    expect(
      await screen.findByRole("button", { name: "Registered Title" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Fitted Kitchen" }),
    ).not.toBeInTheDocument();
  });

  it("toggles a feature on and off, surfacing it as a selected chip while active", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<Harness category="apartment" />);

    const parkingButton = await screen.findByRole("button", {
      name: "Parking",
    });
    expect(parkingButton).toHaveAttribute("aria-pressed", "false");
    expect(
      screen.queryByLabelText("Selected features"),
    ).not.toBeInTheDocument();

    await user.click(parkingButton);
    await waitFor(() =>
      expect(parkingButton).toHaveAttribute("aria-pressed", "true"),
    );
    const chipGroup = screen.getByLabelText("Selected features");
    expect(chipGroup).toHaveTextContent("Parking");

    await user.click(screen.getByRole("button", { name: "Remove Parking" }));
    await waitFor(() =>
      expect(parkingButton).toHaveAttribute("aria-pressed", "false"),
    );
    expect(
      screen.queryByLabelText("Selected features"),
    ).not.toBeInTheDocument();
  });
});
