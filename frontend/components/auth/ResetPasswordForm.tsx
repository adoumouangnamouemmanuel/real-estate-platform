"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { PasswordInput } from "@/components/auth/PasswordInput";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { ROUTES } from "@/constants/routes";
import { getErrorMessage } from "@/lib/errors";
import {
  resetPasswordSchema,
  type ResetPasswordValues,
} from "@/lib/validation/auth";
import { withPasswordMatchResolver } from "@/lib/validation/withPasswordMatchResolver";
import { authService } from "@/services";

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: withPasswordMatchResolver(resetPasswordSchema),
  });

  async function onSubmit(values: ResetPasswordValues) {
    setFormError(null);

    try {
      await authService.resetPassword({ token, password: values.password });
      // Force a fresh sign-in with the new password rather than auto-authenticating —
      // a password reset should invalidate whatever session state existed before it.
      router.push(`${ROUTES.LOGIN}?reset=success`);
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  }

  // `method="post"` keeps a pre-hydration native submit out of the URL — see
  // the full explanation in LoginForm. This form carries both the new password
  // and the reset token, so the leak would be doubly sensitive.
  return (
    <form
      method="post"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-4"
    >
      <FormField
        label="New password"
        htmlFor="reset-password"
        error={errors.password?.message}
      >
        <PasswordInput
          id="reset-password"
          autoComplete="new-password"
          aria-invalid={!!errors.password}
          {...register("password")}
        />
      </FormField>

      <FormField
        label="Confirm new password"
        htmlFor="reset-confirm-password"
        error={errors.confirmPassword?.message}
      >
        <PasswordInput
          id="reset-confirm-password"
          autoComplete="new-password"
          aria-invalid={!!errors.confirmPassword}
          {...register("confirmPassword")}
        />
      </FormField>

      {formError && (
        <p role="alert" className="text-destructive text-sm">
          {formError}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Resetting…" : "Reset password"}
      </Button>
    </form>
  );
}
