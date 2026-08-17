"use client";

import { MapPin } from "lucide-react";
import { useFormContext, useWatch } from "react-hook-form";

import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import {
  CITIES,
  getDistrictsForCity,
  getRegionForCity,
} from "@/constants/locations";
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
  // Falls back to whatever the record already stores: a listing created before
  // `CITIES` was closed can carry a city this mapping doesn't cover (see
  // constants/locations.ts), and silently blanking its region would be worse
  // than showing the value it actually has.
  const storedRegion = useWatch({ control, name: "region" });
  const region = getRegionForCity(city) ?? storedRegion;

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
              onChange: (event: React.ChangeEvent<HTMLSelectElement>) => {
                // Changing city invalidates whatever district was chosen for
                // the previous one — a stale district silently pointing at the
                // wrong city would be worse than an empty field.
                setValue("district", "", { shouldDirty: true });
                // Region follows the city rather than being typed. Only
                // overwritten when the new city actually has a mapping, so
                // picking an unmapped legacy city can't wipe a stored region.
                const nextRegion = getRegionForCity(event.target.value);
                if (nextRegion) {
                  setValue("region", nextRegion, { shouldDirty: true });
                }
              },
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

        {/*
          Region is shown, not typed. It used to be a free-text input that was
          *required* before publishing — while having no column in the backend
          model at all (docs/PRODUCT_BACKEND_RECONCILIATION.md §6 lists it as
          MISSING/AMBIGUOUS, and §18 Q4 is still open), so a developer could be
          blocked from publishing by a field that couldn't be persisted. It
          stays on the DTO and is still submitted — it's just derived from the
          city now instead of hand-entered. `register` keeps React Hook Form
          the sole owner of the value; this input is display-only.
        */}
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Region</span>
          <div className="border-border bg-muted/40 text-muted-foreground flex h-9 items-center gap-2 rounded-md border px-3 text-sm">
            <MapPin className="size-3.5 shrink-0" aria-hidden />
            {region ? (
              <span className="text-foreground">{region}</span>
            ) : (
              <span>Set from the city</span>
            )}
          </div>
          <input type="hidden" {...register("region")} />
        </div>

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
