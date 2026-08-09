import { BadgeCheck } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { DeveloperAvatar } from "@/components/developer/DeveloperAvatar";
import { ROUTES } from "@/constants/routes";
import type { Developer } from "@/types";

interface DeveloperCardProps {
  developer: Developer;
}

export function DeveloperCard({ developer }: DeveloperCardProps) {
  return (
    <Link
      href={ROUTES.DEVELOPER_DETAIL(developer.slug)}
      className="group bg-card ring-border flex flex-col gap-3 rounded-xl p-4 ring-1 transition-shadow duration-300 hover:shadow-lg"
    >
      <div className="flex items-center gap-3">
        <DeveloperAvatar
          logoUrl={developer.logoUrl}
          name={developer.name}
          size={48}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-sm font-medium">{developer.name}</p>
            {developer.isVerified && (
              <Badge variant="secondary" className="shrink-0">
                <BadgeCheck className="size-3.5" aria-hidden />
                Verified
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground truncate text-xs">
            {developer.city}, {developer.region}
          </p>
        </div>
      </div>

      <div className="text-muted-foreground flex items-center justify-between text-xs">
        <span>{developer.activeListings} active listings</span>
        {developer.rating !== undefined && (
          <span>{developer.rating.toFixed(1)} / 5</span>
        )}
      </div>
    </Link>
  );
}
