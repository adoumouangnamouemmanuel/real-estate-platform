import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { ReactNode } from "react";
import { api } from "@/lib/api";
import i18n, { setStoredLanguage } from "@/lib/i18n";
import { useProperties } from "@/hooks/useProperties";
import { propertyService } from "@/services/property.service";
import { mapSession } from "@/lib/authSession";
import { formatPrice } from "@/lib/formatters";

describe("bilingual API contract", () => {
  const originalAdapter = api.defaults.adapter;
  beforeEach(() => {
    setStoredLanguage("fr");
    void i18n.changeLanguage("fr");
  });
  afterEach(() => {
    api.defaults.adapter = originalAdapter;
    document.cookie = "lumavok-language=; Max-Age=0; Path=/";
    localStorage.clear();
  });
  it("uses distinct cache entries and explicit requests when the language changes", async () => {
    const languages: string[] = [];
    api.defaults.adapter = async (config) => {
      languages.push(config.params.lang);
      return {
        data: {
          success: true,
          data: {
            items: [
              {
                id: "same",
                title: config.params.lang === "en" ? "House" : "Maison",
              },
            ],
            total: 1,
            page: 1,
            pageSize: 12,
            totalPages: 1,
          },
        },
        status: 200,
        statusText: "OK",
        headers: {},
        config,
      };
    };
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result, unmount } = renderHook(() => useProperties(), { wrapper });
    await waitFor(() =>
      expect(result.current.data?.items[0].title).toBe("Maison"),
    );
    await act(async () => {
      setStoredLanguage("en");
      await i18n.changeLanguage("en");
    });
    await waitFor(() =>
      expect(result.current.data?.items[0].title).toBe("House"),
    );
    expect(languages).toEqual(["fr", "en"]);
    expect(
      client
        .getQueryCache()
        .getAll()
        .filter((q) => q.queryKey[0] === "properties"),
    ).toHaveLength(2);
    unmount();
    client.clear();
  });
  it("loads saved CUIDs through the ID endpoint", async () => {
    let path = "";
    api.defaults.adapter = async (config) => {
      path = config.url ?? "";
      return {
        data: { success: true, data: { id: "existing-cuid" } },
        status: 200,
        statusText: "OK",
        headers: {},
        config,
      };
    };
    expect(
      await propertyService.getPropertiesByIds(["existing-cuid"]),
    ).toHaveLength(1);
    expect(path).toBe("/properties/by-id/existing-cuid");
  });
  it("uses the same role mapping for login and silent refresh", () => {
    expect(
      mapSession({
        user: {
          id: "id",
          fullName: "Seller",
          email: "seller@example.test",
          role: "PROPERTY_DEVELOPER" as never,
        },
        accessToken: "test",
      }).user.role,
    ).toBe("DEVELOPER");
  });
  it("formats XOF in French and leaves unconfirmed currency unlabelled", () => {
    expect(formatPrice(150000, "XOF")).toContain("150");
    expect(formatPrice(150000, "XOF")).not.toContain("GH");
    expect(formatPrice(150000, null)).toContain("devise à confirmer");
  });
});
