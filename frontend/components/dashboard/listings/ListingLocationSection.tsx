"use client";
import { useFormContext, useWatch } from "react-hook-form";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { useLocations } from "@/hooks/useLocations";
import { useContentLocale as useLanguage } from "@/hooks/useContentLocale";
import type { ListingFormValues } from "@/lib/validation/listing";
const style =
  "border-border bg-background h-9 w-full rounded-md border px-3 text-sm";
export function ListingLocationSection() {
  const {
    control,
    register,
    setValue,
    formState: { errors },
  } = useFormContext<ListingFormValues>();
  const { data: cities = [], isError } = useLocations(),
    { language } = useLanguage(),
    fr = language === "fr";
  const cityId = useWatch({ control, name: "cityId" }),
    districtId = useWatch({ control, name: "districtId" });
  const selected = cities.find((c) => c.id === cityId);
  return (
    <DashboardSection
      title={fr ? "Localisation" : "Location"}
      description={
        fr
          ? "Sélectionnez une ville avant le premier enregistrement."
          : "Choose a city before the first save."
      }
    >
      {isError && (
        <p role="alert">
          {fr
            ? "Impossible de charger les villes."
            : "Cities could not be loaded."}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label={fr ? "Ville" : "City"}
          htmlFor="listing-city"
          error={errors.city?.message}
        >
          <select
            className={style}
            id="listing-city"
            value={cityId ?? ""}
            onChange={(e) => {
              const city = cities.find((c) => c.id === e.target.value);
              setValue("cityId", city?.id ?? "", { shouldDirty: true });
              setValue("city", city?.name ?? "", { shouldDirty: true });
              setValue("districtId", null, { shouldDirty: true });
              setValue("district", "", { shouldDirty: true });
              setValue("region", "", { shouldDirty: true });
            }}
          >
            <option value="">
              {fr ? "Choisir une ville…" : "Choose a city…"}
            </option>
            {cities.map((c) => (
              <option value={c.id} key={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </FormField>
        <FormField
          label={fr ? "Quartier" : "District"}
          htmlFor="listing-district"
        >
          <select
            className={style}
            id="listing-district"
            value={districtId ?? ""}
            disabled={!selected}
            onChange={(e) => {
              const district = selected?.districts.find(
                (d) => d.id === e.target.value,
              );
              setValue("districtId", district?.id ?? null, {
                shouldDirty: true,
              });
              setValue("district", district?.name ?? "", { shouldDirty: true });
            }}
          >
            <option value="">
              {fr ? "Choisir un quartier…" : "Choose a district…"}
            </option>
            {selected?.districts.map((d) => (
              <option value={d.id} key={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </FormField>
        <FormField
          label={fr ? "Adresse" : "Address"}
          htmlFor="listing-address"
          error={errors.address?.message}
        >
          <Input id="listing-address" {...register("address")} />
        </FormField>
      </div>
    </DashboardSection>
  );
}
