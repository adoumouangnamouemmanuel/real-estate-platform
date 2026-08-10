import { describe, expect, it } from "vitest";

import { getProductRoleLabel } from "./roles";

describe("getProductRoleLabel", () => {
  it("maps USER to the product-facing Client label", () => {
    expect(getProductRoleLabel("USER")).toBe("Client");
  });

  it("keeps DEVELOPER as Developer", () => {
    expect(getProductRoleLabel("DEVELOPER")).toBe("Developer");
  });

  it("maps ADMIN to the product-facing Super Admin label", () => {
    expect(getProductRoleLabel("ADMIN")).toBe("Super Admin");
  });
});
