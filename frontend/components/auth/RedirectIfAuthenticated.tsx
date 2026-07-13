"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Loading } from "@/components/common/Loading";
import { getPostLoginDestination } from "@/lib/authRedirect";
import { useAuthStore } from "@/store/authStore";

interface RedirectIfAuthenticatedProps {
  children: React.ReactNode;
}

/** Wraps the (auth) route group — a signed-in user shouldn't see login/register/etc. */
export function RedirectIfAuthenticated({
  children,
}: RedirectIfAuthenticatedProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isBootstrapping = useAuthStore((state) => state.isBootstrapping);

  useEffect(() => {
    if (isAuthenticated && user) {
      router.replace(getPostLoginDestination(user));
    }
  }, [isAuthenticated, user, router]);

  if (isBootstrapping || isAuthenticated) {
    return <Loading />;
  }

  return children;
}
