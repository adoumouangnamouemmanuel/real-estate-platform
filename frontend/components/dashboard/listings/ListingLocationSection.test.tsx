import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { FormProvider, useForm } from "react-hook-form";

import type { ListingFormValues } from "@/lib/validation/listing";

import { ListingLocationSection } from "./ListingLocationSection";

function Harness() {
  const form = useForm<ListingFormValues>({
    defaultValues: {
      title: "",
      description: "",
      city: "",
      region: "",
      address: "",
      amenities: [],
      media: [],
    } as ListingFormValues,
  });
  return (
    <FormProvider {...form}>
      <ListingLocationSection />
    </FormProvider>
  );
}

describe("ListingLocationSection", () => {
  it("renders city, region, and address fields", () => {
    render(<Harness />);

    expect(screen.getByLabelText("City")).toBeInTheDocument();
    expect(screen.getByLabelText("Region")).toBeInTheDocument();
    expect(screen.getByLabelText("Address")).toBeInTheDocument();
  });

  it("lets the developer choose a city and type a region/address", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.selectOptions(screen.getByLabelText("City"), "Accra");
    await user.type(screen.getByLabelText("Region"), "Greater Accra");
    await user.type(screen.getByLabelText("Address"), "1 Main Street");

    expect(screen.getByLabelText("City")).toHaveValue("Accra");
    expect(screen.getByLabelText("Region")).toHaveValue("Greater Accra");
    expect(screen.getByLabelText("Address")).toHaveValue("1 Main Street");
  });
});
