import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/common/EmptyState";
import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";

export const metadata: Metadata = {
  title: "Sign in required | ByTe",
};

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <EmptyState
        title="Sign in required"
        description="You need to sign in to view this page."
        action={
          <Link href={ROUTES.LOGIN} className={buttonVariants()}>
            Sign in
          </Link>
        }
      />
    </div>
  );
}
