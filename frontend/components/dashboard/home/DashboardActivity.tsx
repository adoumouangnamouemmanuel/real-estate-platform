"use client";

import { Activity } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { ActivityTimeline } from "@/components/dashboard/ActivityTimeline";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardActivity } from "@/hooks/useDashboard";

/** Data-fetching wrapper around the reusable ActivityTimeline. */
export function DashboardActivity() {
  const { data, isLoading, isError } = useDashboardActivity();

  return (
    <DashboardSection
      title="Recent Activity"
      description="A running log of what's happened across your account."
      icon={Activity}
    >
      {isError ? (
        <ErrorState
          title="Couldn't load your activity."
          description="Please refresh the page to try again."
        />
      ) : isLoading || !data ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex gap-3">
              <Skeleton className="size-8 shrink-0 rounded-full" />
              <div className="flex flex-1 flex-col gap-1.5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : data.length === 0 ? (
        <EmptyState
          title="No activity yet"
          description="Your account activity will appear here as you manage listings and appointments."
        />
      ) : (
        <ActivityTimeline items={data} />
      )}
    </DashboardSection>
  );
}
