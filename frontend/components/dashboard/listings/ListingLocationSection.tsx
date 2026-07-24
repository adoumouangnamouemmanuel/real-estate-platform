"use client";

import { useFormContext } from "react-hook-form";

import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { CITIES } from "@/constants/locations";
import type { ListingFormValues } from "@/lib/validation/listing";

const SELECT_CLASSNAME =
  "border-border bg-background h-9 w-full rounded-md border px-3 text-sm";

/** Where the property is — city, region, and the street address buyers/renters see on the detail page. */
export function ListingLocationSection() {
  const {
    register,
    formState: { errors },
  } = useFormContext<ListingFormValues>();

  return (
    <DashboardSection title="Location" description="Where the property is.">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="City"
          htmlFor="listing-city"
          error={errors.city?.message}
        >
          <select
            id="listing-city"
            aria-invalid={!!errors.city}
            className={SELECT_CLASSNAME}
            {...register("city")}
          >
            <option value="">Choose a city…</option>
            {CITIES.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </FormField>

        <FormField
          label="Region"
          htmlFor="listing-region"
          error={errors.region?.message}
        >
          <Input
            id="listing-region"
            aria-invalid={!!errors.region}
            {...register("region")}
          />
        </FormField>

        <div className="sm:col-span-2">
          <FormField
            label="Address"
            htmlFor="listing-address"
            error={errors.address?.message}
          >
            <Input
              id="listing-address"
              aria-invalid={!!errors.address}
              {...register("address")}
            />
          </FormField>
        </div>
      </div>
    </DashboardSection>
  );
}
