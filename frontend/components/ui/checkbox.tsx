import { cn } from "@/lib/utils";

function Checkbox({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type="checkbox"
      data-slot="checkbox"
      className={cn(
        "border-border accent-primary size-4 shrink-0 rounded-sm border",
        "focus-visible:ring-ring/50 focus-visible:ring-3 focus-visible:outline-none",
        "aria-invalid:border-destructive",
        className,
      )}
      {...props}
    />
  );
}

export { Checkbox };
