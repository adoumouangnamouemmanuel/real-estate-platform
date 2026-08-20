"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Building2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { GlassSurface } from "@/components/motion";
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
    // Honest empty state, not a broken one: a bare icon on a grey block read as
    // a failed image. Says plainly that this listing has no photos yet rather
    // than implying something failed to load — and never substitutes a stock
    // photograph for a real property.
    return (
      <div className="bg-muted text-muted-foreground flex aspect-[16/10] w-full flex-col items-center justify-center gap-2 rounded-xl md:aspect-[2/1] lg:aspect-[16/10]">
        <Building2 className="size-10" aria-hidden />
        <p className="text-sm">No photos for this listing yet</p>
      </div>
    );
  }

  const activeImage = media[activeIndex];

  return (
    <div className="flex flex-col gap-3">
      {/* 16/10 rather than 16/9. In the detail page's two-column hero the
          gallery is ~723px wide at 1440, and the slightly taller frame gives
          architectural photography more room without pushing the fold.

          The md step exists because the detail page is single-column below lg,
          so the gallery spans the full container there — 720px wide at 768 and
          ~975px at 1023, i.e. as wide as the 1440 two-column gallery but
          stacked above the content instead of beside it. At 16/10 that cost
          450–609px of vertical budget before the title. A 2/1 frame at the same
          width stays cinematic while returning ~90px at 768 and ~120px at 1023.
          lg restores 16/10, where the gallery shares the fold rather than
          displacing it. */}
      <div className="bg-muted relative aspect-[16/10] w-full overflow-hidden rounded-xl md:aspect-[2/1] lg:aspect-[16/10]">
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

        {/* Real counter — activeIndex and media.length, nothing inferred. Hidden
            from assistive tech because the active image's alt already reads
            "… — photo N of M", and announcing it twice is noise. */}
        {media.length > 1 && (
          <GlassSurface
            aria-hidden
            className="absolute right-3 bottom-3 rounded-full px-2.5 py-1 text-xs font-medium tabular-nums"
          >
            {activeIndex + 1} / {media.length}
          </GlassSurface>
        )}
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
                // Was size-16. Every listing in the catalogue carries exactly
                // two photos, and two 64px squares under a full-width frame
                // read as leftovers rather than a gallery; a 4/3 tile at 88px
                // gives the second photo enough presence to look deliberate.
                "bg-muted relative aspect-[4/3] h-22 shrink-0 overflow-hidden rounded-lg border-2 transition-transform duration-150 outline-none hover:scale-[1.03]",
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
