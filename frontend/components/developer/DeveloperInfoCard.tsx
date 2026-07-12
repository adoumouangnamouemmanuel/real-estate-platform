import { BadgeCheck } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { DeveloperAvatar } from "@/components/developer/DeveloperAvatar";
import { ROUTES } from "@/constants/routes";
import type { Developer } from "@/types";

interface DeveloperInfoCardProps {
  developer: Developer;
}

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
    </div>
  );
}
