"use client";

import { RouteError } from "@/components/common/RouteError";
import { ROUTES } from "@/constants/routes";

/**
 * Scoped to the auth route group. Sends the user back to Log in rather than the
 * marketing home: someone who hit an error mid sign-in or password reset is
 * trying to get into an account, and the useful next step is the start of that
 * flow. Deliberately says nothing about why authentication failed — this
 * boundary catches render/fetch errors, not credential outcomes, and guessing
 * would be inventing an error the app has not actually diagnosed.
 */
export default function AuthError({
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
      homeHref={ROUTES.LOGIN}
      homeLabel="Back to log in"
      description="This page could not be loaded. You can try again, or return to log in."
    />
  );
}
