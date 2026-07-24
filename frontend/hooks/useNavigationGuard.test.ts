import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useNavigationGuard } from "./useNavigationGuard";

describe("useNavigationGuard", () => {
  it("runs the action immediately when nothing is blocking", () => {
    const { result } = renderHook(() =>
      useNavigationGuard({ shouldBlock: false }),
    );
    const action = vi.fn();

    act(() => result.current.guardNavigation(action));

    expect(action).toHaveBeenCalled();
    expect(result.current.isDialogOpen).toBe(false);
  });

  it("holds the action and opens the dialog when blocking", () => {
    const { result } = renderHook(() =>
      useNavigationGuard({ shouldBlock: true }),
    );
    const action = vi.fn();

    act(() => result.current.guardNavigation(action));

    expect(action).not.toHaveBeenCalled();
    expect(result.current.isDialogOpen).toBe(true);
  });

  it("confirmNavigation runs the held action and closes the dialog", () => {
    const { result } = renderHook(() =>
      useNavigationGuard({ shouldBlock: true }),
    );
    const action = vi.fn();

    act(() => result.current.guardNavigation(action));
    act(() => result.current.confirmNavigation());

    expect(action).toHaveBeenCalled();
    expect(result.current.isDialogOpen).toBe(false);
  });

  it("cancelNavigation discards the held action without running it", () => {
    const { result } = renderHook(() =>
      useNavigationGuard({ shouldBlock: true }),
    );
    const action = vi.fn();

    act(() => result.current.guardNavigation(action));
    act(() => result.current.cancelNavigation());

    expect(action).not.toHaveBeenCalled();
    expect(result.current.isDialogOpen).toBe(false);
  });

  it("uses the default message when none is given", () => {
    const { result } = renderHook(() =>
      useNavigationGuard({ shouldBlock: true }),
    );
    expect(result.current.message).toMatch(/unsaved changes/i);
  });

  it("attaches a beforeunload listener only while shouldBlock is true", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    const removeSpy = vi.spyOn(window, "removeEventListener");

    const { rerender, unmount } = renderHook(
      ({ shouldBlock }) => useNavigationGuard({ shouldBlock }),
      { initialProps: { shouldBlock: true } },
    );
    expect(addSpy).toHaveBeenCalledWith("beforeunload", expect.any(Function));

    rerender({ shouldBlock: false });
    expect(removeSpy).toHaveBeenCalledWith(
      "beforeunload",
      expect.any(Function),
    );

    unmount();
    addSpy.mockRestore();
    removeSpy.mockRestore();
  });
});
