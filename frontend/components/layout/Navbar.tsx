import Link from "next/link";

const NAV_LINKS = [
  { href: "/properties", label: "Properties" },
  { href: "/developers", label: "Developers" },
  { href: "/search", label: "Search" },
];

export function Navbar() {
  return (
    <header className="border-border border-b">
      <nav className="container-page flex flex-wrap items-center justify-between gap-4 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          ByTe
        </Link>
        <ul className="flex flex-wrap items-center gap-6 text-sm">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-zinc-600 transition-colors hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
