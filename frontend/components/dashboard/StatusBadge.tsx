import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AppointmentStatus, PropertyStatus } from "@/types";

/**
 * Semantic tone for a status pill. Kept abstract (not per-domain) so the same
 * badge serves property statuses, appointment statuses, and anything later.
 */
type StatusTone = "positive" | "warning" | "info" | "muted" | "danger";

/**
 * The brand palette is intentionally monochrome, so the coloured dot is
 * supplementary — the text label always carries the meaning (WCAG 1.4.1). The
 * dot is decorative (aria-hidden), so its colour never needs to meet text-contrast.
 */
const TONE_DOT: Record<StatusTone, string> = {
  positive: "bg-emerald-500",
  warning: "bg-amber-500",
  info: "bg-sky-500",
  muted: "bg-muted-foreground",
  danger: "bg-red-500",
};

interface StatusBadgeProps {
  label: string;
  tone: StatusTone;
  className?: string;
}

/** Reusable status pill: a neutral badge + a tone dot. */
export function StatusBadge({ label, tone, className }: StatusBadgeProps) {
  return (
    <Badge variant="secondary" className={cn("gap-1.5", className)}>
      <span
        className={cn("size-1.5 rounded-full", TONE_DOT[tone])}
        aria-hidden
      />
      {label}
    </Badge>
  );
}

const PROPERTY_STATUS: Record<
  PropertyStatus,
  { label: string; tone: StatusTone }
> = {
  ACTIVE: { label: "Active", tone: "positive" },
  RESERVED: { label: "Reserved", tone: "warning" },
  SOLD: { label: "Sold", tone: "info" },
  DRAFT: { label: "Draft", tone: "muted" },
  SUSPENDED: { label: "Suspended", tone: "danger" },
};

export function PropertyStatusBadge({ status }: { status: PropertyStatus }) {
  const { label, tone } = PROPERTY_STATUS[status];
  return <StatusBadge label={label} tone={tone} />;
}

/** Single source of truth for a property status's display label — reused by the My Properties filter dropdown so it can't drift from the badge text. */
export const PROPERTY_STATUS_LABEL: Record<PropertyStatus, string> =
  Object.fromEntries(
    Object.entries(PROPERTY_STATUS).map(([status, { label }]) => [
      status,
      label,
    ]),
  ) as Record<PropertyStatus, string>;

const APPOINTMENT_STATUS: Record<
  AppointmentStatus,
  { label: string; tone: StatusTone }
> = {
  REQUESTED: { label: "Requested", tone: "warning" },
  CONFIRMED: { label: "Confirmed", tone: "positive" },
  RESCHEDULED: { label: "Rescheduled", tone: "info" },
  COMPLETED: { label: "Completed", tone: "info" },
  CANCELLED: { label: "Cancelled", tone: "muted" },
  NO_SHOW: { label: "No Show", tone: "danger" },
};

export function AppointmentStatusBadge({
  status,
}: {
  status: AppointmentStatus;
}) {
  const { label, tone } = APPOINTMENT_STATUS[status];
  return <StatusBadge label={label} tone={tone} />;
}

/** Single source of truth for an appointment status's display label — reused by the Appointments filter bar so it can't drift from the badge text. */
export const APPOINTMENT_STATUS_LABEL: Record<AppointmentStatus, string> =
  Object.fromEntries(
    Object.entries(APPOINTMENT_STATUS).map(([status, { label }]) => [
      status,
      label,
    ]),
  ) as Record<AppointmentStatus, string>;
