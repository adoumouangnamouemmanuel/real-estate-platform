import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";
import { ROUTES } from "@/constants/routes";

export const metadata: Metadata = {
  title: "Log in | ByTe",
  description: "Sign in to your ByTe account.",
};

interface LoginPageProps {
  searchParams: Promise<{ redirect?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { redirect } = await searchParams;

  return (
    <AuthCard
      title="Welcome back"
      description="Sign in to your ByTe account"
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href={ROUTES.REGISTER} className="text-primary hover:underline">
            Sign up
          </Link>
        </>
      }
    >
      <LoginForm redirectTo={redirect} />
    </AuthCard>
  );
}
