"use client";

import { MessageCircle } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/errors";
import { propertyService } from "@/services";
import type { ListingType } from "@/types";

interface WhatsAppCTAProps {
  property: {
    title: string;
    city: string;
    listingType: ListingType;
  };
}

/**
 * Fetches the deeplink on click rather than embedding it in the DOM — the developer's number
 * is never sent to the client before this call (docs/ARCHITECTURE.md §8's number-masking
 * design). Only rendered when FEATURES.WHATSAPP_CONTACT is on; see PropertyDetailView.
 */
export function WhatsAppCTA({ property }: WhatsAppCTAProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setIsLoading(true);
    setError(null);

    try {
      const { deeplink } = await propertyService.getWhatsAppLink(property);
      window.open(deeplink, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <Button onClick={handleClick} disabled={isLoading} className="gap-2">
        <MessageCircle aria-hidden />
        {isLoading ? "Opening WhatsApp…" : "Contact on WhatsApp"}
      </Button>
      {error && (
        <p role="alert" className="text-destructive text-xs">
          {error}
        </p>
      )}
    </div>
  );
}
