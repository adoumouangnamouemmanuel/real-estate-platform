"use client";

import { useFormContext, useWatch } from "react-hook-form";

import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { CITIES, getDistrictsForCity } from "@/constants/locations";
import type { ListingFormValues } from "@/lib/validation/listing";

const SELECT_CLASSNAME =
  "border-border bg-background h-9 w-full rounded-md border px-3 text-sm";

/** Where the property is — city, district, region, and the street address buyers/renters see on the detail page. */
export function ListingLocationSection() {
  const {
    control,
    register,
    setValue,
    formState: { errors },
  } = useFormContext<ListingFormValues>();
  const city = useWatch({ control, name: "city" });
  const districts = getDistrictsForCity(city);

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
            {...register("city", {
              // Changing city invalidates whatever district was chosen for
              // the previous one — a stale district silently pointing at the
              // wrong city would be worse than an empty field.
              onChange: () => setValue("district", "", { shouldDirty: true }),
            })}
          >
            <option value="">Choose a city…</option>
            {CITIES.map((cityOption) => (
              <option key={cityOption} value={cityOption}>
                {cityOption}
              </option>
            ))}
          </select>
        </FormField>

        <FormField
          label="District"
          htmlFor="listing-district"
          error={errors.district?.message}
        >
          <select
            id="listing-district"
            aria-invalid={!!errors.district}
            className={SELECT_CLASSNAME}
            disabled={districts.length === 0}
            {...register("district")}
          >
            <option value="">
              {districts.length === 0
                ? "Choose a city first…"
                : "Choose a district…"}
            </option>
            {districts.map((district) => (
              <option key={district} value={district}>
                {district}
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
