import type { Metadata } from "next";

import { AuthCard } from "@/components/auth/AuthCard";
import { InvalidResetLink } from "@/components/auth/InvalidResetLink";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { APP_NAME } from "@/constants/config";

export const metadata: Metadata = {
  title: `Reset password | ${APP_NAME}`,
  description: `Choose a new password for your ${APP_NAME} account.`,
};

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const { token } = await searchParams;

  return (
    <AuthCard
      title="Reset your password"
      description="Choose a new password below"
    >
      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <InvalidResetLink reason="missing" />
      )}
    </AuthCard>
  );
}
