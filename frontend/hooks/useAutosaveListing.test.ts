import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useForm } from "react-hook-form";

import type { ListingFormValues } from "@/lib/validation/listing";

import { pickDirtyValues, useAutosaveListing } from "./useAutosaveListing";

describe("pickDirtyValues", () => {
  it("returns only the fields marked dirty", () => {
    const values = { a: 1, b: 2, c: 3 };
    const dirtyFields = { a: true, c: true };
    expect(pickDirtyValues(values, dirtyFields)).toEqual({ a: 1, c: 3 });
  });

  it("returns an empty object when nothing is dirty", () => {
    expect(pickDirtyValues({ a: 1 }, {})).toEqual({});
  });
});

function useHarness(
  onSave: (patch: Partial<ListingFormValues>) => Promise<unknown>,
  enabled = true,
) {
  const form = useForm<ListingFormValues>({
    defaultValues: {
      title: "",
      description: "",
      amenities: [],
      media: [],
    } as ListingFormValues,
  });
  const autosave = useAutosaveListing({
    form,
    enabled,
    onSave,
    debounceMs: 500,
  });
  return { form, ...autosave };
}

describe("useAutosaveListing", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("does not save before the debounce elapses", () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useHarness(onSave));

    act(() => {
      result.current.form.setValue("title", "New Title", {
        shouldDirty: true,
      });
    });

    expect(onSave).not.toHaveBeenCalled();
  });

  it("saves only the dirty fields once the debounce elapses", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useHarness(onSave));

    act(() => {
      result.current.form.setValue("title", "New Title", {
        shouldDirty: true,
      });
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(onSave).toHaveBeenCalledWith({ title: "New Title" });
    expect(result.current.status).toBe("saved");
  });

  it("never autosaves when disabled (published listings use explicit save instead)", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useHarness(onSave, false));

    act(() => {
      result.current.form.setValue("title", "New Title", {
        shouldDirty: true,
      });
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    expect(onSave).not.toHaveBeenCalled();
  });

  it("stops silent retries after 3 consecutive failures, but saveNow always tries again", async () => {
    const onSave = vi.fn().mockRejectedValue(new Error("network down"));
    const { result } = renderHook(() => useHarness(onSave));

    for (let attempt = 0; attempt < 3; attempt += 1) {
      act(() => {
        result.current.form.setValue("title", `Attempt ${attempt}`, {
          shouldDirty: true,
        });
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(500);
      });
    }

    expect(onSave).toHaveBeenCalledTimes(3);
    expect(result.current.status).toBe("error");

    // A 4th edit shouldn't trigger a 4th silent attempt.
    act(() => {
      result.current.form.setValue("title", "Attempt 4", { shouldDirty: true });
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(onSave).toHaveBeenCalledTimes(3);

    // Manual retry always resets the failure count and tries immediately.
    onSave.mockResolvedValueOnce(undefined);
    await act(async () => {
      await result.current.saveNow();
    });
    expect(onSave).toHaveBeenCalledTimes(4);
    expect(result.current.status).toBe("saved");
  });
});
