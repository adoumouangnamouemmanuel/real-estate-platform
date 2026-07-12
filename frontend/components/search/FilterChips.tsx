import { X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { PROPERTY_CATEGORIES } from "@/constants/categories";
import { formatPrice } from "@/lib/formatters";
import type { GetPropertiesParams } from "@/services";

interface FilterChipsProps {
  filters: GetPropertiesParams;
  onRemove: (key: keyof GetPropertiesParams) => void;
}

export function FilterChips({ filters, onRemove }: FilterChipsProps) {
  const chips: { key: keyof GetPropertiesParams; label: string }[] = [];

  if (filters.q) chips.push({ key: "q", label: `"${filters.q}"` });

  if (filters.category) {
    const category = PROPERTY_CATEGORIES.find(
      (option) => option.value === filters.category,
    );
    chips.push({ key: "category", label: category?.label ?? filters.category });
  }

  if (filters.city) chips.push({ key: "city", label: filters.city });

  if (filters.minPrice !== undefined) {
    chips.push({
      key: "minPrice",
      label: `Min ${formatPrice(filters.minPrice)}`,
    });
  }

  if (filters.maxPrice !== undefined) {
    chips.push({
      key: "maxPrice",
      label: `Max ${formatPrice(filters.maxPrice)}`,
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <Badge key={chip.key} variant="outline" className="py-1 pr-1 pl-2">
          {chip.label}
          <button
            type="button"
            onClick={() => onRemove(chip.key)}
            aria-label={`Remove ${chip.label} filter`}
            className="hover:bg-muted rounded-full p-0.5"
          >
            <X className="size-3" aria-hidden />
          </button>
        </Badge>
      ))}
    </div>
  );
}
