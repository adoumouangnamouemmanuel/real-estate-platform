"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/hooks/useAuth";

/** The only part of the Navbar that needs live auth state — kept small and client-only on purpose. */
export function NavbarAuthSection() {
  const { user, isAuthenticated, logout } = useAuth();

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <span className="text-muted-foreground hidden sm:inline">
          {user.fullName}
        </span>
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
