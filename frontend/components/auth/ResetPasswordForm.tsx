"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { InvalidResetLink } from "@/components/auth/InvalidResetLink";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Loading } from "@/components/common/Loading";
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

type TokenStatus = "checking" | "valid" | "invalid" | "expired";

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter();
  const [tokenStatus, setTokenStatus] = useState<TokenStatus>("checking");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    authService.validateResetToken(token).then((result) => {
      if (cancelled) return;
      setTokenStatus(
        result.valid ? "valid" : result.expired ? "expired" : "invalid",
      );
    });

    return () => {
      cancelled = true;
    };
  }, [token]);

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

  if (tokenStatus === "checking") {
    return <Loading />;
  }

  if (tokenStatus === "invalid" || tokenStatus === "expired") {
    return <InvalidResetLink reason={tokenStatus} />;
  }

  return (
    <form
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
