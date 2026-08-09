import { APP_NAME } from "@/constants/config";
import type { ListingType } from "@/types";

const MOCK_LATENCY_MS = 400;

export interface WhatsAppLinkResponse {
  deeplink: string;
}

/** Pre-filled WhatsApp message template — see docs/ARCHITECTURE.md §8. */
export function buildWhatsAppMessage(property: {
  title: string;
  city: string;
  listingType: ListingType;
}): string {
  const action = property.listingType === "SALE" ? "purchase" : "rent";
  return (
    `Hi, I'm interested in the ${action} of your property: ` +
    `"${property.title}" in ${property.city}, listed on ${APP_NAME}. ` +
    `Can we discuss the details?`
  );
}

/** General (not property-specific) inquiry message for a developer's profile page. */
export function buildDeveloperWhatsAppMessage(developer: {
  name: string;
}): string {
  return `Hi, I'd like to know more about listings from ${developer.name} on ${APP_NAME}.`;
}

/**
 * Simulates GET /whatsapp-link — deeplink is fetched, not embedded in HTML, per
 * docs/ARCHITECTURE.md §8's number-masking design. Domain-agnostic (property and developer
 * contact CTAs both build a message, then call this) so the click-to-fetch flow lives in one
 * place instead of once per domain. Since no real number exists yet, the mock omits it entirely
 * rather than fabricating one.
 */
export function getWhatsAppLink(
  message: string,
): Promise<WhatsAppLinkResponse> {
  return new Promise((resolve) => {
    setTimeout(
      () =>
        resolve({
          deeplink: `https://wa.me/?text=${encodeURIComponent(message)}`,
        }),
      MOCK_LATENCY_MS,
    );
  });
}
