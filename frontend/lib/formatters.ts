import { DEFAULT_CURRENCY } from "@/constants/config";

export function formatPrice(
  amount: number,
  currency: string = DEFAULT_CURRENCY,
) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Large counts shortened for KPI tiles: 1240 → "1.2K", 2_000_000 → "2M". */
export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

/** "Jul 23, 2026" — used for last-updated columns and dense date cells. */
export function formatDate(input: string | number | Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(input));
}

/** "Wednesday, July 23, 2026" — the welcome header's full, spelled-out date. */
export function formatFullDate(input: string | number | Date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(input));
}

/** "Jul 23, 2026, 2:30 PM" — appointment slots and timestamps that need the time. */
export function formatDateTime(input: string | number | Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(input));
}

const RELATIVE_UNITS: { unit: Intl.RelativeTimeFormatUnit; ms: number }[] = [
  { unit: "year", ms: 1000 * 60 * 60 * 24 * 365 },
  { unit: "month", ms: 1000 * 60 * 60 * 24 * 30 },
  { unit: "week", ms: 1000 * 60 * 60 * 24 * 7 },
  { unit: "day", ms: 1000 * 60 * 60 * 24 },
  { unit: "hour", ms: 1000 * 60 * 60 },
  { unit: "minute", ms: 1000 * 60 },
];

/**
 * "2 hours ago" / "in 3 days" — signed, so it reads correctly for both past
 * activity and upcoming appointments. `now` is injectable for deterministic tests.
 */
export function formatRelativeTime(
  input: string | number | Date,
  now: number = Date.now(),
) {
  const deltaMs = new Date(input).getTime() - now;
  const formatter = new Intl.RelativeTimeFormat("en-US", { numeric: "auto" });

  for (const { unit, ms } of RELATIVE_UNITS) {
    if (Math.abs(deltaMs) >= ms) {
      return formatter.format(Math.round(deltaMs / ms), unit);
    }
  }

  return formatter.format(Math.round(deltaMs / 1000), "second");
}
