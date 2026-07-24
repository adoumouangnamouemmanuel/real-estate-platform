import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { FormProvider, useForm } from "react-hook-form";

import type { ListingFormValues } from "@/lib/validation/listing";

import { ListingPricingSection } from "./ListingPricingSection";

function Harness({ listingType }: { listingType?: "SALE" | "RENT" }) {
  const form = useForm<ListingFormValues>({
    defaultValues: {
      title: "",
      description: "",
      listingType,
      amenities: [],
      media: [],
    } as ListingFormValues,
  });
  return (
    <FormProvider {...form}>
      <ListingPricingSection />
    </FormProvider>
  );
}

describe("ListingPricingSection", () => {
  it("labels the field 'Price' when no listing type or Sale is chosen", () => {
    render(<Harness listingType="SALE" />);
    expect(screen.getByLabelText("Price")).toBeInTheDocument();
  });

  it("labels the field 'Monthly rent' when Rent is chosen", () => {
    render(<Harness listingType="RENT" />);
    expect(screen.getByLabelText("Monthly rent")).toBeInTheDocument();
  });

  it("accepts a numeric price", async () => {
    const user = userEvent.setup();
    render(<Harness listingType="SALE" />);

    await user.type(screen.getByLabelText("Price"), "450000");
    expect(screen.getByLabelText("Price")).toHaveValue(450000);
  });
});
