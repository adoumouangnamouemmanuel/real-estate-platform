import Link from "next/link";

import { AccessibilityPanel } from "@/components/common/AccessibilityPanel";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { NavbarAuthSection } from "@/components/layout/NavbarAuthSection";
import { NavbarLinks } from "@/components/layout/NavbarLinks";
import { APP_NAME } from "@/constants/config";
import { ROUTES } from "@/constants/routes";

/**
 * Sticky across every public route (see (public)/layout.tsx, which renders
 * this once for the whole route group) — the meeting's "premium/sticky
 * behavior" requirement. `backdrop-blur` + a translucent background keep
 * page content from looking abruptly cut off underneath it while scrolling,
 * without needing any scroll-linked JS.
 *
 * Stays a Server Component: only the destination list needs `usePathname` for
 * its active state, and only `NavbarAuthSection` needs auth state, so each is
 * its own leaf client boundary rather than making the whole header client-side.
 */
export function Navbar() {
  return (
    <header className="border-border bg-background/95 sticky top-0 z-40 border-b backdrop-blur-sm">
      <nav className="container-page flex flex-wrap items-center justify-between gap-4 py-4">
        <Link
          href={ROUTES.HOME}
          className="focus-visible:ring-ring/50 rounded-sm text-lg font-semibold tracking-tight outline-none focus-visible:ring-3"
        >
          {APP_NAME}
        </Link>
        <NavbarLinks />

        {/* Display controls sit next to the account section rather than in the
            destination list: they are settings, not places. Two icon-sized
            triggers keep the header from growing a row on mobile. */}
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <AccessibilityPanel />
          <NavbarAuthSection />
        </div>
      </nav>
    </header>
  );
}
