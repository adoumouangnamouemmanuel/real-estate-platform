import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { FormProvider, useForm } from "react-hook-form";

import type { PropertyCategory } from "@/constants/categories";
import type { ListingFormValues } from "@/lib/validation/listing";

import { ListingMeasurementsSection } from "./ListingMeasurementsSection";

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
      <ListingMeasurementsSection />
    </FormProvider>
  );
}

describe("ListingMeasurementsSection", () => {
  it("prompts for a category before showing any fields", () => {
    render(<Harness />);
    expect(screen.getByText("No category selected yet.")).toBeInTheDocument();
  });

  it("shows bedrooms/bathrooms/car spaces/building size/year built for House, never land size", () => {
    render(<Harness category="house" />);
    expect(screen.getByLabelText("Bedrooms")).toBeInTheDocument();
    expect(screen.getByLabelText("Bathrooms")).toBeInTheDocument();
    expect(screen.getByLabelText("Car spaces")).toBeInTheDocument();
    expect(screen.getByLabelText("Building size (m²)")).toBeInTheDocument();
    expect(screen.getByLabelText("Year built")).toBeInTheDocument();
    expect(screen.queryByLabelText("Land size (m²)")).not.toBeInTheDocument();
  });

  it("shows only land size for Land — no bedrooms/bathrooms/car spaces/year built", () => {
    render(<Harness category="land" />);
    expect(screen.getByLabelText("Land size (m²)")).toBeInTheDocument();
    expect(screen.queryByLabelText("Bedrooms")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Bathrooms")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Car spaces")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Year built")).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText("Building size (m²)"),
    ).not.toBeInTheDocument();
  });

  it("shows building size/car spaces/year built for Commercial, never bedrooms/bathrooms", () => {
    render(<Harness category="commercial" />);
    expect(screen.getByLabelText("Building size (m²)")).toBeInTheDocument();
    expect(screen.getByLabelText("Car spaces")).toBeInTheDocument();
    expect(screen.getByLabelText("Year built")).toBeInTheDocument();
    expect(screen.queryByLabelText("Bedrooms")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Bathrooms")).not.toBeInTheDocument();
  });

  it("accepts a selected bedroom count and clears to undefined when reset to the placeholder", async () => {
    const user = userEvent.setup();
    render(<Harness category="house" />);

    const bedrooms = screen.getByLabelText("Bedrooms");
    await user.selectOptions(bedrooms, "3");
    expect(bedrooms).toHaveValue("3");

    await user.selectOptions(bedrooms, "");
    expect(bedrooms).toHaveValue("");
  });
});
