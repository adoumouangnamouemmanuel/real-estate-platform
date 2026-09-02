import type { ReactNode } from "react";

/** The shared content-width wrapper every dashboard page renders inside. */
export function DashboardPageContainer({ children }: { children: ReactNode }) {
  return (
    <div className="container-dashboard flex flex-1 flex-col gap-6 pb-32 md:pb-6">
      {children}
    </div>
  );
}
