import { Building2 } from "lucide-react";
import Image from "next/image";

import { cn } from "@/lib/utils";

interface DeveloperAvatarProps {
  logoUrl?: string;
  name: string;
  size?: number;
  className?: string;
}

/** Logo with a graceful fallback — shared by DeveloperCard and DeveloperInfoCard. */
export function DeveloperAvatar({
  logoUrl,
  name,
  size = 40,
  className,
}: DeveloperAvatarProps) {
  return (
    <div
      className={cn(
        "bg-muted text-muted-foreground relative shrink-0 overflow-hidden rounded-full",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt={`${name} logo`}
          fill
          sizes={`${size}px`}
          className="object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <Building2 className="size-1/2" aria-hidden />
        </div>
      )}
    </div>
  );
}
