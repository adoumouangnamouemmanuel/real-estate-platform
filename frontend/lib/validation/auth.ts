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

// Deliberately NOT chaining .refine()/.check() here for the password-match rule: Zod
// only runs those after every other field in the object has already validated
// successfully, so an unchecked acceptTerms checkbox would silently swallow a
// simultaneous "passwords don't match" error until a second submit. See
// withPasswordMatchResolver, which checks the match independently of the rest of
// the schema so both errors can surface in the same submission.
export const registerSchema = z.object({
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
});

export type RegisterValues = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.email("Enter a valid email address."),
});

export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

// Same reasoning as registerSchema: no .refine() here, see withPasswordMatchResolver.
export const resetPasswordSchema = z.object({
  password,
  confirmPassword: z.string(),
});

export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
