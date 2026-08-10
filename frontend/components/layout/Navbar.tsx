import Link from "next/link";

import { NavbarAuthSection } from "@/components/layout/NavbarAuthSection";
import { APP_NAME } from "@/constants/config";
import { ROUTES } from "@/constants/routes";

const NAV_LINKS = [
  { href: ROUTES.PROPERTIES, label: "Properties" },
  { href: ROUTES.DEVELOPERS, label: "Developers" },
  { href: ROUTES.SEARCH, label: "Search" },
];

/**
 * Sticky across every public route (see (public)/layout.tsx, which renders
 * this once for the whole route group) — the meeting's "premium/sticky
 * behavior" requirement. `backdrop-blur` + a translucent background keep
 * page content from looking abruptly cut off underneath it while scrolling,
 * without needing any scroll-linked JS.
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
        <ul className="flex flex-wrap items-center gap-6 text-sm">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 rounded-sm transition-colors outline-none focus-visible:ring-3"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <NavbarAuthSection />
      </nav>
    </header>
  );
}
