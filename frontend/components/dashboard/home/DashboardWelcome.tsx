"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardSummary } from "@/hooks/useDashboard";
import { formatFullDate } from "@/lib/formatters";

function greeting(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

/**
 * The dashboard's opening header: a time-of-day greeting to the signed-in
 * developer, their company, and the current date. Identity comes from the
 * auth store (instant, no flash); the company name comes through the
 * services layer, so it shows a skeleton until it resolves.
 *
 * Deliberately does not summarize pending appointment/notification counts
 * here anymore — that duplicated DashboardActionNeeded's own, more
 * actionable framing of the same numbers (see the Dashboard UX audit).
 * "What's happening" belongs to Action Needed now; this section is purely
 * identity and context.
 */
export function DashboardWelcome() {
  const { user } = useAuth();
  const { data: summary } = useDashboardSummary();

  const now = new Date();
  const name = user ? firstName(user.fullName) : null;

  return (
    <section
      aria-labelledby="dashboard-welcome-heading"
      className="flex flex-col gap-1"
    >
      <p className="text-muted-foreground text-sm">{formatFullDate(now)}</p>
      <h1 id="dashboard-welcome-heading" className="text-dashboard-title">
        {greeting(now.getHours())}
        {name ? `, ${name}` : ""}
      </h1>
      <div className="text-muted-foreground text-sm">
        {summary ? (
          <p>
            Here&apos;s what&apos;s happening at{" "}
            <span className="text-foreground font-medium">
              {summary.companyName}
            </span>{" "}
            today.
          </p>
        ) : (
          <Skeleton className="h-5 w-64" />
        )}
      </div>
    </section>
  );
}
