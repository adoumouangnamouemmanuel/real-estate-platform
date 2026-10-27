"use client";

import { useContentLocale } from "@/hooks/useContentLocale";
import { useFormContext, useWatch } from "react-hook-form";

import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import type { ListingFormValues } from "@/lib/validation/listing";

/** Price, labeled per Sale vs. Rent (chosen in Basics) so "price" always reads unambiguously. */
export function ListingPricingSection() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<ListingFormValues>();
  const listingType = useWatch({ control, name: "listingType" });

  const { language } = useContentLocale();
  const fr = language === "fr";
  const label = fr ? "Prix" : "Price";

  return (
    <DashboardSection title="Pricing" description="What it costs.">
      <FormField
        label={label}
        htmlFor="listing-price"
        error={errors.price?.message}
      >
        <Input
          id="listing-price"
          type="number"
          min={0}
          inputMode="numeric"
          aria-invalid={!!errors.price}
          {...register("price", {
            // Not valueAsNumber: an empty input reports NaN under that option,
            // which the schema's z.number() rejects outright — coerce empty
            // to undefined instead, so an untouched price stays draft-valid.
            setValueAs: (value) => (value === "" ? undefined : Number(value)),
          })}
        />
      </FormField>
      <FormField label={fr ? "Devise" : "Currency"} htmlFor="listing-currency">
        <select id="listing-currency" {...register("currencyCode")}>
          <option value="">{fr ? "À confirmer" : "Confirm currency"}</option>
          <option value="XOF">XOF / CFA</option>
        </select>
      </FormField>
      {listingType === "RENT" && (
        <FormField
          label={fr ? "Période du loyer" : "Rental period"}
          htmlFor="listing-rent-period"
        >
          <select id="listing-rent-period" {...register("rentPeriod")}>
            <option value="">
              {fr ? "Choisir une période" : "Choose a period"}
            </option>
            <option value="DAY">{fr ? "Jour" : "Day"}</option>
            <option value="WEEK">{fr ? "Semaine" : "Week"}</option>
            <option value="MONTH">{fr ? "Mois" : "Month"}</option>
            <option value="YEAR">{fr ? "Année" : "Year"}</option>
          </select>
        </FormField>
      )}
    </DashboardSection>
  );
}
