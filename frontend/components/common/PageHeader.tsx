import type { ReactNode } from "react";

interface PageHeaderProps {
  /** Short category label above the title. Omit rather than inventing one. */
  eyebrow?: string;
  title: string;
  /** One or two sentences of orientation. Omit when there is nothing true to say. */
  lede?: string;
  /** Live supporting detail under the lede — a result count, a storage caveat. */
  meta?: ReactNode;
  /** Primary action aligned to the title on wide viewports. */
  action?: ReactNode;
}

/**
 * The editorial header band shared by the public discovery surfaces.
 *
 * This exists because the same header was being rebuilt inline on every page
 * and had already drifted into four different h1 sizes, with only /developers
 * carrying an eyebrow and lede at all. Centralising it is what makes the
 * "consistent hierarchy" claim enforceable rather than aspirational — the
 * alternative is a shared class string that the next page is free to ignore.
 *
 * Deliberately no imagery, gradient or glass: the hierarchy comes from the type
 * scale and the whitespace, and these pages have no hero image for a glass
 * surface to sit over.
 */
export function PageHeader({
  eyebrow,
  title,
  lede,
  meta,
  action,
}: PageHeaderProps) {
  return (
    <header className="border-border border-b">
      <div className="container-page page-band flex flex-col gap-3">
        {eyebrow && <p className="text-eyebrow">{eyebrow}</p>}
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <h1 className="text-page-title max-w-3xl">{title}</h1>
          {action}
        </div>
        {lede && <p className="text-page-lede">{lede}</p>}
        {meta}
      </div>
    </header>
  );
}
