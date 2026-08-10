"use client";

import { useFormContext, useWatch } from "react-hook-form";

import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import type { PropertyCategory } from "@/constants/categories";
import type { ListingFormValues } from "@/lib/validation/listing";

/**
 * Which measurement/structural fields apply to each category — the same
 * "don't show every field to every property type" rule the reconciliation
 * asked for (Part 5), applied here instead of duplicated per-category form
 * variants. LAND is the one category with no bedrooms/bathrooms/car
 * spaces/year-built concept at all; its only measurement is land size.
 */
const CATEGORY_FIELDS: Record<
  PropertyCategory,
  {
    bedrooms: boolean;
    bathrooms: boolean;
    carSpaces: boolean;
    yearBuilt: boolean;
    buildingSize: boolean;
    landSize: boolean;
  }
> = {
  house: {
    bedrooms: true,
    bathrooms: true,
    carSpaces: true,
    yearBuilt: true,
    buildingSize: true,
    landSize: false,
  },
  apartment: {
    bedrooms: true,
    bathrooms: true,
    carSpaces: true,
    yearBuilt: true,
    buildingSize: true,
    landSize: false,
  },
  land: {
    bedrooms: false,
    bathrooms: false,
    carSpaces: false,
    yearBuilt: false,
    buildingSize: false,
    landSize: true,
  },
  commercial: {
    bedrooms: false,
    bathrooms: false,
    carSpaces: true,
    yearBuilt: true,
    buildingSize: true,
    landSize: false,
  },
  office: {
    bedrooms: false,
    bathrooms: false,
    carSpaces: true,
    yearBuilt: true,
    buildingSize: true,
    landSize: false,
  },
};

const numberField = (
  register: ReturnType<typeof useFormContext<ListingFormValues>>["register"],
  name: "bedrooms" | "bathrooms" | "carSpaces" | "yearBuilt",
) =>
  register(name, {
    setValueAs: (value: string) => (value === "" ? undefined : Number(value)),
  });

/**
 * Category-aware structural details — bedrooms/bathrooms/car spaces/year
 * built for House & Apartment, land size for Land, building size + car
 * spaces for Commercial/Office. Renders nothing beyond the category prompt
 * until a category is chosen, mirroring ListingAmenitiesSection's pattern.
 */
export function ListingMeasurementsSection() {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<ListingFormValues>();
  const category = useWatch({ control, name: "category" }) as
    PropertyCategory | undefined;

  if (!category) {
    return (
      <DashboardSection
        title="Details"
        description="Choose a category in Basics to see the relevant details."
      >
        <p className="text-muted-foreground text-sm">
          No category selected yet.
        </p>
      </DashboardSection>
    );
  }

  const fields = CATEGORY_FIELDS[category];

  return (
    <DashboardSection
      title="Details"
      description="Structural details buyers and renters look for."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {fields.landSize && (
          <FormField
            label="Land size (m²)"
            htmlFor="listing-land-size"
            error={errors.landSizeSqm?.message}
          >
            <Input
              id="listing-land-size"
              type="number"
              min={0}
              inputMode="decimal"
              aria-invalid={!!errors.landSizeSqm}
              {...register("landSizeSqm", {
                setValueAs: (value: string) =>
                  value === "" ? undefined : Number(value),
              })}
            />
          </FormField>
        )}

        {fields.buildingSize && (
          <FormField
            label="Building size (m²)"
            htmlFor="listing-building-size"
            error={errors.buildingSizeSqm?.message}
          >
            <Input
              id="listing-building-size"
              type="number"
              min={0}
              inputMode="decimal"
              aria-invalid={!!errors.buildingSizeSqm}
              {...register("buildingSizeSqm", {
                setValueAs: (value: string) =>
                  value === "" ? undefined : Number(value),
              })}
            />
          </FormField>
        )}

        {fields.bedrooms && (
          <FormField
            label="Bedrooms"
            htmlFor="listing-bedrooms"
            error={errors.bedrooms?.message}
          >
            <Input
              id="listing-bedrooms"
              type="number"
              min={0}
              inputMode="numeric"
              aria-invalid={!!errors.bedrooms}
              {...numberField(register, "bedrooms")}
            />
          </FormField>
        )}

        {fields.bathrooms && (
          <FormField
            label="Bathrooms"
            htmlFor="listing-bathrooms"
            error={errors.bathrooms?.message}
          >
            <Input
              id="listing-bathrooms"
              type="number"
              min={0}
              inputMode="numeric"
              aria-invalid={!!errors.bathrooms}
              {...numberField(register, "bathrooms")}
            />
          </FormField>
        )}

        {fields.carSpaces && (
          <FormField
            label="Car spaces"
            htmlFor="listing-car-spaces"
            error={errors.carSpaces?.message}
          >
            <Input
              id="listing-car-spaces"
              type="number"
              min={0}
              inputMode="numeric"
              aria-invalid={!!errors.carSpaces}
              {...numberField(register, "carSpaces")}
            />
          </FormField>
        )}

        {fields.yearBuilt && (
          <FormField
            label="Year built"
            htmlFor="listing-year-built"
            error={errors.yearBuilt?.message}
          >
            <Input
              id="listing-year-built"
              type="number"
              min={1800}
              max={new Date().getFullYear() + 1}
              inputMode="numeric"
              aria-invalid={!!errors.yearBuilt}
              {...numberField(register, "yearBuilt")}
            />
          </FormField>
        )}
      </div>
    </DashboardSection>
  );
}
