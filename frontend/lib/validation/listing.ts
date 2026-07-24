import { z } from "zod";

import { PROPERTY_CATEGORIES } from "@/constants/categories";

const CATEGORY_VALUES = PROPERTY_CATEGORIES.map((c) => c.value) as [
  string,
  ...string[],
];

const mediaSchema = z.object({
  url: z.string(),
  publicId: z.string(),
  order: z.number(),
});

/**
 * One schema, one set of field definitions — not two independently maintained
 * "draft" and "publish" schemas that could drift apart. Every field is lenient
 * here (a draft can be nearly empty); `publishListingSchema` below layers the
 * stricter "ready to go live" requirements on top via `.extend()`, so the
 * publish profile is always a superset of this base, never a parallel copy.
 */
export const listingSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required.")
    .max(120, "Title is too long."),
  description: z
    .string()
    .trim()
    .max(2000, "Description is too long.")
    .optional()
    .or(z.literal("")),
  // The price field's `register` call uses `setValueAs` (not `valueAsNumber`)
  // to convert an empty input straight to `undefined` before it ever reaches
  // this schema — RHF's `valueAsNumber` would otherwise report an untouched
  // field as NaN, which z.number() rejects outright.
  price: z.number().positive("Price must be greater than 0.").optional(),
  // A native <select>'s unselected state submits "" (empty string), not
  // undefined — accept it as equivalent to "not chosen yet" for a draft.
  listingType: z.enum(["SALE", "RENT"]).optional().or(z.literal("")),
  category: z.enum(CATEGORY_VALUES).optional().or(z.literal("")),
  city: z.string().trim().optional().or(z.literal("")),
  region: z.string().trim().optional().or(z.literal("")),
  address: z.string().trim().optional().or(z.literal("")),
  amenities: z.array(z.string()).optional(),
  media: z.array(mediaSchema).optional(),
});

export type ListingFormValues = z.infer<typeof listingSchema>;

/**
 * The "ready to publish" profile: everything a live, publicly-visible listing
 * needs that a draft doesn't. Only invoked when the developer clicks Publish —
 * never on every autosave tick, since a draft is allowed to be incomplete.
 */
export const publishListingSchema = listingSchema.extend({
  description: z.string().trim().min(1, "Add a description before publishing."),
  price: z.number().positive("Add a price before publishing."),
  listingType: z.enum(["SALE", "RENT"], {
    error: "Choose Sale or Rent before publishing.",
  }),
  category: z.enum(CATEGORY_VALUES, {
    error: "Choose a category before publishing.",
  }),
  city: z.string().trim().min(1, "Add a city before publishing."),
  region: z.string().trim().min(1, "Add a region before publishing."),
  address: z.string().trim().min(1, "Add an address before publishing."),
  media: z
    .array(mediaSchema)
    .min(1, "Add at least one photo before publishing."),
});

export type PublishValidationResult =
  { success: true } | { success: false; errors: string[] };

/**
 * Runs the stricter publish profile and returns a flat, human-readable error
 * list — used to build the "here's what's missing" summary the Publish button
 * shows instead of scattering zod's raw issue objects through the UI.
 */
export function validateForPublish(
  values: ListingFormValues,
): PublishValidationResult {
  const result = publishListingSchema.safeParse(values);
  if (result.success) return { success: true };

  return {
    success: false,
    errors: result.error.issues.map((issue) => issue.message),
  };
}
