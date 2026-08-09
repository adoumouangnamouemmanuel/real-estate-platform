"use client";

import { Check, Share2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

interface ShareButtonProps {
  title: string;
  className?: string;
}

/**
 * Native Web Share API on devices that support it (mobile browsers, mostly);
 * falls back to copying the current URL to the clipboard everywhere else —
 * no third-party share-sheet dependency needed for either path.
 */
export function ShareButton({ title, className }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = window.location.href;

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url });
      } catch {
        // User cancelled the native share sheet — not an error.
      }
      return;
    }

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon-lg"
      onClick={handleShare}
      aria-label={copied ? "Link copied to clipboard" : `Share ${title}`}
      className={className}
    >
      {copied ? (
        <Check className="text-primary" aria-hidden />
      ) : (
        <Share2 aria-hidden />
      )}
    </Button>
  );
}
