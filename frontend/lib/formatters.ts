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
