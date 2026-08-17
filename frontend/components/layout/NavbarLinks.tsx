"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: ROUTES.PROPERTIES, label: "Properties" },
  { href: ROUTES.DEVELOPERS, label: "Developers" },
  { href: ROUTES.SAVED, label: "Saved" },
  { href: ROUTES.SEARCH, label: "Search" },
];

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
                "focus-visible:ring-ring/50 rounded-sm transition-colors outline-none focus-visible:ring-3",
                isActive
                  ? "text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {link.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
