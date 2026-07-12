"use client";

import { MessageCircle } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/errors";
import { getWhatsAppLink } from "@/lib/whatsapp";

interface WhatsAppCTAProps {
  message: string;
  label?: string;
}

/**
 * Domain-agnostic — used by both the property detail page and the developer profile page.
 * Fetches the deeplink on click rather than embedding it in the DOM (docs/ARCHITECTURE.md §8's
 * number-masking design).
 */
export function WhatsAppCTA({
  message,
  label = "Contact on WhatsApp",
}: WhatsAppCTAProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setIsLoading(true);
    setError(null);

    try {
      const { deeplink } = await getWhatsAppLink(message);
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
        {isLoading ? "Opening WhatsApp…" : label}
      </Button>
      {error && (
        <p role="alert" className="text-destructive text-xs">
          {error}
        </p>
      )}
    </div>
  );
}
