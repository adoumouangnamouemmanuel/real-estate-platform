import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@/components/auth/AuthCard";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { APP_NAME } from "@/constants/config";
import { ROUTES } from "@/constants/routes";

export const metadata: Metadata = {
  title: `Forgot password | ${APP_NAME}`,
  description: `Reset your ${APP_NAME} account password.`,
};

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Forgot your password?"
      description="Enter your email and we'll send you a reset link"
      footer={
        <Link href={ROUTES.LOGIN} className="text-primary underline">
          Back to sign in
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
