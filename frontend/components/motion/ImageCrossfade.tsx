"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";

import { useReducedMotion } from "@/hooks/useReducedMotion";
import { EASE_CINEMATIC } from "@/lib/motion";
import { cn } from "@/lib/utils";

type ImageCrossfadeProps = {
  images: { src: string; alt: string }[];
  /** Milliseconds each image holds before crossfading to the next. */
  intervalMs?: number;
  className?: string;
  sizes?: string;
};

/**
 * Slow crossfade + gentle Ken Burns drift through a set of images — the
 * cinematic hero pattern, not a marketing carousel. Advances on a timer, not
 * user interaction, so it needs no controls; for reduced-motion users it
 * renders the first image only, static, with no interval and no scale drift.
 */
export function ImageCrossfade({
  images,
  intervalMs = 7000,
  className,
  sizes = "100vw",
}: ImageCrossfadeProps) {
  const prefersReducedMotion = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion || images.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % images.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [images.length, intervalMs, prefersReducedMotion]);

  const current = images[prefersReducedMotion ? 0 : index];
  if (!current) return null;

  if (prefersReducedMotion) {
    return (
      <div className={cn("relative", className)}>
        <Image
          src={current.src}
          alt={current.alt}
          fill
          sizes={sizes}
          priority
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <AnimatePresence initial={false}>
        <motion.div
          key={index}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 1 }}
          animate={{
            opacity: 1,
            scale: 1.08,
            transition: {
              opacity: { duration: 1.5, ease: EASE_CINEMATIC },
              scale: { duration: intervalMs / 1000 + 1.5, ease: "linear" },
            },
          }}
          exit={{
            opacity: 0,
            transition: { duration: 1.5, ease: EASE_CINEMATIC },
          }}
        >
          <Image
            src={current.src}
            alt={current.alt}
            fill
            sizes={sizes}
            priority={index === 0}
            className="object-cover"
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
