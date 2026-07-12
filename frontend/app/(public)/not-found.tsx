import Link from "next/link";

import { EmptyState } from "@/components/common/EmptyState";
import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";

export default function NotFound() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <EmptyState
        title="Page not found"
        description="The page you're looking for doesn't exist or may have been moved."
        action={
          <Link href={ROUTES.HOME} className={buttonVariants()}>
            Back to home
          </Link>
        }
      />
    </div>
  );
}
