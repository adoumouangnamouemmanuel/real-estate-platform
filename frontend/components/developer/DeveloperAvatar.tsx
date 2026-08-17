import Image from "next/image";

import { cn } from "@/lib/utils";

interface DeveloperAvatarProps {
  logoUrl?: string;
  name: string;
  size?: number;
  className?: string;
  /**
   * "monogram" renders the developer's initials on the brand surface — the
   * directory's identity treatment. "muted" is the smaller, quieter circle used
   * inline next to other content (property detail's contact card).
   */
  tone?: "muted" | "monogram";
}

/**
 * Developer identity. No developer in the current data model has a `logoUrl`
 * (see services/mocks/developers.mock.ts), and there is no developer-specific
 * imagery anywhere — so rather than borrow a property photo or a stock image,
 * which would assert a relationship the data doesn't have, identity is carried
 * typographically by the developer's own initials. The `logoUrl` branch stays
 * because the type supports it and a real backend will supply one.
 */
export function DeveloperAvatar({
  logoUrl,
  name,
  size = 40,
  className,
  tone = "muted",
}: DeveloperAvatarProps) {
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full",
        // `text-foreground`, not `text-muted-foreground`: the monogram is real
        // text, so it is contrast-checked (the Building2 icon this replaced was
        // a decorative SVG and was not). muted-foreground on muted measures
        // 4.34:1 at this size — just under the 4.5:1 AA threshold, caught by
        // axe on the property detail page.
        tone === "monogram"
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-foreground",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt={`${name} logo`}
          fill
          sizes={`${size}px`}
          className="object-cover"
        />
      ) : (
        <span
          aria-hidden
          className="flex h-full w-full items-center justify-center font-semibold tracking-tight"
          // Scales with the circle so one component serves the 40px inline use
          // and the 72px directory use without a second size scale.
          style={{ fontSize: Math.round(size * 0.36) }}
        >
          {developerInitials(name)}
        </span>
      )}
    </div>
  );
}

/**
 * Up to two initials from the developer's business name, skipping the filler
 * words that would otherwise produce a meaningless pair ("Atlantic Properties"
 * → "AP", not "AP"; "Westgate and Co" → "WC", not "WA").
 */
export function developerInitials(name: string): string {
  const FILLER = new Set(["and", "the", "of", "&"]);
  const words = name
    .trim()
    .split(/\s+/)
    .filter((word) => !FILLER.has(word.toLowerCase()));

  if (words.length === 0) return "";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}
