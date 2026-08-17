import { ArrowRight, BadgeCheck, Building2, MapPin, Star } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { DeveloperAvatar } from "@/components/developer/DeveloperAvatar";
import { ROUTES } from "@/constants/routes";
import type { Developer } from "@/types";

interface DeveloperCardProps {
  developer: Developer;
  /** The developer's own description, shown as the card's editorial line. Optional because the list DTO (`Developer`) doesn't carry it — only `DeveloperProfile` does. */
  bio?: string;
}

/**
 * A marketplace directory card, deliberately not a marketing tile.
 *
 * Identity is typographic: no developer in the current data model has a logo or
 * cover image, and borrowing a property photo would assert a relationship the
 * data doesn't support — so the monogram carries identity instead (see
 * DeveloperAvatar). That is why this card has no image frame and no
 * `MotionImage`; there is nothing real to zoom.
 *
 * Every value shown is one the model actually holds. Notably absent: a rating
 * count (no such field exists anywhere, so "4.6 (12 reviews)" would be
 * invented), and `totalListings`/`yearsActive`, which stay on the profile
 * rather than being promoted into the directory's primary hierarchy.
 */
export function DeveloperCard({ developer, bio }: DeveloperCardProps) {
  return (
    <Link
      href={ROUTES.DEVELOPER_DETAIL(developer.slug)}
      className="group bg-card ring-border hover:ring-primary/30 focus-visible:ring-ring/50 relative flex h-full flex-col gap-4 rounded-xl p-5 ring-1 transition-[box-shadow,transform,--tw-ring-color] duration-300 outline-none hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-3"
    >
      <div className="flex items-start gap-4">
        <DeveloperAvatar
          logoUrl={developer.logoUrl}
          name={developer.name}
          size={72}
          tone="monogram"
        />

        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          {/*
            The Verified badge sits with the name rather than in a metadata row
            so the claim is unambiguously about this developer. It renders only
            when `isVerified` is genuinely true — one of the three seeded
            developers is false, so this is a real conditional, not decoration.
            The word "Verified" carries the meaning; the icon and colour are
            reinforcement, never the only signal (WCAG 1.4.1).
          */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {/* h2: the page's only other heading is the hero's h1, so this is
                the correct next level — no skipped rank. */}
            <h2 className="font-heading text-base leading-tight font-semibold tracking-tight">
              {developer.name}
            </h2>
            {developer.isVerified && (
              <Badge variant="secondary" className="shrink-0">
                <BadgeCheck className="size-3.5" aria-hidden />
                Verified
              </Badge>
            )}
          </div>

          <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
            <MapPin className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">
              {developer.city}, {developer.region}
            </span>
          </p>
        </div>
      </div>

      {/*
        The bio is the card's editorial substance and the one thing that makes
        developers distinguishable at a glance — it already exists in the data
        and was previously only visible on the profile page. Clamped to three
        lines so cards keep an even rhythm across differing bio lengths without
        an arbitrary fixed height; `min-h` reserves the clamp's worth of space so
        a short bio doesn't leave its neighbour's footer misaligned.
      */}
      {bio && (
        <p className="text-muted-foreground line-clamp-3 min-h-15 text-sm leading-relaxed">
          {bio}
        </p>
      )}

      {/* `mt-auto` pins the metadata + CTA to the bottom, so every card in a row
          shares one baseline regardless of name wrapping or bio length. */}
      <div className="border-border mt-auto flex items-center justify-between gap-3 border-t pt-4">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <Building2 className="size-3.5 shrink-0" aria-hidden />
            {developer.activeListings} active
          </span>
          {developer.rating !== undefined && (
            <span className="flex items-center gap-1.5">
              <Star
                className="fill-brand-gold text-brand-gold size-3.5 shrink-0"
                aria-hidden
              />
              <span className="tabular-nums">
                {developer.rating.toFixed(1)}
              </span>
              <span className="text-muted-foreground">/ 5</span>
            </span>
          )}
        </div>

        {/*
          The whole card is the link, so this is a visual affordance rather than
          a second focus stop — `aria-hidden` keeps screen readers from hearing a
          duplicate "View profile" after the card's own accessible name.
        */}
        <span
          aria-hidden
          className="text-primary flex shrink-0 items-center gap-1 text-sm font-medium"
        >
          View
          <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
