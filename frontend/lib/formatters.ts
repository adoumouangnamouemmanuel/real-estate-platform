import { getStoredLanguage } from "@/lib/locale";
import { DEFAULT_CURRENCY } from "@/constants/config";

export function formatPrice(
  amount: number,
  currency: string | null = DEFAULT_CURRENCY,
  language: string = getStoredLanguage(),
) {
  if (currency === null)
    return (
      new Intl.NumberFormat(language).format(amount) +
      (language === "fr" ? " (devise à confirmer)" : " (currency unconfirmed)")
    );
  return new Intl.NumberFormat(language === "fr" ? "fr-BF" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Large counts shortened for KPI tiles: 1240 → "1.2K", 2_000_000 → "2M". */
export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat(
    getStoredLanguage() === "fr" ? "fr-BF" : "en-US",
    {
      notation: "compact",
      maximumFractionDigits: 1,
    },
  ).format(value);
}

/** "Jul 23, 2026" — used for last-updated columns and dense date cells. */
export function formatDate(input: string | number | Date) {
  return new Intl.DateTimeFormat(
    getStoredLanguage() === "fr" ? "fr-BF" : "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    },
  ).format(new Date(input));
}

/** "Wednesday, July 23, 2026" — the welcome header's full, spelled-out date. */
export function formatFullDate(input: string | number | Date) {
  return new Intl.DateTimeFormat(
    getStoredLanguage() === "fr" ? "fr-BF" : "en-US",
    {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    },
  ).format(new Date(input));
}

/** "Jul 23, 2026, 2:30 PM" — appointment slots and timestamps that need the time. */
export function formatDateTime(input: string | number | Date) {
  return new Intl.DateTimeFormat(
    getStoredLanguage() === "fr" ? "fr-BF" : "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    },
  ).format(new Date(input));
}

/** "2:30 PM" — for rows already grouped under a date header, where repeating the date would be redundant. */
export function formatTime(input: string | number | Date) {
  return new Intl.DateTimeFormat(
    getStoredLanguage() === "fr" ? "fr-BF" : "en-US",
    {
      hour: "numeric",
      minute: "2-digit",
    },
  ).format(new Date(input));
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
  const formatter = new Intl.RelativeTimeFormat(
    getStoredLanguage() === "fr" ? "fr-BF" : "en-US",
    { numeric: "auto" },
  );

  for (const { unit, ms } of RELATIVE_UNITS) {
    if (Math.abs(deltaMs) >= ms) {
      return formatter.format(Math.round(deltaMs / ms), unit);
    }
  }

  return formatter.format(Math.round(deltaMs / 1000), "second");
}

export function formatRentPeriod(
  period?: string | null,
  language: string = getStoredLanguage(),
) {
  const labels: Record<string, string> =
    language === "fr"
      ? { DAY: "/jour", WEEK: "/semaine", MONTH: "/mois", YEAR: "/an" }
      : { DAY: "/day", WEEK: "/week", MONTH: "/month", YEAR: "/year" };
  return period ? (labels[period] ?? "") : "";
}
