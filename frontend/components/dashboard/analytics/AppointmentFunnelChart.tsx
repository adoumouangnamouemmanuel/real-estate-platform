"use client";

import { motion } from "framer-motion";
import { useState } from "react";

import { EmptyState } from "@/components/common/EmptyState";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { APPOINTMENT_STATUS_LABEL } from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DURATION_SLOW, EASE_CINEMATIC } from "@/lib/motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AppointmentFunnel } from "@/types";

interface AppointmentFunnelChartProps {
  funnel: AppointmentFunnel | undefined;
  isLoading: boolean;
}

/**
 * The one real chart on this page (see the Phase 6.7 design review): a
 * funnel is the one place a chart beats a table, since the *shape* of
 * drop-off across ordered stages is the insight. A "View as table" toggle
 * renders the identical data as an actual `<table>` — not a hidden
 * screen-reader-only duplicate, a fully visible equal representation, for
 * anyone (sighted or not) who wants exact numbers over a shape. The bar
 * chart's own bars are decorative (`aria-hidden`); the label and count next
 * to each one are plain visible text, already in natural reading order, so
 * nothing but the pure visual fill is ever hidden from assistive tech.
 */
export function AppointmentFunnelChart({
  funnel,
  isLoading,
}: AppointmentFunnelChartProps) {
  const [view, setView] = useState<"chart" | "table">("chart");

  const maxCount = Math.max(
    1,
    ...(funnel?.stages.map((stage) => stage.count) ?? []),
  );

  return (
    <DashboardSection
      title="Appointment Funnel"
      description="Requested viewings and how they resolved this period."
      action={
        !isLoading &&
        funnel &&
        funnel.totalRequested > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setView(view === "chart" ? "table" : "chart")}
          >
            {view === "chart" ? "View as table" : "View as chart"}
          </Button>
        )
      }
    >
      {isLoading || !funnel ? (
        <Skeleton className="h-48 w-full" />
      ) : funnel.totalRequested === 0 ? (
        <EmptyState
          title="No appointments requested this period"
          description="Try a longer period, or check back once requests come in."
        />
      ) : view === "table" ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Stage</TableHead>
              <TableHead className="text-right">Count</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {funnel.stages.map((stage) => (
              <TableRow key={stage.status}>
                <TableCell>{APPOINTMENT_STATUS_LABEL[stage.status]}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {stage.count}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="flex flex-col gap-3">
          {funnel.stages.map((stage) => (
            <div key={stage.status} className="flex items-center gap-3">
              <span className="text-muted-foreground w-28 shrink-0 text-sm">
                {APPOINTMENT_STATUS_LABEL[stage.status]}
              </span>
              <div className="bg-muted h-6 flex-1 overflow-hidden rounded-md">
                <motion.div
                  aria-hidden
                  className="bg-primary h-full rounded-md"
                  initial={{ width: 0 }}
                  animate={{ width: `${(stage.count / maxCount) * 100}%` }}
                  transition={{ duration: DURATION_SLOW, ease: EASE_CINEMATIC }}
                />
              </div>
              <span className="w-8 shrink-0 text-right text-sm tabular-nums">
                {stage.count}
              </span>
            </div>
          ))}
        </div>
      )}
    </DashboardSection>
  );
}
