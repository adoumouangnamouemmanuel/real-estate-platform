import { PROPERTY_CATEGORIES } from "@/constants/categories";
import type { Property } from "@/types";

export interface ScoredProperty extends Property {
  /** Human-readable, per-candidate explanation built only from signals that actually matched — never a generic template asserting a similarity dimension that didn't match this specific candidate. */
  reason: string;
  /** Short scannable labels for the same matched signals as `reason` (e.g. "Similar location", "3 shared features") — for compact chip display where a full sentence doesn't fit. Same signals, different rendering; never a second source of truth. */
  tags: string[];
}

const PRICE_PROXIMITY_RATIO = 0.2;
const SIZE_PROXIMITY_RATIO = 0.25;
/** Sharing just one common amenity (e.g. "Parking") is too common to be a meaningful signal on its own — require at least this many shared features before it counts toward the score or the explanation. */
const MIN_SHARED_FEATURES = 2;

/**
 * Deterministic, explainable "Similar Properties" scoring — not a machine
 * learning recommendation, and not a claim of personalization. Category is a
 * hard filter (a Land listing should never appear as "similar" to a House);
 * everything else is a fixed, auditable weighted signal, and the reason
 * string for a given candidate is built only from the signals that actually
 * matched for *that* candidate — see
 * docs/PRODUCT_BACKEND_RECONCILIATION.md §12 for the design rationale.
 */
function scoreCandidate(
  source: Property,
  candidate: Property,
): { score: number; fragments: string[]; tags: string[] } {
  let score = 0;
  const fragments: string[] = [];
  const tags: string[] = [];

  if (candidate.listingType === source.listingType) {
    score += 3;
  }

  if (candidate.city === source.city) {
    score += 3;
    fragments.push(`in ${candidate.city}`);
    tags.push("Similar location");

    if (candidate.district && candidate.district === source.district) {
      score += 2;
      fragments.push(`in the ${candidate.district} area`);
      // Same underlying signal as the city match above (location) — a
      // sharper match raises the score but doesn't earn a second tag.
    }
  }

  if (
    source.price > 0 &&
    Math.abs(candidate.price - source.price) / source.price <=
      PRICE_PROXIMITY_RATIO
  ) {
    score += 2;
    fragments.push("within your price range");
    tags.push("Similar price");
  }

  // Bedrooms is only a meaningful similarity signal for categories that have
  // bedrooms at all — never scored for Land, matching the reconciliation's
  // explicit "LAND should not be scored using bedrooms" instruction.
  if (
    (source.category === "house" || source.category === "apartment") &&
    source.bedrooms !== undefined &&
    candidate.bedrooms === source.bedrooms
  ) {
    score += 1;
    fragments.push("with the same number of bedrooms");
    tags.push("Same bedroom count");
  }

  const sourceSize =
    source.category === "land" ? source.landSizeSqm : source.buildingSizeSqm;
  const candidateSize =
    source.category === "land"
      ? candidate.landSizeSqm
      : candidate.buildingSizeSqm;
  if (
    sourceSize !== undefined &&
    candidateSize !== undefined &&
    sourceSize > 0 &&
    Math.abs(candidateSize - sourceSize) / sourceSize <= SIZE_PROXIMITY_RATIO
  ) {
    score += 1;
    fragments.push("a similar size");
    tags.push("Similar size");
  }

  // Reads the same `amenities: string[]` the feature catalog (services/feature.service.ts)
  // populates — feature overlap as a signal only makes sense because both the
  // source and candidate amenities came from that one shared taxonomy, not two
  // independently hardcoded lists that could name the same thing differently.
  const sharedFeatures = (source.amenities ?? []).filter((amenity) =>
    (candidate.amenities ?? []).includes(amenity),
  );
  if (sharedFeatures.length >= MIN_SHARED_FEATURES) {
    score += 1;
    fragments.push(
      `shares ${sharedFeatures.length} features with this listing`,
    );
    tags.push(`${sharedFeatures.length} shared features`);
  }

  return { score, fragments, tags };
}

function buildReason(candidate: Property, fragments: string[]): string {
  if (fragments.length === 0) {
    const categoryLabel =
      PROPERTY_CATEGORIES.find((option) => option.value === candidate.category)
        ?.label ?? candidate.category;
    return `Similar because it's also listed under ${categoryLabel}.`;
  }

  if (fragments.length === 1) {
    return `Similar because it's ${fragments[0]}.`;
  }

  const last = fragments[fragments.length - 1];
  const rest = fragments.slice(0, -1);
  return `Similar because it's ${rest.join(", ")} and ${last}.`;
}

/**
 * Ranks same-category candidates by the weighted signals above and attaches
 * each result's own explanation. Category match is a hard filter applied by
 * the caller (property.service.ts only passes same-category candidates in),
 * not scored here.
 */
export function rankSimilarProperties(
  source: Property,
  candidates: Property[],
  limit: number,
): ScoredProperty[] {
  return candidates
    .map((candidate) => {
      const { score, fragments, tags } = scoreCandidate(source, candidate);
      return { candidate, score, fragments, tags };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ candidate, fragments, tags }) => ({
      ...candidate,
      reason: buildReason(candidate, fragments),
      tags,
    }));
}
