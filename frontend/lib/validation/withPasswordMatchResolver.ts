import { zodResolver } from "@hookform/resolvers/zod";
import type { FieldValues, Resolver } from "react-hook-form";
import type { ZodType } from "zod";

/**
 * Wraps zodResolver so a password/confirmPassword mismatch always surfaces on
 * confirmPassword, even when another field (e.g. an unchecked terms checkbox) also
 * fails. Zod's own .refine()/.check() on an object schema only runs after every
 * other field has already validated successfully — so chaining the match check onto
 * the schema directly would hide it behind whichever other error happened first,
 * requiring a second submit to discover it. Checking the match here, independently
 * of the rest of the schema, means every submission reports every problem at once.
 */
export function withPasswordMatchResolver<
  T extends FieldValues & { password: string; confirmPassword: string },
>(schema: ZodType<T>): Resolver<T> {
  // zodResolver's generic overloads want a concrete FieldValues-shaped input type,
  // which a bare type-parameter T can't satisfy structurally even under the
  // `T extends FieldValues` constraint above — the runtime behavior is unaffected.
  const baseResolver = zodResolver(
    schema as ZodType<T, T>,
  ) as unknown as Resolver<T>;

  return (async (
    values: T,
    context: unknown,
    options: Parameters<Resolver<T>>[2],
  ) => {
    const result = await baseResolver(values, context, options);

    if (
      values.password === values.confirmPassword ||
      result.errors.confirmPassword
    ) {
      return result;
    }

    return {
      values: {},
      errors: {
        ...result.errors,
        confirmPassword: {
          type: "custom",
          message: "Passwords don't match.",
        },
      },
    };
  }) as Resolver<T>;
}
