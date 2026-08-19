import { Skeleton } from "@/components/ui/skeleton";

/** Mirrors PropertyCard's layout so the loading state doesn't shift once real cards render. */
export function PropertyCardSkeleton(props: React.ComponentProps<"div">) {
  return (
    <div className="card-surface flex flex-col overflow-hidden" {...props}>
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="flex flex-col gap-2.5 p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="mt-1 h-4 w-1/3" />
      </div>
    </div>
  );
}
