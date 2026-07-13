import { describe, expect, it } from "vitest";

import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "./auth";

describe("loginSchema", () => {
  it("accepts a valid email and any non-empty password", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "x",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "x",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty password", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });

  it("does not enforce length/complexity on login passwords", () => {
    // An existing account may predate the current password policy — login only
    // requires presence, not the registration policy's minimum length.
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "a",
    });
    expect(result.success).toBe(true);
  });
});

describe("registerSchema", () => {
  const validPayload = {
    fullName: "Ama Boateng",
    email: "ama@example.com",
    password: "Password123",
    confirmPassword: "Password123",
    acceptTerms: true as const,
  };

  it("accepts a fully valid registration payload", () => {
    expect(registerSchema.safeParse(validPayload).success).toBe(true);
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = registerSchema.safeParse({
      ...validPayload,
      password: "Short1",
      confirmPassword: "Short1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects mismatched password/confirmPassword", () => {
    const result = registerSchema.safeParse({
      ...validPayload,
      confirmPassword: "Different123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["confirmPassword"]);
    }
  });

  it("rejects when acceptTerms is false", () => {
    const result = registerSchema.safeParse({
      ...validPayload,
      acceptTerms: false,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a full name under 2 characters", () => {
    const result = registerSchema.safeParse({ ...validPayload, fullName: "A" });
    expect(result.success).toBe(false);
  });
});

describe("forgotPasswordSchema", () => {
  it("accepts a valid email", () => {
    expect(
      forgotPasswordSchema.safeParse({ email: "test@example.com" }).success,
    ).toBe(true);
  });

  it("rejects an invalid email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "nope" }).success).toBe(
      false,
    );
  });
});

describe("resetPasswordSchema", () => {
  it("accepts matching passwords meeting the length policy", () => {
    const result = resetPasswordSchema.safeParse({
      password: "NewPassword123",
      confirmPassword: "NewPassword123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects mismatched passwords", () => {
    const result = resetPasswordSchema.safeParse({
      password: "NewPassword123",
      confirmPassword: "Mismatch123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a password over the 128-character maximum", () => {
    const tooLong = "a".repeat(129);
    const result = resetPasswordSchema.safeParse({
      password: tooLong,
      confirmPassword: tooLong,
    });
    expect(result.success).toBe(false);
  });
});
