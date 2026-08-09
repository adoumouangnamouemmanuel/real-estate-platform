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
  // Only one verified, unambiguous vacant-land/field photo was found — a
  // pool of 1 is deliberate (see buildPropertyMedia's dedupe below) rather
  // than padding it with another category's image or an unverified guess.
  land: ["1500382017468-9049fed747ef"],
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
