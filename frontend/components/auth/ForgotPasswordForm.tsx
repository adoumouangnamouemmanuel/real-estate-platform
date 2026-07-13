"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { FormField } from "@/components/auth/FormField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/errors";
import {
  forgotPasswordSchema,
  type ForgotPasswordValues,
} from "@/lib/validation/auth";
import { authService } from "@/services";

export function ForgotPasswordForm() {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  async function onSubmit(values: ForgotPasswordValues) {
    setFormError(null);

    try {
      // Always resolves regardless of whether the email matches an account
      // (docs/ARCHITECTURE.md / OWASP anti-enumeration) — a thrown error here
      // means a real infrastructure failure, not "email not found".
      await authService.requestPasswordReset(values.email);
      setSubmittedEmail(values.email);
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  }

  if (submittedEmail) {
    return (
      <div role="status" className="flex flex-col gap-2 text-center text-sm">
        <p className="font-medium">Check your email</p>
        <p className="text-muted-foreground">
          If an account exists for {submittedEmail}, we&apos;ve sent a link to
          reset your password.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-4"
    >
      <FormField
        label="Email"
        htmlFor="forgot-email"
        error={errors.email?.message}
      >
        <Input
          id="forgot-email"
          type="email"
          autoComplete="email"
          aria-invalid={!!errors.email}
          {...register("email")}
        />
      </FormField>

      {formError && (
        <p role="alert" className="text-destructive text-sm">
          {formError}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}
