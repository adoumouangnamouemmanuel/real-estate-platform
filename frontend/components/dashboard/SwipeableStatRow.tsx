import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface SwipeableStatRowProps {
  items: { key: string; node: ReactNode }[];
  className?: string;
}

/**
 * A horizontally scroll-snapping row below `sm`, a normal grid from `sm` up —
 * the first swipeable surface in this codebase (every other list/grid so far
 * has just stacked vertically on mobile). StatCards are dense enough that
 * stacking six of them vertically pushes everything else below the fold on a
 * phone; swiping keeps "glance at the number you care about" a horizontal
 * gesture instead of a long scroll. Native scroll, no library — full
 * keyboard/touch support for free, same reasoning as `Sparkline` being a
 * plain SVG instead of a charting dependency.
 */
export function SwipeableStatRow({ items, className }: SwipeableStatRowProps) {
  return (
    <div
      className={cn(
        "flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1",
        "sm:grid sm:snap-none sm:grid-cols-2 sm:overflow-visible sm:pb-0",
        "lg:grid-cols-4",
        className,
      )}
    >
      {items.map((item) => (
        <div
          key={item.key}
          className="w-[80%] shrink-0 snap-start sm:w-auto sm:shrink"
        >
          {item.node}
        </div>
      ))}
    </div>
  );
}
