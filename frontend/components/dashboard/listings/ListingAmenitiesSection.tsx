"use client";

import { X } from "lucide-react";
import { useFormContext, useWatch } from "react-hook-form";

import { DashboardSection } from "@/components/dashboard/DashboardSection";
import type { PropertyCategory } from "@/constants/categories";
import { useFeatures } from "@/hooks/useFeatures";
import { getFeatureIcon } from "@/lib/featureIcons";
import type { ListingFormValues } from "@/lib/validation/listing";
import type { Feature } from "@/types";

/**
 * A multi-select feature/amenity picker backed by the shared feature catalog
 * (`services/feature.service.ts`, itself standing in for the ER's
 * `feature`/`property_feature` model) — not freeform text, and not a
 * component-local list, so the amenity taxonomy can't drift between this
 * form and Property Detail's rendering of the same names. Selected features
 * surface immediately as removable chips above the full picker, so a
 * developer can scan what they've chosen without hunting through the pool.
 */
export function ListingAmenitiesSection() {
  const { control, getValues, setValue } = useFormContext<ListingFormValues>();
  const category = useWatch({ control, name: "category" }) as
    PropertyCategory | undefined;
  const amenities = useWatch({ control, name: "amenities" }) ?? [];
  const { data: features, isLoading } = useFeatures(category);

  function toggle(featureName: string) {
    const current = getValues("amenities") ?? [];
    const next = current.includes(featureName)
      ? current.filter((item) => item !== featureName)
      : [...current, featureName];
    setValue("amenities", next, { shouldDirty: true });
  }

  if (!category) {
    return (
      <DashboardSection
        title="Features & amenities"
        description="Choose a category in Basics to see available features."
      >
        <p className="text-muted-foreground text-sm">
          No category selected yet.
        </p>
      </DashboardSection>
    );
  }

  const selected: Feature[] = (features ?? []).filter((feature) =>
    amenities.includes(feature.name),
  );

  return (
    <DashboardSection
      title="Features & amenities"
      description="Select what this property offers."
    >
      <div className="flex flex-col gap-4">
        {selected.length > 0 && (
          <div className="flex flex-wrap gap-2" aria-label="Selected features">
            {selected.map((feature) => {
              const Icon = getFeatureIcon(feature.iconName);
              return (
                <button
                  key={feature.id}
                  type="button"
                  aria-label={`Remove ${feature.name}`}
                  onClick={() => toggle(feature.name)}
                  className="bg-primary/10 text-primary ring-primary/20 hover:bg-primary/15 inline-flex items-center gap-1.5 rounded-full py-1 pr-1.5 pl-2.5 text-xs font-medium ring-1 transition-colors"
                >
                  <Icon className="size-3.5" aria-hidden />
                  {feature.name}
                  <X className="size-3.5" aria-hidden />
                </button>
              );
            })}
          </div>
        )}

        {isLoading ? (
          <p className="text-muted-foreground text-sm">Loading features…</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {(features ?? []).map((feature) => {
              const isSelected = amenities.includes(feature.name);
              const Icon = getFeatureIcon(feature.iconName);
              return (
                <button
                  key={feature.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => toggle(feature.name)}
                  className={`ring-border flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm ring-1 transition-colors ${
                    isSelected
                      ? "bg-primary/10 ring-primary/30"
                      : "hover:bg-muted"
                  }`}
                >
                  <Icon
                    className={
                      isSelected
                        ? "text-primary size-4 shrink-0"
                        : "text-muted-foreground size-4 shrink-0"
                    }
                    aria-hidden
                  />
                  {feature.name}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </DashboardSection>
  );
}
