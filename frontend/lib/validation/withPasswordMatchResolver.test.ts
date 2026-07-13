import { describe, expect, it } from "vitest";

import { registerSchema, type RegisterValues } from "./auth";
import { withPasswordMatchResolver } from "./withPasswordMatchResolver";

const resolver = withPasswordMatchResolver(registerSchema);
const resolverOptions = { fields: {}, shouldUseNativeValidation: false };

describe("withPasswordMatchResolver", () => {
  it("passes through cleanly when everything is valid", async () => {
    const result = await resolver(
      {
        fullName: "Ama Boateng",
        email: "ama@example.com",
        password: "Password123",
        confirmPassword: "Password123",
        acceptTerms: true,
      },
      undefined,
      resolverOptions,
    );

    expect(result.errors).toEqual({});
  });

  it("reports the mismatch alone when nothing else is wrong", async () => {
    const result = await resolver(
      {
        fullName: "Ama Boateng",
        email: "ama@example.com",
        password: "Password123",
        confirmPassword: "Different123",
        acceptTerms: true,
      },
      undefined,
      resolverOptions,
    );

    expect(result.errors.confirmPassword?.message).toBe(
      "Passwords don't match.",
    );
  });

  it(
    "reports BOTH the mismatch and an unrelated field error in the same submission " +
      "— the exact bug this resolver exists to fix (Zod's .refine() would hide the " +
      "mismatch behind the acceptTerms error until a second submit)",
    async () => {
      const result = await resolver(
        {
          fullName: "Ama Boateng",
          email: "ama@example.com",
          password: "Password123",
          confirmPassword: "Different123",
          // An unchecked checkbox is really a boolean at runtime, even though the
          // schema's inferred type narrows acceptTerms to the literal `true`.
          acceptTerms: false,
        } as unknown as RegisterValues,
        undefined,
        resolverOptions,
      );

      expect(result.errors.acceptTerms).toBeDefined();
      expect(result.errors.confirmPassword?.message).toBe(
        "Passwords don't match.",
      );
    },
  );

  it("does not duplicate the message if the schema already flags confirmPassword", async () => {
    // confirmPassword is a plain z.string() with no independent constraint today,
    // but this guards against a future schema change adding one without this
    // resolver clobbering its message.
    const result = await resolver(
      {
        fullName: "Ama Boateng",
        email: "ama@example.com",
        password: "Password123",
        confirmPassword: "Password123",
        acceptTerms: true,
      },
      undefined,
      resolverOptions,
    );

    expect(result.errors.confirmPassword).toBeUndefined();
  });
});
