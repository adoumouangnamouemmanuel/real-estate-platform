"use client";

import { motion } from "framer-motion";
import type { ComponentPropsWithoutRef } from "react";

import { EASE_STANDARD } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Overflow-hidden frame that subtly zooms its child (typically a `next/image
 * fill`) on hover/focus — the shared "editorial tile" hover used by property
 * cards, category tiles, and similar-property grids. Scale is capped at 1.05
 * per the brief's "1.03–1.06, never make cards jump" guidance. Transform
 * animation is skipped automatically for prefers-reduced-motion users via
 * the app-wide MotionConfig in app/providers.tsx.
 */
export function MotionImage({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return (
    <div className={cn("overflow-hidden", className)} {...props}>
      <motion.div
        className="h-full w-full"
        whileHover="hover"
        whileFocus="hover"
        initial="rest"
        variants={{
          rest: { scale: 1 },
          hover: {
            scale: 1.05,
            transition: { duration: 0.5, ease: EASE_STANDARD },
          },
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
