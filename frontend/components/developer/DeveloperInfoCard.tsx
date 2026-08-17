import { BadgeCheck, Mail } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { DeveloperAvatar } from "@/components/developer/DeveloperAvatar";
import { ROUTES } from "@/constants/routes";
import type { Developer } from "@/types";

interface DeveloperInfoCardProps {
  developer: Developer;
}

/**
 * The property detail page's contact card. The embedded `Developer` shape a
 * property carries deliberately has no email/phone (only the heavier
 * `DeveloperProfile` returned by GET /developers/:slug does — see types/index.ts),
 * so this can't render a contact detail itself without either widening that DTO
 * or inventing one. It links to where the real detail already lives instead:
 * the profile's Contact section. Do not add a WhatsApp/phone affordance here —
 * `FEATURES.WHATSAPP_CONTACT` is the one gate for that, and there is no phone
 * number anywhere in the frontend model.
 */
export function DeveloperInfoCard({ developer }: DeveloperInfoCardProps) {
  return (
    <div className="border-border flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex items-center gap-3">
        <DeveloperAvatar logoUrl={developer.logoUrl} name={developer.name} />
        <div className="flex flex-1 flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <Link
              href={ROUTES.DEVELOPER_DETAIL(developer.slug)}
              className="font-medium hover:underline"
            >
              {developer.name}
            </Link>
            {developer.isVerified && (
              <Badge variant="secondary">
                <BadgeCheck className="size-3.5" aria-hidden />
                Verified
              </Badge>
            )}
          </div>
          {developer.rating !== undefined && (
            <p className="text-muted-foreground text-sm">
              {developer.rating.toFixed(1)} / 5 rating
            </p>
          )}
        </div>
      </div>

      {/* Full-width with a truncating label: `buttonVariants` sets
          `whitespace-nowrap`, so a long developer name would otherwise push the
          card wider than its column and scroll the page at 375px. */}
      <Link
        href={ROUTES.DEVELOPER_CONTACT(developer.slug)}
        className={buttonVariants({
          variant: "outline",
          // `lg` is the design system's largest non-icon size and what every
          // other primary CTA uses (the homepage CTA, FilterPanel's Apply) —
          // the default `h-8` is a row-action size, too small for the only
          // contact affordance on the page.
          size: "lg",
          className: "w-full gap-2",
        })}
      >
        <Mail className="size-4" aria-hidden />
        <span className="truncate">Contact {developer.name}</span>
      </Link>
    </div>
  );
}
