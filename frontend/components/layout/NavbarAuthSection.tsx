"use client";

import Link from "next/link";
import { LayoutDashboard } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/hooks/useAuth";

/**
 * The only part of the Navbar that needs live auth state — kept small and
 * client-only on purpose. A developer/admin browsing the public marketplace
 * gets a direct one-click way back into their dashboard here — no logout
 * required, auth state is untouched by this navigation (a plain Link).
 */
export function NavbarAuthSection() {
  const { user, isAuthenticated, logout } = useAuth();

  if (isAuthenticated && user) {
    const hasDashboard = user.role === "DEVELOPER" || user.role === "ADMIN";

    return (
      <div className="flex items-center gap-3 text-sm">
        <span className="text-muted-foreground hidden sm:inline">
          {user.fullName}
        </span>
        {hasDashboard && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            render={<Link href={ROUTES.DASHBOARD} />}
          >
            <LayoutDashboard className="size-4" aria-hidden />
            Dashboard
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={() => logout()}>
          Log out
        </Button>
      </div>
    );
  }

  return (
    <Button variant="outline" size="sm" render={<Link href={ROUTES.LOGIN} />}>
      Log in
    </Button>
  );
}
