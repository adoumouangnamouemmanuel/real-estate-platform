import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/common/EmptyState";
import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";

export const metadata: Metadata = {
  title: "Access denied | ByTe",
};

export default function ForbiddenPage() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <EmptyState
        title="Access denied"
        description="Your account doesn't have permission to view this page."
        action={
          <Link href={ROUTES.HOME} className={buttonVariants()}>
            Back to home
          </Link>
        }
      />
    </div>
  );
}
