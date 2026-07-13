import { z } from "zod";

// Minimum length only, no forced composition rules (uppercase/symbol/etc.) — this
// follows NIST SP 800-63B / current OWASP ASVS guidance, which favors length over
// arbitrary complexity mandates. Max length guards against DoS via oversized input.
const password = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(128, "Password must be at most 128 characters.");

export const loginSchema = z.object({
  email: z.email("Enter a valid email address."),
  // Login intentionally does not re-validate password strength — an existing
  // account may predate the current policy. Only presence is required here.
  password: z.string().min(1, "Password is required."),
});

export type LoginValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Enter your full name.")
      .max(100, "Full name is too long."),
    email: z.email("Enter a valid email address."),
    password,
    confirmPassword: z.string(),
    acceptTerms: z.literal(true, {
      error: "You must accept the Terms of Service and Privacy Policy.",
    }),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords don't match.",
    path: ["confirmPassword"],
  });

export type RegisterValues = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.email("Enter a valid email address."),
});

export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password,
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords don't match.",
    path: ["confirmPassword"],
  });

export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
