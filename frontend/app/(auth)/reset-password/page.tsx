import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/AuthCard";
import { RecoveryLink } from "@/components/auth/RecoveryLink";
export const metadata: Metadata = {
  title: "Reset password | Lumavok",
  referrer: "no-referrer",
};
export default function ResetPasswordPage() {
  return (
    <AuthCard
      title="Reset your password"
      description="Choose a new password below"
    >
      <RecoveryLink />
    </AuthCard>
  );
}
