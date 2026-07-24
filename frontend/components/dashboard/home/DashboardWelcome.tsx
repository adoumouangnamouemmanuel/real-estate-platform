"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardMetrics, useDashboardSummary } from "@/hooks/useDashboard";
import { formatFullDate } from "@/lib/formatters";

function greeting(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

function pluralize(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

/**
 * The dashboard's opening header: a time-of-day greeting to the signed-in
 * developer, their company and the current date, and a one-line summary of what
 * needs attention. Identity comes from the auth store (instant, no flash);
 * company and the summary counts come through the services layer, so each shows
 * a skeleton until it resolves.
 */
export function DashboardWelcome() {
  const { user } = useAuth();
  const { data: summary } = useDashboardSummary();
  const { data: metrics } = useDashboardMetrics();

  const now = new Date();
  const name = user ? firstName(user.fullName) : null;

  return (
    <section
      aria-labelledby="dashboard-welcome-heading"
      className="flex flex-col gap-1"
    >
      <p className="text-muted-foreground text-sm">{formatFullDate(now)}</p>
      <h1
        id="dashboard-welcome-heading"
        className="text-2xl font-semibold tracking-tight"
      >
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
      <div className="mt-1 text-sm" aria-live="polite">
        {metrics ? (
          <p>
            You have{" "}
            <span className="text-foreground font-medium">
              {pluralize(
                metrics.appointmentRequests,
                "new appointment request",
              )}
            </span>{" "}
            and{" "}
            <span className="text-foreground font-medium">
              {pluralize(metrics.unreadNotifications, "unread notification")}
            </span>
            .
          </p>
        ) : (
          <Skeleton className="h-5 w-80 max-w-full" />
        )}
      </div>
    </section>
  );
}
