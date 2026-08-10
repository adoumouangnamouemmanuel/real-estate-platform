import type { UserRole } from "@/types";

/**
 * Maps the frontend's existing internal role model (`USER`/`DEVELOPER`/`ADMIN`
 * — unchanged, per the reconciliation's explicit "do not rename roles blindly"
 * instruction) to the product-facing terminology the team settled on in the
 * meeting (CLIENT/DEVELOPER/SUPER ADMIN). Nothing reads `UserRole` through
 * this for authorization decisions — `RequireAuth`'s `ROLE_RANK` is still the
 * only source of truth there — this exists purely for display copy, so a
 * future rename of the underlying `UserRole` values is a one-file change
 * here, not a hunt through every place a role is shown to a user.
 *
 * See docs/PRODUCT_BACKEND_RECONCILIATION.md §5 for the full migration
 * analysis (in particular: renaming `ADMIN` to `SUPER_ADMIN` is not just a
 * label change — whether a super admin should still rank-inherit every
 * DEVELOPER permission is an open product decision, not settled here).
 */
export const PRODUCT_ROLE_LABEL: Record<UserRole, string> = {
  USER: "Client",
  DEVELOPER: "Developer",
  ADMIN: "Super Admin",
};

export function getProductRoleLabel(role: UserRole): string {
  return PRODUCT_ROLE_LABEL[role];
}
