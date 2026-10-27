import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import i18n from "@/lib/i18n";
import type { ListingFormValues } from "@/lib/validation/listing";
import { ListingLocationSection } from "./ListingLocationSection";
vi.mock("@/hooks/useLocations", () => ({
  useLocations: () => ({
    data: [
      {
        id: "c1",
        name: "Ouagadougou",
        districts: [{ id: "d1", name: "Zone du Bois", cityId: "c1" }],
      },
      {
        id: "c2",
        name: "Bobo-Dioulasso",
        districts: [{ id: "d2", name: "Dafra", cityId: "c2" }],
      },
    ],
  }),
}));
function Harness() {
  const form = useForm<ListingFormValues>({
    defaultValues: { title: "", city: "", district: "", address: "" },
  });
  const value = useWatch({ control: form.control });
  return (
    <FormProvider {...form}>
      <ListingLocationSection />
      <output data-testid="values">{JSON.stringify(value)}</output>
    </FormProvider>
  );
}
describe("canonical Burkina locations", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
  });
  it("loads city choices and does not invent a region", () => {
    render(<Harness />);
    expect(
      screen.getByRole("option", { name: "Ouagadougou" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: "Accra" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Region")).not.toBeInTheDocument();
  });
  it("stores canonical IDs and clears a stale district when the city changes", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    expect(screen.getByLabelText("District")).toBeDisabled();
    await user.selectOptions(screen.getByLabelText("City"), "c1");
    await user.selectOptions(screen.getByLabelText("District"), "d1");
    expect(screen.getByTestId("values")).toHaveTextContent('"districtId":"d1"');
    await user.selectOptions(screen.getByLabelText("City"), "c2");
    expect(screen.getByLabelText("District")).toHaveValue("");
    expect(screen.getByTestId("values")).toHaveTextContent('"cityId":"c2"');
    expect(screen.getByTestId("values")).toHaveTextContent('"districtId":null');
  });
});
