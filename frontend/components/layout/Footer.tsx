import Link from "next/link";

import { APP_NAME } from "@/constants/config";
import { ROUTES } from "@/constants/routes";

/**
 * Every destination here is a route that exists and renders. There are
 * deliberately no social accounts, office addresses, phone numbers, press
 * links, statistics or legal pages: the platform has none of those, and a
 * footer full of dead links is the most obvious tell that a product is a shell.
 * When legal pages are actually written, they get a column of their own.
 *
 * The description is the app's own metadata line (see app/layout.tsx), not new
 * marketing copy.
 */
const FOOTER_SECTIONS: {
  heading: string;
  links: { href: string; label: string }[];
}[] = [
  {
    heading: "Browse",
    links: [
      { href: ROUTES.PROPERTIES, label: "Properties" },
      { href: ROUTES.SEARCH, label: "Search" },
      { href: ROUTES.SAVED, label: "Saved properties" },
      { href: ROUTES.DEVELOPERS, label: "Developers" },
    ],
  },
  {
    heading: "Account",
    links: [
      { href: ROUTES.LOGIN, label: "Sign in" },
      { href: ROUTES.REGISTER, label: "Create an account" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-border mt-auto border-t">
      <div className="container-page page-section grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-2 lg:col-span-2">
          {/* Plain text, not a second link home. The navbar wordmark already
              links to `/` on every page, and repeating it here gave assistive
              tech two identically-named "Lumavok" links per page — redundant to
              navigate past, and ambiguous to reference. */}
          <p className="font-display text-lg font-semibold tracking-tight">
            {APP_NAME}
          </p>
          <p className="text-muted-foreground max-w-xs text-sm leading-relaxed">
            Property discovery and trust platform for African markets.
          </p>
        </div>

        {/* Headed lists, not `nav` landmarks. Marking each column as its own
            navigation region gave every page three navigation landmarks for one
            real navigation region; the headings already make these groups
            reachable, and they sit inside the footer's own contentinfo. */}
        {FOOTER_SECTIONS.map((section) => (
          <div key={section.heading}>
            <h2 className="text-foreground text-sm font-medium">
              {section.heading}
            </h2>
            <ul className="mt-3 flex flex-col gap-2.5 text-sm">
              {section.links.map((link) => (
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
          </div>
        ))}
      </div>

      <div className="border-border border-t">
        <div className="container-page text-muted-foreground py-6 text-sm">
          © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
