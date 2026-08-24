"use client";

import { RouteError } from "@/components/common/RouteError";
import { ROUTES } from "@/constants/routes";

/**
 * Scoped to the public route group: the Navbar, Footer and skip link in
 * (public)/layout.tsx stay mounted, so a failure in one page does not strand
 * the visitor on a chrome-less screen — they can still navigate away.
 */
export default function PublicError({
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
      homeHref={ROUTES.PROPERTIES}
      homeLabel="Browse properties"
      description="This page could not be loaded. You can try again, or continue browsing."
    />
  );
}
