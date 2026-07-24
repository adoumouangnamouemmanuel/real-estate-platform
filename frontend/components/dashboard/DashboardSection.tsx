import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DashboardSectionProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  /** Right-aligned control in the header — e.g. a "View all" link. */
  action?: ReactNode;
  children: ReactNode;
  /** Drop the default content padding when the body is a full-bleed table. */
  flush?: boolean;
  className?: string;
  contentClassName?: string;
}

/**
 * The one card-with-a-titled-header shape every dashboard-home widget renders
 * inside, so Recent Listings, Appointments, Notifications, and the Activity
 * Timeline all share identical chrome (heading level, spacing, action slot)
 * instead of each re-inventing it. Purely presentational — no data, no client
 * state — so it stays a Server Component.
 */
export function DashboardSection({
  title,
  description,
  icon: Icon,
  action,
  children,
  flush = false,
  className,
  contentClassName,
}: DashboardSectionProps) {
  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          {Icon && (
            <Icon
              className="text-muted-foreground mt-0.5 size-4.5 shrink-0"
              aria-hidden
            />
          )}
          <div className="flex flex-col gap-0.5">
            <h2 className="font-heading text-base leading-snug font-medium">
              {title}
            </h2>
            {description && (
              <p className="text-muted-foreground text-sm">{description}</p>
            )}
          </div>
        </div>
        {action}
      </CardHeader>
      <CardContent
        className={cn(
          flush && "px-0",
          "flex flex-1 flex-col",
          contentClassName,
        )}
      >
        {children}
      </CardContent>
    </Card>
  );
}
