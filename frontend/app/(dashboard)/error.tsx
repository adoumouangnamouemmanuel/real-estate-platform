"use client";

import { RouteError } from "@/components/common/RouteError";
import { ROUTES } from "@/constants/routes";

/**
 * Scoped to the dashboard route group. The shell — top bar, sidebar and mobile
 * nav — lives in (dashboard)/layout.tsx and is above this boundary, so it stays
 * usable: a developer whose Analytics query fails can still reach My Properties
 * instead of losing the whole authenticated surface.
 */
export default function DashboardError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <RouteError
      error={error}
      retry={unstable_retry}
      homeHref={ROUTES.DASHBOARD}
      homeLabel="Back to dashboard"
      description="This section could not be loaded. You can try again, or return to your dashboard."
    />
  );
}
