/**
 * Visually hidden until focused — lets keyboard users jump past the top bar
 * and sidebar/mobile nav straight to page content, instead of tabbing through
 * the same chrome on every dashboard page. Satisfies WCAG 2.4.1 (Bypass
 * Blocks), which the automated axe scan doesn't reliably flag on its own.
 */
export function SkipToContentLink({ targetId }: { targetId: string }) {
  return (
    <a
      href={`#${targetId}`}
      className="bg-background text-foreground focus-visible:ring-ring/50 sr-only rounded-md border px-4 py-2 text-sm font-medium focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus-visible:ring-3 focus-visible:outline-none"
    >
      Skip to main content
    </a>
  );
}
