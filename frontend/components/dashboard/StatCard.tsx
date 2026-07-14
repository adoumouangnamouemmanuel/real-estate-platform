import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkline } from "@/components/ui/sparkline";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  hint?: string;
  /** Optional recent-trend values, oldest first — rendered as a small sparkline. */
  trend?: number[];
  isLoading?: boolean;
}

/** The dashboard's one KPI-tile shape — reused for every stat across Home and Analytics. */
export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  trend,
  isLoading = false,
}: StatCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex flex-col gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-3 w-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground text-sm font-medium">
            {label}
          </span>
          <span className="text-2xl font-semibold tracking-tight">{value}</span>
          {hint && (
            <span className="text-muted-foreground text-xs">{hint}</span>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          {Icon && (
            <Icon className="text-muted-foreground size-5" aria-hidden />
          )}
          {trend && trend.length > 1 && (
            <Sparkline
              data={trend}
              className="text-primary h-6 w-16"
              ariaLabel={`${label} trend`}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
