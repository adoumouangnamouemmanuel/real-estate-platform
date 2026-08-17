import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * Both flag states, because the bug this guards against was a *mismatch*: the
 * homepage advertised WhatsApp messaging as a live capability while
 * `FEATURES.WHATSAPP_CONTACT` was false and every CTA on the site rendered a
 * disabled "(coming soon)" button.
 *
 * There was no feature-flag testing pattern in this codebase before Stage 6;
 * mocking `@/constants/features` and re-importing is the established Vitest way
 * to exercise a module whose behaviour is decided by another module's constant.
 */
async function loadWithWhatsApp(enabled: boolean) {
  vi.resetModules();
  vi.doMock("@/constants/features", () => ({
    FEATURES: { WHATSAPP_CONTACT: enabled },
    isFeatureEnabled: (flag: string) =>
      flag === "WHATSAPP_CONTACT" ? enabled : false,
  }));
  return (await import("./contactTrustPoint")).getContactTrustPoint();
}

afterEach(() => {
  vi.doUnmock("@/constants/features");
  vi.resetModules();
});

describe("getContactTrustPoint", () => {
  it("claims WhatsApp messaging only when the flag that powers the real CTA is on", async () => {
    const trustPoint = await loadWithWhatsApp(true);

    expect(trustPoint.title).toBe("Direct WhatsApp contact");
    expect(trustPoint.description).toMatch(/message developers directly/i);
  });

  it("makes no WhatsApp or messaging claim while the flag is off", async () => {
    const trustPoint = await loadWithWhatsApp(false);

    expect(trustPoint.title).not.toMatch(/whatsapp/i);
    expect(trustPoint.description).not.toMatch(/whatsapp/i);
    expect(trustPoint.description).not.toMatch(/message/i);
  });

  it("still says something true when the flag is off, rather than going blank", async () => {
    const trustPoint = await loadWithWhatsApp(false);

    // Developer emails really are published on their profiles today, and
    // property pages link straight to them — see DeveloperProfileView.
    expect(trustPoint.title).toBe("Direct developer contact");
    expect(trustPoint.description).toMatch(/profile/i);
  });
});
