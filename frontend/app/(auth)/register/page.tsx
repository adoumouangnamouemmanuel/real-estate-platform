import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@/components/auth/AuthCard";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { APP_NAME } from "@/constants/config";
import { ROUTES } from "@/constants/routes";

export const metadata: Metadata = {
  title: `Create an account | ${APP_NAME}`,
  description: `Create a free ${APP_NAME} account.`,
};

export default function RegisterPage() {
  return (
    <AuthCard
      title="Create your account"
      description="Browse and save properties across African markets"
      footer={
        <>
          Already have an account?{" "}
          <Link
            href={ROUTES.LOGIN}
            className="font-medium text-white underline underline-offset-2 hover:text-white/80"
          >
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthCard>
  );
}
