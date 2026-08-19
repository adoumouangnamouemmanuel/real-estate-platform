import type { PropertyCategory } from "@/constants/categories";
import type { PropertyMedia } from "@/types";

/**
 * Demo/mock photography only — real, licensed Unsplash photos standing in
 * for real listing media until real developer uploads exist (see
 * `uploadService`/ADR-007's mock-first precedent). Never present these as
 * verified real-world properties; they illustrate the category, not an
 * actual address. A real backend replaces `Property.media` entirely with
 * Cloudinary URLs uploaded by the developer — this whole file disappears on
 * that day, the `PropertyMedia` shape does not change. Shared between the
 * properties mock (per-listing photos) and the homepage (category/hero
 * imagery) rather than living inside `services/mocks/properties.mock.ts`,
 * since nothing outside a service should reach into another domain's mock
 * file directly (ADR-007) — this is presentation-layer asset data, not
 * Property domain data, so it belongs in `lib/`, not a mock.
 */
/**
 * Every id below was downloaded and visually inspected before being assigned
 * here (see the Public Experience Review) — a prior pass picked ids from
 * memory of what the filename/id "should" show, and three categories ended
 * up rendering the wrong kind of property entirely (a residential house and
 * a living room for "commercial", a heritage palace for "land"). Do not add
 * a new id to any pool without opening it first.
 */
const CATEGORY_IMAGE_POOL: Record<PropertyCategory, string[]> = {
  house: [
    "1560448204-e02f11c3d0e2",
    "1600585154340-be6161a56a0c",
    "1522708323590-d24dbb6b0267",
    "1600607687939-ce8a6c25118c",
    "1613977257363-707ba9348227",
  ],
  apartment: [
    "1512915922686-57c11dde9b6b",
    "1512917774080-9991f1c4c750",
    "1570129477492-45c003edd2be",
    "1600596542815-ffad4c1539a9",
  ],
  // Expanded from one photo to three. A pool of 1 meant every land listing —
  // and all three cards in the homepage's land section — rendered the same
  // photograph, which read as placeholder content. Each addition was resolved
  // from its Unsplash page, downloaded and opened before being added, per the
  // rule above; candidates that turned out to be grazing pasture with cattle,
  // a storm-lit deforested slope, and a badlands canyon were rejected as
  // misleading or tonally wrong for a land listing rather than accepted to
  // pad the pool.
  land: [
    "1500382017468-9049fed747ef", // wheat field at sunset, distant treeline
    "1697627903173-e22b6e04734d", // flat open field, autumn treeline, clear sky
    "1599809563132-4b678fb6f611", // bare cleared plot, dramatic cloud cover
  ],
  commercial: [
    "1587293852726-70cdb56c2866", // warehouse interior, shelving
    "1565793298595-6a879b1d9492", // aerial view, logistics yard
    "1590674899484-d5640e854abe", // parking garage
  ],
  office: [
    "1497366216548-37526070297c", // open-plan office floor
    "1497215728101-856f4ea42174", // desk, laptop, city-view window
    "1497366811353-6870744d04b2", // meeting room
  ],
};

function unsplashUrl(photoId: string, width: number): string {
  return `https://images.unsplash.com/photo-${photoId}?w=${width}&q=80&auto=format&fit=crop`;
}

export function buildPropertyMedia(
  category: PropertyCategory,
  seed: number,
  count = 2,
): PropertyMedia[] {
  const pool = CATEGORY_IMAGE_POOL[category];
  // Never repeat the same photo twice in one listing's gallery — a pool
  // smaller than `count` (e.g. land's single verified photo) yields fewer
  // media items instead of an identical thumbnail sitting next to itself.
  const effectiveCount = Math.min(count, pool.length);
  return Array.from({ length: effectiveCount }, (_, index) => {
    const photoId = pool[(seed + index) % pool.length];
    return {
      url: unsplashUrl(photoId, 1600),
      publicId: `mock/${category}/${photoId}`,
      order: index,
    };
  });
}

/** One representative demo photo per category — used by the homepage's "Explore by Category" cards. */
export function getCategoryImageUrl(
  category: PropertyCategory,
  width = 800,
): string {
  return unsplashUrl(CATEGORY_IMAGE_POOL[category][0], width);
}

/** The homepage hero's full-bleed background photo — same demo/mock provenance as every other image here. */
export const HERO_IMAGE_URL = unsplashUrl("1600585154340-be6161a56a0c", 2000);

/**
 * The homepage hero's cinematic crossfade rotation — one verified photo per
 * category (reusing ids already inspected in CATEGORY_IMAGE_POOL above,
 * never new ones) so the opening moment previews the range of what's on the
 * platform rather than looping a single frame.
 */
export const HERO_IMAGES: { src: string; alt: string }[] = [
  { src: HERO_IMAGE_URL, alt: "" },
  { src: unsplashUrl(CATEGORY_IMAGE_POOL.apartment[0], 2000), alt: "" },
  { src: unsplashUrl(CATEGORY_IMAGE_POOL.land[0], 2000), alt: "" },
  { src: unsplashUrl(CATEGORY_IMAGE_POOL.commercial[1], 2000), alt: "" },
];
