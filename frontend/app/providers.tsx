"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { MotionConfig } from "framer-motion";
import { useState } from "react";

import { LanguageProvider } from "@/components/common/LanguageContext";
import { Toaster } from "@/components/ui/sonner";
import { useAuthBootstrap } from "@/hooks/useAuthBootstrap";
import { useReducedMotion } from "@/hooks/useReducedMotion";

// Initialize i18n (side effect import)
import "@/lib/i18n";

/**
 * A 4xx response means the request itself was wrong (bad id, validation,
 * unauthorized) — retrying it verbatim will never succeed, so only network
 * errors and 5xx get the default retry/backoff. Today's mock services throw
 * plain Errors with no `response`, which fall into "retry" here exactly like
 * a transient failure would — this only starts discriminating once requests
 * actually go through `api` (see lib/api.ts) against a real backend.
 */
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (isAxiosError(error) && error.response) {
    const status = error.response.status;
    if (status >= 400 && status < 500) return false;
  }
  return failureCount < 2;
}

/** App-wide client-side providers. Kept out of layout.tsx so the root layout stays a Server Component. */
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: shouldRetry,
            staleTime: 30_000,
          },
        },
      }),
  );
  useAuthBootstrap();

  return (
    <LanguageProvider>
      <QueryClientProvider client={queryClient}>
        <AppMotionConfig>{children}</AppMotionConfig>
        <Toaster />
      </QueryClientProvider>
    </LanguageProvider>
  );
}

/**
 * Belt-and-suspenders alongside the manual useReducedMotion checks in
 * components/motion/*: this covers any framer-motion transform/scale animation
 * (hover, tap) that doesn't go through those primitives.
 *
 * "user" only reads the OS media query, so on its own it would ignore a visitor
 * who chose Reduced in the accessibility panel. Promoting to "always" when the
 * effective preference is reduced makes both routes to the setting behave
 * identically — still one motion system, just fed by both signals.
 */
function AppMotionConfig({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();
  return (
    <MotionConfig reducedMotion={reduced ? "always" : "user"}>
      {children}
    </MotionConfig>
  );
}
