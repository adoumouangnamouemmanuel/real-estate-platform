import { z } from "zod";
export const listingPatchSchema = z
  .object({
    title: z.string().trim().min(1).max(120).optional(),
    description: z.string().max(2000).optional(),
    price: z
      .number()
      .finite()
      .min(0)
      .max(9999999999999.99)
      .refine(
        (v) => /^\d+(\.\d{1,2})?$/.test(String(v)),
        "Use at most two decimal places",
      )
      .optional(),
    listingType: z.enum(["SALE", "RENT", ""]).optional(),
    category: z
      .enum([
        "apartment",
        "house",
        "land",
        "commercial",
        "office",
        "APARTMENT",
        "HOUSE",
        "LAND",
        "COMMERCIAL",
        "OFFICE",
        "",
      ])
      .optional(),
    cityId: z.string().optional(),
    districtId: z.string().nullable().optional(),
    city: z.string().optional(),
    district: z.string().optional(),
    region: z.literal("").optional(),
    address: z.string().max(500).optional(),
    featureIds: z.array(z.string().min(1)).max(50).optional(),
    amenities: z.array(z.string()).optional(),
    bedrooms: z.number().int().min(0).max(1000).nullable().optional(),
    bathrooms: z.number().int().min(0).max(1000).nullable().optional(),
    carSpaces: z.number().int().min(0).max(10000).nullable().optional(),
    yearBuilt: z.number().int().min(1800).max(2200).nullable().optional(),
    landSizeSqm: z.number().positive().max(99999999.99).nullable().optional(),
    buildingSizeSqm: z
      .number()
      .positive()
      .max(99999999.99)
      .nullable()
      .optional(),
    media: z
      .array(
        z.object({
          url: z.string().max(4000),
          publicId: z.string().min(1).max(500),
          order: z.number().int().min(0),
        }),
      )
      .max(30)
      .optional(),
    contentLanguage: z.string().regex(/^[a-z]{2,3}(-[a-z0-9]{2,8})*$/),
    rowVersion: z.number().int().positive().optional(),
    currencyCode: z.literal("XOF").optional(),
    rentPeriod: z.enum(["DAY", "WEEK", "MONTH", "YEAR"]).nullable().optional(),
  })
  .strict();
