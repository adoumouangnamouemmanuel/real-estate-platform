import {
  BadgeCheck,
  Building2,
  Globe,
  Mail,
  MapPin,
  MessageCircle,
  Star,
} from "lucide-react";

import { WhatsAppCTA } from "@/components/common/WhatsAppCTA";
import { MapPlaceholder } from "@/components/common/MapPlaceholder";
import { ScrollToHash } from "@/components/common/ScrollToHash";
import { DeveloperAvatar } from "@/components/developer/DeveloperAvatar";
import { MotionReveal } from "@/components/motion";
import { PropertyGrid } from "@/components/property/PropertyGrid";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { isFeatureEnabled } from "@/constants/features";
import { buildDeveloperWhatsAppMessage } from "@/lib/whatsapp";
import type { DeveloperProfile, Property } from "@/types";

interface DeveloperProfileViewProps {
  developer: DeveloperProfile;
  activeListings: Property[];
}

const SOCIAL_LINKS: {
  key: keyof DeveloperProfile["socialLinks"];
  label: string;
}[] = [
  { key: "website", label: "Website" },
  { key: "facebook", label: "Facebook" },
  { key: "instagram", label: "Instagram" },
];

export function DeveloperProfileView({
  developer,
  activeListings,
}: DeveloperProfileViewProps) {
  return (
    <div className="flex flex-1 flex-col">
      {/* Mounted with the real content, not the route's loading boundary — see
          ScrollToHash for why Next's own `#hash` scroll doesn't land here. */}
      <ScrollToHash />

      {/*
        Identity header. Replaces a 224px `bg-muted` band that stood in for a
        cover image no developer actually has — every record's `coverImageUrl`
        is undefined, so it rendered as an empty grey slab that pushed the
        developer's name ~300px down the page. Rather than fabricate
        architectural imagery, identity is carried by the monogram.

        Deliberately NOT wrapped in MotionReveal: this is above-the-fold primary
        content, and fading it in makes the name, location and rating arrive
        late. It also produced a real axe failure — the metadata row was caught
        mid-fade at #8d8d8d on white (3.31:1, under the 4.5 AA threshold),
        because partial opacity lightens the muted-foreground token. Settled,
        the same text is #737373 at 4.54:1.
      */}
      <header className="border-border border-b">
        <div className="container-page flex flex-col gap-6 py-10 sm:py-14">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <DeveloperAvatar
                logoUrl={developer.logoUrl}
                name={developer.name}
                size={88}
                tone="monogram"
              />

              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <h1 className="text-page-title">{developer.name}</h1>
                  {developer.isVerified && (
                    <Badge variant="secondary">
                      <BadgeCheck className="size-3.5" aria-hidden />
                      Verified
                    </Badge>
                  )}
                </div>

                {/*
                  One inline metadata line instead of the four equal-weight stat
                  tiles this replaced — those read as a dashboard KPI panel
                  rather than a professional profile. Same real values
                  (`activeListings`, `rating`, `yearsActive`), just ranked:
                  where they operate first, then what they have, then the
                  rating. No rating count — no such field exists.
                */}
                <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-3.5 shrink-0" aria-hidden />
                    {developer.city}, {developer.region}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Building2 className="size-3.5 shrink-0" aria-hidden />
                    {developer.activeListings} active{" "}
                    {developer.activeListings === 1 ? "listing" : "listings"}
                  </span>
                  {developer.rating !== undefined && (
                    <span className="flex items-center gap-1.5">
                      <Star
                        className="fill-brand-gold text-brand-gold size-3.5 shrink-0"
                        aria-hidden
                      />
                      <span className="text-foreground tabular-nums">
                        {developer.rating.toFixed(1)}
                      </span>
                      / 5
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <a
                href="#contact"
                className={buttonVariants({ variant: "outline", size: "lg" })}
              >
                <Mail className="size-4" aria-hidden />
                Contact
              </a>
              {isFeatureEnabled("WHATSAPP_CONTACT") ? (
                <WhatsAppCTA
                  message={buildDeveloperWhatsAppMessage(developer)}
                  label="Message on WhatsApp"
                />
              ) : (
                <Button disabled size="lg" className="gap-2">
                  <MessageCircle aria-hidden />
                  Message on WhatsApp (coming soon)
                </Button>
              )}
            </div>
          </div>

          {/* The bio sits in the header rather than under a separate "About"
              heading: it is the developer's own description of who they are,
              which belongs to identity, not to a downstream section. */}
          <p className="text-muted-foreground max-w-3xl leading-relaxed">
            {developer.bio}
          </p>
        </div>
      </header>

      {/*
        A "Featured Properties" section used to sit here. It was removed rather
        than restyled: `getFeaturedListings` sorted this developer's *same* six
        active properties by price and took three, so the page presented one
        inventory twice while implying an editorial selection the data cannot
        support — there is no `featured` field anywhere in the model. Ranking by
        price is not curation, and inventing a flag to justify the section would
        have been exactly the kind of fabrication this project rules out.
      */}
      <div className="container-page flex flex-col gap-10 py-10">
        <MotionReveal
          as="aside"
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:max-w-3xl"
        >
          {/* `id`/`scroll-mt` are load-bearing: a property detail page links
                straight here via ROUTES.DEVELOPER_CONTACT (`#contact`), and the
                public Navbar is `sticky top-0`, so without the scroll margin the
                heading lands underneath it. */}
          <section
            id="contact"
            aria-labelledby="developer-contact-heading"
            className="flex scroll-mt-24 flex-col gap-2"
          >
            <h2
              id="developer-contact-heading"
              className="text-subsection-title"
            >
              Contact
            </h2>
            <div className="border-border flex flex-col gap-2 rounded-lg border p-4 text-sm">
              <a
                href={`mailto:${developer.email}`}
                className="focus-visible:ring-ring/50 flex items-center gap-1.5 rounded-sm outline-none hover:underline focus-visible:ring-3"
              >
                <Mail className="size-3.5 shrink-0" aria-hidden />
                {developer.email}
              </a>
              {/* Only the social links this developer actually has — the mock
                    records vary (one has all three, one has only Instagram). */}
              {SOCIAL_LINKS.map(
                ({ key, label }) =>
                  developer.socialLinks[key] && (
                    <a
                      key={key}
                      href={developer.socialLinks[key]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="focus-visible:ring-ring/50 flex items-center gap-1.5 rounded-sm outline-none hover:underline focus-visible:ring-3"
                    >
                      <Globe className="size-3.5 shrink-0" aria-hidden />
                      {label}
                    </a>
                  ),
              )}
            </div>
          </section>

          <div className="flex flex-col gap-2">
            <h2 className="text-subsection-title">Location</h2>
            {!isFeatureEnabled("MAP_VIEW") && <MapPlaceholder />}
          </div>
        </MotionReveal>

        <MotionReveal as="section" className="flex flex-col gap-4">
          {/* The count comes straight off the resolved list, so the heading and
              the grid can never disagree. */}
          <h2 className="text-subsection-title">
            Active listings
            {activeListings.length > 0 && (
              <span className="text-muted-foreground font-normal">
                {" "}
                ({activeListings.length})
              </span>
            )}
          </h2>
          <PropertyGrid
            properties={activeListings}
            isLoading={false}
            isError={false}
            emptyDescription="This developer has no active listings right now."
          />
        </MotionReveal>
      </div>
    </div>
  );
}
