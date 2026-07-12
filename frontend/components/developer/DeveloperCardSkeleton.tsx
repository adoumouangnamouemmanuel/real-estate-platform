import { Skeleton } from "@/components/ui/skeleton";

/** Mirrors DeveloperCard's layout so the loading state doesn't shift once real cards render. */
export function DeveloperCardSkeleton(props: React.ComponentProps<"div">) {
  return (
    <div
      className="border-border flex flex-col gap-3 rounded-lg border p-4"
      {...props}
    >
      <div className="flex items-center gap-3">
        <Skeleton className="size-12 rounded-full" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
    </div>
  );
}
