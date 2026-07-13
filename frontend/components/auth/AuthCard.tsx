import Link from "next/link";

import { APP_NAME } from "@/constants/config";
import { ROUTES } from "@/constants/routes";

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
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link
          href={ROUTES.HOME}
          className="self-center text-lg font-semibold tracking-tight"
        >
          {APP_NAME}
        </Link>

        <div className="border-border flex flex-col gap-6 rounded-lg border p-6">
          <div className="flex flex-col gap-1 text-center">
            <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
            {description && (
              <p className="text-muted-foreground text-sm">{description}</p>
            )}
          </div>

          {children}
        </div>

        {footer && <div className="text-center text-sm">{footer}</div>}
      </div>
    </div>
  );
}
