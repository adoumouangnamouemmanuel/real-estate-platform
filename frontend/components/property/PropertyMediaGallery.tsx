"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Building2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { DURATION_BASE } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { PropertyMedia } from "@/types";

interface PropertyMediaGalleryProps {
  media: PropertyMedia[];
  title: string;
}

export function PropertyMediaGallery({
  media,
  title,
}: PropertyMediaGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (media.length === 0) {
    return (
      <div className="bg-muted text-muted-foreground flex aspect-[16/9] w-full items-center justify-center rounded-xl">
        <Building2 className="size-12" aria-hidden />
      </div>
    );
  }

  const activeImage = media[activeIndex];

  return (
    <div className="flex flex-col gap-2">
      <div className="bg-muted relative aspect-[16/9] w-full overflow-hidden rounded-xl">
        {/* mode="sync" (rather than the default "wait") lets the incoming
            photo fade in while the outgoing one is still fading out, so
            switching photos crossfades instead of dipping through the muted
            background between them. */}
        <AnimatePresence mode="sync">
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DURATION_BASE }}
            className="absolute inset-0"
          >
            <Image
              src={activeImage.url}
              alt={`${title} — photo ${activeIndex + 1} of ${media.length}`}
              fill
              sizes="(min-width: 1024px) 900px, 100vw"
              className="object-cover"
              priority
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {media.length > 1 && (
        <div
          role="group"
          aria-label="Property photos"
          className="flex gap-2 overflow-x-auto"
        >
          {media.map((item, index) => (
            <button
              key={item.publicId}
              type="button"
              aria-current={index === activeIndex ? "true" : undefined}
              aria-label={`Photo ${index + 1} of ${media.length}`}
              onClick={() => setActiveIndex(index)}
              className={cn(
                "bg-muted relative size-16 shrink-0 overflow-hidden rounded-md border-2 transition-transform duration-150 outline-none hover:scale-105",
                // Focus and "currently showing" are two different states and a
                // keyboard user needs to tell them apart while arrowing along
                // the strip. Active keeps the solid border; focus adds the
                // app-standard ring, which sits outside the border box — so a
                // thumbnail that is both focused and active shows both without
                // either one masking the other. Previously `outline-none` here
                // had no focus replacement at all, so focus was invisible.
                "focus-visible:ring-ring/50 focus-visible:ring-3",
                index === activeIndex ? "border-primary" : "border-transparent",
              )}
            >
              <Image
                src={item.url}
                alt=""
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
