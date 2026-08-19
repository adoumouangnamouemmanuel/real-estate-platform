import { Skeleton } from "@/components/ui/skeleton";

/** Mirrors DeveloperCard's layout — 72px identity circle, name/location block,
 *  three-line bio, and the bordered metadata footer — so the loading state
 *  doesn't shift once real cards render. */
export function DeveloperCardSkeleton(props: React.ComponentProps<"div">) {
  return (
    <div className="card-surface flex h-full flex-col gap-4 p-5" {...props}>
      <div className="flex items-start gap-4">
        <Skeleton className="size-18 shrink-0 rounded-full" />
        <div className="flex flex-1 flex-col gap-2 pt-1">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>

      <div className="border-border mt-auto flex items-center justify-between border-t pt-4">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  );
}
