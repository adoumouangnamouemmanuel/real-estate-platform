"use client";

import { EmptyState } from "@/components/common/EmptyState";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { PROPERTY_STATUS_LABEL } from "@/components/dashboard/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PROPERTY_CATEGORIES } from "@/constants/categories";
import type { PortfolioComposition } from "@/types";

interface PortfolioCompositionTableProps {
  portfolio: PortfolioComposition | undefined;
  isLoading: boolean;
}

const CATEGORY_LABEL = Object.fromEntries(
  PROPERTY_CATEGORIES.map((category) => [category.value, category.label]),
) as Record<string, string>;

/** A share-of-portfolio bar + count, one row of one breakdown at a time — the
 * exact same track/fill treatment AppointmentFunnelChart already uses, so the
 * page reads as one visual language instead of two different chart styles.
 * Combined into the table's existing single value column (not a third
 * column) — two of these tables already sit side by side, and a third column
 * on each pushed the count clean off the edge of the card at desktop widths. */
function ShareBar({ count, total }: { count: number; total: number }) {
  const percent = total === 0 ? 0 : Math.round((count / total) * 100);
  return (
    <div className="flex items-center justify-end gap-2">
      <div className="bg-muted h-2 w-10 shrink-0 overflow-hidden rounded-full">
        <div
          aria-hidden
          className="bg-primary h-full rounded-full"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-muted-foreground w-8 shrink-0 text-right text-xs tabular-nums">
        {percent}%
      </span>
      <span className="w-6 shrink-0 text-right text-sm tabular-nums">
        {count}
      </span>
    </div>
  );
}

/**
 * Plain tables, not a pie/donut — per the Phase 6.7 design review, a
 * categorical breakdown with no inherent order or trend scans faster as
 * numbers than as angles a reader has to compare. Always current-state
 * (not period-scoped): "what do I have right now" has no date range. Each
 * row's share-of-portfolio bar adds "how much" at a glance on top of the
 * exact count, without inventing any statistic the raw counts don't already
 * support (it's the same numbers, just also expressed as a proportion).
 */
export function PortfolioCompositionTable({
  portfolio,
  isLoading,
}: PortfolioCompositionTableProps) {
  return (
    <DashboardSection
      title="Portfolio Composition"
      description={
        portfolio
          ? `${portfolio.totalListings} listing${portfolio.totalListings === 1 ? "" : "s"} across every status.`
          : undefined
      }
    >
      {isLoading || !portfolio ? (
        <Skeleton className="h-48 w-full" />
      ) : portfolio.totalListings === 0 ? (
        <EmptyState
          title="No properties yet"
          description="Properties you add will appear here."
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Share of portfolio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {portfolio.byStatus
                .filter((entry) => entry.count > 0)
                .map((entry) => (
                  <TableRow key={entry.status}>
                    <TableCell>{PROPERTY_STATUS_LABEL[entry.status]}</TableCell>
                    <TableCell>
                      <ShareBar
                        count={entry.count}
                        total={portfolio.totalListings}
                      />
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Share of portfolio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {portfolio.byCategory
                .filter((entry) => entry.count > 0)
                .map((entry) => (
                  <TableRow key={entry.category}>
                    <TableCell>{CATEGORY_LABEL[entry.category]}</TableCell>
                    <TableCell>
                      <ShareBar
                        count={entry.count}
                        total={portfolio.totalListings}
                      />
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      )}
    </DashboardSection>
  );
}
