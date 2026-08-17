"use client";

import Link from "next/link";
import { ExternalLink, LogOut } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/hooks/useAuth";
import { getProductRoleLabel } from "@/lib/roles";

function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

/** The dashboard TopBar's account menu — name, role, and the two account-level actions. */
export function DashboardUserMenu() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Account menu for ${user.fullName}`}
        // The resting hairline ring stays, but `ring-inset` had to go: an inset
        // focus ring would be drawn *inside* the avatar's solid primary circle,
        // where a teal-on-teal ring is effectively invisible. Rendering it
        // outside instead makes focus legible against the top bar, and moves
        // the resting ring by 1px — imperceptible. Same ring treatment used
        // everywhere else in the app; previously focus had no indicator at all.
        className="ring-border focus-visible:ring-ring/50 flex items-center gap-2 rounded-full ring-1 outline-none focus-visible:ring-3"
      >
        <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-full text-xs font-semibold">
          {initials(user.fullName)}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-1 px-1.5 py-1">
            <span className="text-foreground text-sm font-medium">
              {user.fullName}
            </span>
            <Badge variant="secondary" className="w-fit">
              {getProductRoleLabel(user.role)}
            </Badge>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href={ROUTES.HOME} />}>
          <ExternalLink />
          View public site
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={() => logout()}>
          <LogOut />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
