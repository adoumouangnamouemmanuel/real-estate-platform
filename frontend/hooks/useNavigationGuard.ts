"use client";

import { useCallback, useEffect, useState } from "react";

interface UseNavigationGuardOptions {
  shouldBlock: boolean;
  message?: string;
}

const DEFAULT_MESSAGE = "You have unsaved changes. Leave without saving?";

/**
 * Generic "warn before losing unsaved work" guard — not specific to the
 * Property Editor, so any future dashboard form (Company Profile, Account
 * Settings) can adopt it the same way. Covers two exit paths:
 *
 *  - Leaving the page entirely (tab close, refresh, typed URL) via the native
 *    `beforeunload` prompt — browsers show their own generic text for this,
 *    never a custom message, which is why `message` only applies below.
 *  - In-app navigation the consumer itself initiates (a Cancel/Back button, a
 *    breadcrumb) — wrap whatever the control would otherwise do directly in
 *    `guardNavigation(action)`; it runs immediately when nothing is unsaved,
 *    or holds the action and opens a confirmation dialog when it is.
 *
 * Deliberately does not intercept arbitrary global navigation (every sidebar
 * link, every breadcrumb across the app) — that would need guard state lifted
 * into a shared store, which is out of scope until a consumer actually needs
 * it. Pair with `NavigationGuardDialog` for the confirmation UI.
 */
export function useNavigationGuard({
  shouldBlock,
  message = DEFAULT_MESSAGE,
}: UseNavigationGuardOptions) {
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  useEffect(() => {
    if (!shouldBlock) return;

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      // Legacy browsers require a truthy returnValue to trigger the native prompt.
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [shouldBlock]);

  const guardNavigation = useCallback(
    (action: () => void) => {
      if (shouldBlock) {
        setPendingAction(() => action);
      } else {
        action();
      }
    },
    [shouldBlock],
  );

  const confirmNavigation = useCallback(() => {
    pendingAction?.();
    setPendingAction(null);
  }, [pendingAction]);

  const cancelNavigation = useCallback(() => setPendingAction(null), []);

  return {
    isDialogOpen: pendingAction !== null,
    message,
    guardNavigation,
    confirmNavigation,
    cancelNavigation,
  };
}
