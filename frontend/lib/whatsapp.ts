import type { ListingType } from "@/types";

/** Pre-filled WhatsApp message template — see docs/ARCHITECTURE.md §8. */
export function buildWhatsAppMessage(property: {
  title: string;
  city: string;
  listingType: ListingType;
}): string {
  const action = property.listingType === "SALE" ? "purchase" : "rent";
  return (
    `Hi, I'm interested in the ${action} of your property: ` +
    `"${property.title}" in ${property.city}, listed on ByTe. ` +
    `Can we discuss the details?`
  );
}
