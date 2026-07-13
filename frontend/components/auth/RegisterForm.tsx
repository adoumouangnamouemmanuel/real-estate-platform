"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { FormField } from "@/components/auth/FormField";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { getPostLoginDestination } from "@/lib/authRedirect";
import { getErrorMessage } from "@/lib/errors";
import { registerSchema, type RegisterValues } from "@/lib/validation/auth";
import { authService } from "@/services";

export function RegisterForm() {
  const router = useRouter();
  const { setAuth } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(values: RegisterValues) {
    setFormError(null);

    try {
      const session = await authService.register(values);
      // Auto-login after registration — low-friction onboarding matches the
      // product's public-access-first philosophy (docs/ARCHITECTURE.md §1).
      setAuth(session.user, session.accessToken);
      router.push(getPostLoginDestination(session.user));
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
        label="Full name"
        htmlFor="register-name"
        error={errors.fullName?.message}
      >
        <Input
          id="register-name"
          autoComplete="name"
          aria-invalid={!!errors.fullName}
          {...register("fullName")}
        />
      </FormField>

      <FormField
        label="Email"
        htmlFor="register-email"
        error={errors.email?.message}
      >
        <Input
          id="register-email"
          type="email"
          autoComplete="email"
          aria-invalid={!!errors.email}
          {...register("email")}
        />
      </FormField>

      <FormField
        label="Password"
        htmlFor="register-password"
        error={errors.password?.message}
      >
        <PasswordInput
          id="register-password"
          autoComplete="new-password"
          aria-invalid={!!errors.password}
          {...register("password")}
        />
      </FormField>

      <FormField
        label="Confirm password"
        htmlFor="register-confirm-password"
        error={errors.confirmPassword?.message}
      >
        <PasswordInput
          id="register-confirm-password"
          autoComplete="new-password"
          aria-invalid={!!errors.confirmPassword}
          {...register("confirmPassword")}
        />
      </FormField>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="register-terms"
          className="flex items-start gap-2 text-sm"
        >
          <Checkbox
            id="register-terms"
            className="mt-0.5"
            aria-invalid={!!errors.acceptTerms}
            {...register("acceptTerms")}
          />
          <span>I agree to the Terms of Service and Privacy Policy.</span>
        </label>
        {errors.acceptTerms?.message && (
          <p role="alert" className="text-destructive text-xs">
            {errors.acceptTerms.message}
          </p>
        )}
      </div>

      {formError && (
        <p role="alert" className="text-destructive text-sm">
          {formError}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
