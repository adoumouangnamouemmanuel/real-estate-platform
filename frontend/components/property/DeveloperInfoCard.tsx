import { BadgeCheck } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/constants/routes";
import type { DeveloperSummary } from "@/types";

interface DeveloperInfoCardProps {
  developer: DeveloperSummary;
}

export function DeveloperInfoCard({ developer }: DeveloperInfoCardProps) {
  return (
    <div className="border-border flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex items-center justify-between gap-2">
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
  );
}
