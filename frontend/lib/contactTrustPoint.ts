import { Mail, MessageCircle, type LucideIcon } from "lucide-react";

import { isFeatureEnabled } from "@/constants/features";

export interface ContactTrustPoint {
  icon: LucideIcon;
  title: string;
  description: string;
}

/**
 * What the public site can honestly say about contacting a developer, given the
 * current feature flags.
 *
 * The homepage previously advertised "Direct WhatsApp contact — Message
 * developers directly" as a standing capability while
 * `FEATURES.WHATSAPP_CONTACT` was off and every actual CTA on the site rendered
 * a disabled "(coming soon)" button. Reading the same flag those CTAs read
 * means the marketing claim and the capability can't disagree.
 *
 * The flag-off copy is not a softened version of the same promise — it
 * describes a different thing that genuinely works today: every developer's
 * email is published on their profile, and property pages link straight to it
 * (ROUTES.DEVELOPER_CONTACT). Flipping the flag restores the WhatsApp claim and
 * activates the real CTAs together, with no other change required.
 *
 * Extracted from the page purely so both branches are directly testable —
 * `app/(public)/page.tsx` is an async Server Component that fetches on render.
 */
export function getContactTrustPoint(): ContactTrustPoint {
  if (isFeatureEnabled("WHATSAPP_CONTACT")) {
    return {
      icon: MessageCircle,
      title: "Direct WhatsApp contact",
      description:
        "Message developers directly — no middlemen, no hidden fees.",
    };
  }

  return {
    icon: Mail,
    title: "Direct developer contact",
    description:
      "Every listing names the developer behind it, and their contact details are on their profile — no middlemen.",
  };
}
