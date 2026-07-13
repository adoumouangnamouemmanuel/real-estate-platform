import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@/components/auth/AuthCard";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { ROUTES } from "@/constants/routes";

export const metadata: Metadata = {
  title: "Create an account | ByTe",
  description: "Create a free ByTe account.",
};

export default function RegisterPage() {
  return (
    <AuthCard
      title="Create your account"
      description="Browse and save properties across African markets"
      footer={
        <>
          Already have an account?{" "}
          <Link href={ROUTES.LOGIN} className="text-primary underline">
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthCard>
  );
}
