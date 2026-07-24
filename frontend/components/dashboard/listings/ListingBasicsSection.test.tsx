import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { FormProvider, useForm } from "react-hook-form";

import type { ListingFormValues } from "@/lib/validation/listing";

import { ListingBasicsSection } from "./ListingBasicsSection";

function Harness({
  defaultValues,
}: {
  defaultValues?: Partial<ListingFormValues>;
}) {
  const form = useForm<ListingFormValues>({
    defaultValues: {
      title: "",
      description: "",
      amenities: [],
      media: [],
      ...defaultValues,
    } as ListingFormValues,
  });
  return (
    <FormProvider {...form}>
      <ListingBasicsSection />
    </FormProvider>
  );
}

describe("ListingBasicsSection", () => {
  it("renders the title, description, category, and listing type fields", () => {
    render(<Harness />);

    expect(screen.getByLabelText("Title")).toBeInTheDocument();
    expect(screen.getByLabelText("Description")).toBeInTheDocument();
    expect(screen.getByLabelText("Category")).toBeInTheDocument();
    expect(screen.getByLabelText("Listing type")).toBeInTheDocument();
  });

  it("lets the developer type a title", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(screen.getByLabelText("Title"), "East Legon Apartment");
    expect(screen.getByLabelText("Title")).toHaveValue("East Legon Apartment");
  });

  it("offers every property category as an option", () => {
    render(<Harness />);

    expect(
      screen.getByRole("option", { name: "Apartments" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Land" })).toBeInTheDocument();
  });
});
