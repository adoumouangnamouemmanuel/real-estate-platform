import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { FormProvider, useForm } from "react-hook-form";

import type { ListingFormValues } from "@/lib/validation/listing";

import { ListingLocationSection } from "./ListingLocationSection";

function Harness({
  city = "",
  region = "",
}: {
  city?: string;
  region?: string;
}) {
  const form = useForm<ListingFormValues>({
    defaultValues: {
      title: "",
      description: "",
      city,
      region,
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
  it("renders city, district, and address fields, with region shown rather than typed", () => {
    render(<Harness />);

    expect(screen.getByLabelText("City")).toBeInTheDocument();
    expect(screen.getByLabelText("District")).toBeInTheDocument();
    expect(screen.getByLabelText("Address")).toBeInTheDocument();
    // Region is derived from the city, not entered — it has no backend column
    // to persist a hand-typed value into (see the section's own comment and
    // docs/PRODUCT_BACKEND_RECONCILIATION.md §6/§18 Q4).
    expect(screen.queryByLabelText("Region")).not.toBeInTheDocument();
    expect(screen.getByText("Region")).toBeInTheDocument();
    expect(screen.getByText("Set from the city")).toBeInTheDocument();
  });

  it("lets the developer choose a city and type an address", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.selectOptions(screen.getByLabelText("City"), "Accra");
    await user.type(screen.getByLabelText("Address"), "1 Main Street");

    expect(screen.getByLabelText("City")).toHaveValue("Accra");
    expect(screen.getByLabelText("Address")).toHaveValue("1 Main Street");
  });

  it("derives the region from the selected city and updates it when the city changes", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.selectOptions(screen.getByLabelText("City"), "Accra");
    expect(screen.getByText("Greater Accra")).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("City"), "Kumasi");
    expect(screen.getByText("Ashanti")).toBeInTheDocument();
    expect(screen.queryByText("Greater Accra")).not.toBeInTheDocument();
  });

  it("keeps a stored region for a legacy city the closed CITIES list doesn't cover", () => {
    render(<Harness city="Ada Foah" region="Greater Accra" />);

    // Nothing maps "Ada Foah" (it predates CITIES), so the record's own region
    // must survive rather than being blanked.
    expect(screen.getByText("Greater Accra")).toBeInTheDocument();
  });

  it("disables the district select until a city is chosen, then offers that city's districts", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    expect(screen.getByLabelText("District")).toBeDisabled();

    await user.selectOptions(screen.getByLabelText("City"), "Accra");
    expect(screen.getByLabelText("District")).toBeEnabled();
    await user.selectOptions(screen.getByLabelText("District"), "Osu");
    expect(screen.getByLabelText("District")).toHaveValue("Osu");
  });

  it("clears the selected district when the city changes", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.selectOptions(screen.getByLabelText("City"), "Accra");
    await user.selectOptions(screen.getByLabelText("District"), "Osu");
    expect(screen.getByLabelText("District")).toHaveValue("Osu");

    await user.selectOptions(screen.getByLabelText("City"), "Kumasi");
    expect(screen.getByLabelText("District")).toHaveValue("");
  });
});
