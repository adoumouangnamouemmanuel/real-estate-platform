import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { MotionReveal, MotionRevealItem } from "@/components/motion";
import { DeveloperCard } from "@/components/developer/DeveloperCard";
import { DeveloperCardSkeleton } from "@/components/developer/DeveloperCardSkeleton";
import { getErrorMessage } from "@/lib/errors";
import type { Developer } from "@/types";

interface DeveloperGridProps {
  developers: Developer[];
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
  skeletonCount?: number;
  emptyDescription?: string;
}

/**
 * `items-stretch` (grid's default) plus `h-full` on the card means every card in
 * a row matches the tallest one, so the metadata footers line up even when one
 * developer's name wraps. Caps at 3 columns rather than PropertyGrid's 4:
 * directory cards carry a paragraph of text, which needs more measure than a
 * property thumbnail does.
 */
const GRID_CLASSNAME = "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3";

/** Same loading/error/empty/grid composition as PropertyGrid, applied to the developer domain. */
export function DeveloperGrid({
  developers,
  isLoading,
  isError,
  error,
  skeletonCount = 3,
  emptyDescription = "Try adjusting your search or check back later.",
}: DeveloperGridProps) {
  if (isError) {
    return (
      <ErrorState
        title="Couldn't load developers"
        description={getErrorMessage(error)}
      />
    );
  }

  if (isLoading) {
    return (
      <div role="status" aria-live="polite" className={GRID_CLASSNAME}>
        <span className="sr-only">Loading developers…</span>
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <DeveloperCardSkeleton key={index} aria-hidden />
        ))}
      </div>
    );
  }

  if (developers.length === 0) {
    return (
      <EmptyState title="No developers found" description={emptyDescription} />
    );
  }

  return (
    // Keyed by the rendered ids so the stagger replays when a filter changes
    // the result set — the same pattern PropertyGrid uses. MotionReveal renders
    // straight into its visible state under prefers-reduced-motion, so content
    // is never withheld waiting on a scroll trigger.
    <MotionReveal
      key={developers.map((developer) => developer.id).join(",")}
      stagger
      className={GRID_CLASSNAME}
    >
      {developers.map((developer) => (
        <MotionRevealItem key={developer.id} className="h-full">
          <DeveloperCard developer={developer} bio={developer.bio} />
        </MotionRevealItem>
      ))}
    </MotionReveal>
  );
}
