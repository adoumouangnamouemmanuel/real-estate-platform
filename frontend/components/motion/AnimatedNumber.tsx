"use client";

import { useEffect, useRef } from "react";
import { animate, useMotionValue, useTransform } from "framer-motion";

import { useReducedMotion } from "@/hooks/useReducedMotion";

type AnimatedNumberProps = {
  value: number;
  /** Formats the interpolated value each frame — defaults to a rounded integer with locale separators. */
  format?: (value: number) => string;
  className?: string;
};

/**
 * Animates a KPI number tweening toward its real value when it changes —
 * never a fake incrementing counter from zero on every mount. Per the brief
 * (§10, §23): only animate metrics that already have a real value; this
 * component doesn't fabricate one. Snaps instantly for reduced-motion users.
 */
export function AnimatedNumber({
  value,
  format = (n) => Math.round(n).toLocaleString(),
  className,
}: AnimatedNumberProps) {
  const prefersReducedMotion = useReducedMotion();
  const motionValue = useMotionValue(value);
  const rounded = useTransform(motionValue, (latest) => format(latest));
  const spanRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (prefersReducedMotion) {
      motionValue.set(value);
      return;
    }
    const controls = animate(motionValue, value, {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1],
    });
    return () => controls.stop();
  }, [value, prefersReducedMotion, motionValue]);

  useEffect(() => {
    const unsubscribe = rounded.on("change", (latest) => {
      if (spanRef.current) spanRef.current.textContent = latest;
    });
    return unsubscribe;
  }, [rounded]);

  return (
    <span ref={spanRef} className={className}>
      {format(value)}
    </span>
  );
}
