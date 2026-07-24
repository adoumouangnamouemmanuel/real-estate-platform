"use client";

import { useFormContext } from "react-hook-form";

import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { PROPERTY_CATEGORIES } from "@/constants/categories";
import type { ListingFormValues } from "@/lib/validation/listing";

const SELECT_CLASSNAME =
  "border-border bg-background h-9 w-full rounded-md border px-3 text-sm";

/** Title, description, category, and Sale/Rent — what the listing fundamentally is. */
export function ListingBasicsSection() {
  const {
    register,
    formState: { errors },
  } = useFormContext<ListingFormValues>();

  return (
    <DashboardSection title="Basics" description="What you're listing.">
      <div className="flex flex-col gap-4">
        <FormField
          label="Title"
          htmlFor="listing-title"
          error={errors.title?.message}
        >
          <Input
            id="listing-title"
            aria-invalid={!!errors.title}
            {...register("title")}
          />
        </FormField>

        <FormField
          label="Description"
          htmlFor="listing-description"
          error={errors.description?.message}
        >
          <textarea
            id="listing-description"
            rows={4}
            aria-invalid={!!errors.description}
            className="border-border bg-background aria-invalid:border-destructive aria-invalid:ring-destructive/20 focus-visible:ring-ring/50 w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-3 aria-invalid:ring-3"
            {...register("description")}
          />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Category"
            htmlFor="listing-category"
            error={errors.category?.message}
          >
            <select
              id="listing-category"
              aria-invalid={!!errors.category}
              className={SELECT_CLASSNAME}
              {...register("category")}
            >
              <option value="">Choose a category…</option>
              {PROPERTY_CATEGORIES.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Listing type"
            htmlFor="listing-type"
            error={errors.listingType?.message}
          >
            <select
              id="listing-type"
              aria-invalid={!!errors.listingType}
              className={SELECT_CLASSNAME}
              {...register("listingType")}
            >
              <option value="">Choose Sale or Rent…</option>
              <option value="SALE">For Sale</option>
              <option value="RENT">For Rent</option>
            </select>
          </FormField>
        </div>
      </div>
    </DashboardSection>
  );
}
