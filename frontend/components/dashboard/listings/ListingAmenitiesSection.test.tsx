import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { FormProvider, useForm } from "react-hook-form";

import type { PropertyCategory } from "@/constants/categories";
import type { ListingFormValues } from "@/lib/validation/listing";

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
  it("prompts for a category before showing any amenities", () => {
    render(<Harness />);
    expect(screen.getByText("No category selected yet.")).toBeInTheDocument();
  });

  it("shows the category's amenity pool once a category is set", () => {
    render(<Harness category="apartment" />);
    expect(screen.getByText("24/7 Security")).toBeInTheDocument();
    expect(screen.getByText("Fitted Kitchen")).toBeInTheDocument();
  });

  it("toggles an amenity on and off", async () => {
    const user = userEvent.setup();
    render(<Harness category="apartment" />);

    const checkbox = screen.getByLabelText("Parking");
    expect(checkbox).not.toBeChecked();

    await user.click(checkbox);
    expect(checkbox).toBeChecked();

    await user.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });
});
