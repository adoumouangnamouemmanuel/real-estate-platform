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

/**
 * Plain tables, not a pie/donut — per the Phase 6.7 design review, a
 * categorical breakdown with no inherent order or trend scans faster as
 * numbers than as angles a reader has to compare. Always current-state
 * (not period-scoped): "what do I have right now" has no date range.
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
                <TableHead className="text-right">Count</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {portfolio.byStatus
                .filter((entry) => entry.count > 0)
                .map((entry) => (
                  <TableRow key={entry.status}>
                    <TableCell>{PROPERTY_STATUS_LABEL[entry.status]}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {entry.count}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Count</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {portfolio.byCategory
                .filter((entry) => entry.count > 0)
                .map((entry) => (
                  <TableRow key={entry.category}>
                    <TableCell>{CATEGORY_LABEL[entry.category]}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {entry.count}
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
