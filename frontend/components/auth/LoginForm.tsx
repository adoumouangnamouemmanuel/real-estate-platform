"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { FormField } from "@/components/auth/FormField";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/hooks/useAuth";
import {
  getPostLoginDestination,
  getSafeRedirectPath,
} from "@/lib/authRedirect";
import { getErrorMessage } from "@/lib/errors";
import { loginSchema, type LoginValues } from "@/lib/validation/auth";
import { authService } from "@/services";

interface LoginFormProps {
  /** Where to send the user after a successful login — set by proxy.ts's ?redirect= when it bounced them here. */
  redirectTo?: string;
}

export function LoginForm({ redirectTo }: LoginFormProps) {
  const router = useRouter();
  const { setAuth } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginValues) {
    setFormError(null);

    try {
      const session = await authService.login(values);
      setAuth(session.user, session.accessToken);
      router.push(
        getSafeRedirectPath(redirectTo) ??
          getPostLoginDestination(session.user),
      );
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-4"
    >
      <FormField
        label="Email"
        htmlFor="login-email"
        error={errors.email?.message}
      >
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          aria-invalid={!!errors.email}
          {...register("email")}
        />
      </FormField>

      <FormField
        label="Password"
        htmlFor="login-password"
        error={errors.password?.message}
      >
        <PasswordInput
          id="login-password"
          autoComplete="current-password"
          aria-invalid={!!errors.password}
          {...register("password")}
        />
      </FormField>

      <div className="flex justify-end">
        <Link
          href={ROUTES.FORGOT_PASSWORD}
          className="text-primary text-sm hover:underline"
        >
          Forgot password?
        </Link>
      </div>

      {formError && (
        <p role="alert" className="text-destructive text-sm">
          {formError}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
