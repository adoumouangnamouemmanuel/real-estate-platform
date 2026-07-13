import { describe, expect, it } from "vitest";

import { getPostLoginDestination, getSafeRedirectPath } from "./authRedirect";
import type { User } from "@/types";

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: "u1",
    fullName: "Test User",
    email: "test@example.com",
    role: "USER",
    ...overrides,
  };
}

describe("getPostLoginDestination", () => {
  it("sends DEVELOPER and ADMIN roles to the dashboard", () => {
    expect(getPostLoginDestination(makeUser({ role: "DEVELOPER" }))).toBe(
      "/dashboard",
    );
    expect(getPostLoginDestination(makeUser({ role: "ADMIN" }))).toBe(
      "/dashboard",
    );
  });

  it("sends USER role home", () => {
    expect(getPostLoginDestination(makeUser({ role: "USER" }))).toBe("/");
  });
});

describe("getSafeRedirectPath (open-redirect protection)", () => {
  it("accepts a same-origin relative path", () => {
    expect(getSafeRedirectPath("/dashboard")).toBe("/dashboard");
    expect(getSafeRedirectPath("/properties/some-slug")).toBe(
      "/properties/some-slug",
    );
  });

  it("rejects protocol-relative URLs (//evil.example)", () => {
    expect(getSafeRedirectPath("//evil.example")).toBeUndefined();
  });

  it("rejects backslash-leading paths (some browsers normalize \\ to / and treat it as protocol-relative)", () => {
    expect(getSafeRedirectPath("/\\evil.example")).toBeUndefined();
  });

  it("rejects absolute external URLs", () => {
    expect(getSafeRedirectPath("https://evil.example")).toBeUndefined();
    expect(getSafeRedirectPath("http://evil.example/phish")).toBeUndefined();
  });

  it("rejects non-path values that don't start with a slash", () => {
    expect(getSafeRedirectPath("javascript:alert(1)")).toBeUndefined();
    expect(getSafeRedirectPath("evil.example")).toBeUndefined();
  });

  it("returns undefined for empty/missing input", () => {
    expect(getSafeRedirectPath(undefined)).toBeUndefined();
    expect(getSafeRedirectPath(null)).toBeUndefined();
    expect(getSafeRedirectPath("")).toBeUndefined();
  });
});
