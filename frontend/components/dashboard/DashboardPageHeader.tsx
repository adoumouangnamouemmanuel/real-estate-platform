import type { ReactNode } from "react";

import {
  Breadcrumbs,
  type BreadcrumbItem,
} from "@/components/dashboard/Breadcrumbs";

interface DashboardPageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  action?: ReactNode;
}

/** The title/breadcrumb/primary-action row every dashboard page opens with. */
export function DashboardPageHeader({
  title,
  description,
  breadcrumbs,
  action,
}: DashboardPageHeaderProps) {
  return (
    <div className="flex flex-col gap-2">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs items={breadcrumbs} />
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-dashboard-title">{title}</h1>
          {description && (
            <p className="text-muted-foreground text-sm">{description}</p>
          )}
        </div>
        {action}
      </div>
    </div>
  );
}
