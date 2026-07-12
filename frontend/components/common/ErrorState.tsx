import type { ReactNode } from "react";

interface ErrorStateProps {
  title?: string;
  description?: string;
  action?: ReactNode;
}

export function ErrorState({
  title = "Something went wrong.",
  description,
  action,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center"
    >
      <p className="text-sm font-medium">{title}</p>
      {description && (
        <p className="text-muted-foreground text-sm">{description}</p>
      )}
      {action}
    </div>
  );
}
