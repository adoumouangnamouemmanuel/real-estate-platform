import { BadgeCheck, Globe, MessageCircle } from "lucide-react";
import Image from "next/image";

import { WhatsAppCTA } from "@/components/common/WhatsAppCTA";
import { MapPlaceholder } from "@/components/common/MapPlaceholder";
import { DeveloperAvatar } from "@/components/developer/DeveloperAvatar";
import { DeveloperStats } from "@/components/developer/DeveloperStats";
import { PropertyCard } from "@/components/property/PropertyCard";
import { PropertyGrid } from "@/components/property/PropertyGrid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { isFeatureEnabled } from "@/constants/features";
import { buildDeveloperWhatsAppMessage } from "@/lib/whatsapp";
import type { DeveloperProfile, Property } from "@/types";

interface DeveloperProfileViewProps {
  developer: DeveloperProfile;
  activeListings: Property[];
  featuredListings: Property[];
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
  featuredListings,
}: DeveloperProfileViewProps) {
  return (
    <div className="flex flex-col">
      <div className="bg-muted relative h-40 w-full sm:h-56">
        {developer.coverImageUrl && (
          <Image
            src={developer.coverImageUrl}
            alt=""
            fill
            className="object-cover"
            priority
          />
        )}
      </div>

      <div className="container-page flex flex-col gap-10 pb-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <DeveloperAvatar
              logoUrl={developer.logoUrl}
              name={developer.name}
              size={88}
              className="border-background bg-background -mt-10 border-4"
            />
            <div className="flex flex-col gap-1 pb-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">
                  {developer.name}
                </h1>
                {developer.isVerified && (
                  <Badge variant="secondary">
                    <BadgeCheck className="size-3.5" aria-hidden />
                    Verified
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground text-sm">
                {developer.city}, {developer.region}
              </p>
            </div>
          </div>

          {isFeatureEnabled("WHATSAPP_CONTACT") ? (
            <WhatsAppCTA
              message={buildDeveloperWhatsAppMessage(developer)}
              label="Message on WhatsApp"
            />
          ) : (
            <Button disabled className="gap-2">
              <MessageCircle aria-hidden />
              Message on WhatsApp (coming soon)
            </Button>
          )}
        </header>

        <DeveloperStats
          activeListings={developer.activeListings}
          totalListings={developer.totalListings}
          yearsActive={developer.yearsActive}
          rating={developer.rating}
        />

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          <div className="flex flex-col gap-8 lg:col-span-2">
            <section className="flex flex-col gap-2">
              <h2 className="text-lg font-semibold">About</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {developer.bio}
              </p>
            </section>

            {featuredListings.length > 0 && (
              <section className="flex flex-col gap-4">
                <h2 className="text-lg font-semibold">Featured Properties</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {featuredListings.map((property) => (
                    <PropertyCard key={property.id} property={property} />
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <h2 className="text-lg font-semibold">Contact</h2>
              <div className="border-border flex flex-col gap-2 rounded-lg border p-4 text-sm">
                <a
                  href={`mailto:${developer.email}`}
                  className="hover:underline"
                >
                  {developer.email}
                </a>
                {SOCIAL_LINKS.map(
                  ({ key, label }) =>
                    developer.socialLinks[key] && (
                      <a
                        key={key}
                        href={developer.socialLinks[key]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 hover:underline"
                      >
                        <Globe className="size-3.5" aria-hidden />
                        {label}
                      </a>
                    ),
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <h2 className="text-lg font-semibold">Location</h2>
              {!isFeatureEnabled("MAP_VIEW") && <MapPlaceholder />}
            </div>
          </aside>
        </div>

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Active Listings</h2>
          <PropertyGrid
            properties={activeListings}
            isLoading={false}
            isError={false}
            emptyDescription="This developer has no active listings right now."
          />
        </section>
      </div>
    </div>
  );
}
