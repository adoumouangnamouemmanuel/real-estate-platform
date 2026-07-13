"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Loading } from "@/components/common/Loading";
import { getPostLoginDestination } from "@/lib/authRedirect";
import { useAuthStore } from "@/store/authStore";

interface RedirectIfAuthenticatedProps {
  children: React.ReactNode;
}

/**
 * Wraps the (auth) route group — a signed-in user shouldn't see login/register/etc.
 *
 * Deliberately does NOT block rendering on isBootstrapping: the overwhelming majority
 * of visits to these pages are anonymous (that's the whole point of a login page), so
 * forms render immediately rather than waiting out the session-restore round-trip.
 * The rare already-authenticated visitor (e.g. bookmark, back button) sees a brief
 * flash of the form before being redirected once bootstrap confirms who they are —
 * an accepted tradeoff for not penalizing the common case with an artificial delay.
 */
export function RedirectIfAuthenticated({
  children,
}: RedirectIfAuthenticatedProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated && user) {
      router.replace(getPostLoginDestination(user));
    }
  }, [isAuthenticated, user, router]);

  if (isAuthenticated) {
    return <Loading />;
  }

  return children;
}
