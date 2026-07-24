"use client";

import { useFormContext, useWatch } from "react-hook-form";

import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { Checkbox } from "@/components/ui/checkbox";
import { AMENITY_POOLS } from "@/constants/amenities";
import type { PropertyCategory } from "@/constants/categories";
import type { ListingFormValues } from "@/lib/validation/listing";

/** A checked-box list drawn from the category's fixed amenity pool — not freeform text, so listing data stays consistent with what the public site filters on. */
export function ListingAmenitiesSection() {
  const { control, getValues, setValue } = useFormContext<ListingFormValues>();
  const category = useWatch({ control, name: "category" }) as
    PropertyCategory | undefined;
  const amenities = useWatch({ control, name: "amenities" }) ?? [];

  function toggle(amenity: string) {
    const current = getValues("amenities") ?? [];
    const next = current.includes(amenity)
      ? current.filter((item) => item !== amenity)
      : [...current, amenity];
    setValue("amenities", next, { shouldDirty: true });
  }

  if (!category) {
    return (
      <DashboardSection
        title="Amenities"
        description="Choose a category in Basics to see available amenities."
      >
        <p className="text-muted-foreground text-sm">
          No category selected yet.
        </p>
      </DashboardSection>
    );
  }

  return (
    <DashboardSection
      title="Amenities"
      description="Select what this property offers."
    >
      <div className="grid gap-2 sm:grid-cols-2">
        {AMENITY_POOLS[category].map((amenity) => (
          <label key={amenity} className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={amenities.includes(amenity)}
              onChange={() => toggle(amenity)}
            />
            {amenity}
          </label>
        ))}
      </div>
    </DashboardSection>
  );
}
