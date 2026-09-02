"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";

import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

/**
 * The public nav's link list, split out of `Navbar` purely because active state
 * needs `usePathname`. Deliberately the smallest possible client boundary — the
 * header shell, wordmark and `NavbarAuthSection` composition all stay where they
 * were, and no state of its own is introduced.
 *
 * Active state carries `aria-current="page"` for assistive tech and is *also*
 * signalled visually by weight and colour, not colour alone (WCAG 1.4.1).
 */
export function NavbarLinks() {
  const pathname = usePathname();
  const { t } = useTranslation("common");

  const NAV_LINKS = [
    { href: ROUTES.PROPERTIES, labelKey: "nav.properties" },
    { href: ROUTES.DEVELOPERS, labelKey: "nav.developers" },
    { href: ROUTES.SAVED, labelKey: "nav.saved" },
    { href: ROUTES.SEARCH, labelKey: "nav.search" },
  ];

  return (
    <ul className="flex flex-wrap items-center gap-6 text-sm">
      {NAV_LINKS.map((link) => {
        // Nested routes count as their section: /properties/some-slug should
        // still light up "Properties". Home is excluded from the list entirely,
        // so there's no "/" prefix-matches-everything case to guard against.
        const isActive =
          pathname === link.href || pathname.startsWith(`${link.href}/`);

        return (
          <li key={link.href}>
            <Link
              href={link.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                // `py-1.5` is a touch-target fix, not spacing. These links
                // measured 18px tall on mobile — below the 24px WCAG 2.5.8 (AA)
                // minimum — on the site's primary navigation. Because the anchor
                // is inline, vertical padding grows the hit area (and the focus
                // ring with it) to ~30px without adding to the line box, so the
                // navbar's height is unchanged and it doesn't turn bulky.
                "focus-visible:ring-ring/50 rounded-sm py-1.5 transition-colors outline-none focus-visible:ring-3",
                isActive
                  ? "text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t(link.labelKey)}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
