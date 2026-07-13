import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";

interface InvalidResetLinkProps {
  reason: "missing" | "invalid" | "expired";
}

const MESSAGES: Record<InvalidResetLinkProps["reason"], string> = {
  missing: "This link is invalid",
  invalid: "This link is invalid",
  expired: "This link has expired",
};

export function InvalidResetLink({ reason }: InvalidResetLinkProps) {
  return (
    <div role="alert" className="flex flex-col gap-3 text-center text-sm">
      <p className="font-medium">{MESSAGES[reason]}</p>
      <p className="text-muted-foreground">
        Request a new password reset link to continue.
      </p>
      <Link href={ROUTES.FORGOT_PASSWORD} className={buttonVariants()}>
        Request new link
      </Link>
    </div>
  );
}
