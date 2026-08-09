import Link from "next/link";

import { NavbarAuthSection } from "@/components/layout/NavbarAuthSection";
import { APP_NAME } from "@/constants/config";
import { ROUTES } from "@/constants/routes";

const NAV_LINKS = [
  { href: ROUTES.PROPERTIES, label: "Properties" },
  { href: ROUTES.DEVELOPERS, label: "Developers" },
  { href: ROUTES.SEARCH, label: "Search" },
];

export function Navbar() {
  return (
    <header className="border-border border-b">
      <nav className="container-page flex flex-wrap items-center justify-between gap-4 py-4">
        <Link
          href={ROUTES.HOME}
          className="text-lg font-semibold tracking-tight"
        >
          {APP_NAME}
        </Link>
        <ul className="flex flex-wrap items-center gap-6 text-sm">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
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
