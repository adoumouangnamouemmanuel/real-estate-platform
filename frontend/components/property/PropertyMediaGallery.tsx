"use client";

import { Building2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

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
      <div className="bg-muted text-muted-foreground flex aspect-[16/9] w-full items-center justify-center rounded-lg">
        <Building2 className="size-12" aria-hidden />
      </div>
    );
  }

  const activeImage = media[activeIndex];

  return (
    <div className="flex flex-col gap-2">
      <div className="bg-muted relative aspect-[16/9] w-full overflow-hidden rounded-lg">
        <Image
          src={activeImage.url}
          alt={`${title} — photo ${activeIndex + 1} of ${media.length}`}
          fill
          sizes="(min-width: 1024px) 900px, 100vw"
          className="object-cover"
          priority
        />
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
                "bg-muted relative size-16 shrink-0 overflow-hidden rounded-md border-2 outline-none",
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
