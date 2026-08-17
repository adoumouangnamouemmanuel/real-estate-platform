import Link from "next/link";

import {
  GlassSurface,
  ImageCrossfade,
  MotionReveal,
} from "@/components/motion";
import { APP_NAME } from "@/constants/config";
import { ROUTES } from "@/constants/routes";
import { HERO_IMAGES } from "@/lib/demoImagery";

interface AuthCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/** Shared centered-card shell for login/register/forgot-password/reset-password. */
export function AuthCard({
  title,
  description,
  children,
  footer,
}: AuthCardProps) {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-4 py-12">
      <ImageCrossfade images={HERO_IMAGES} className="absolute inset-0" />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/60 to-black/40"
      />

      <MotionReveal className="relative flex w-full max-w-sm flex-col gap-6">
        <Link
          href={ROUTES.HOME}
          className="self-center text-lg font-semibold tracking-tight text-white"
        >
          {APP_NAME}
        </Link>

        <GlassSurface
          tone="panel"
          className="flex flex-col gap-6 rounded-lg p-6"
        >
          <div className="flex flex-col gap-1 text-center">
            <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
            {description && (
              <p className="text-muted-foreground text-sm">{description}</p>
            )}
          </div>

          {children}
        </GlassSurface>

        {footer && (
          <div className="text-center text-sm text-white">{footer}</div>
        )}
      </MotionReveal>
    </div>
  );
}
