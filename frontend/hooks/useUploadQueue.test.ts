import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { uploadService } from "@/services";

import { useUploadQueue } from "./useUploadQueue";

vi.mock("@/services", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services")>();
  return { ...actual, uploadService: { uploadFile: vi.fn() } };
});

const uploadFile = vi.mocked(uploadService.uploadFile);

function makeFile(name = "photo.jpg") {
  return new File(["data"], name, { type: "image/jpeg" });
}

describe("useUploadQueue", () => {
  beforeEach(() => {
    uploadFile.mockReset();
    // jsdom has no real object-URL store; a stable stub is enough to assert against.
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock-url");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  });

  it("moves a file through QUEUED → UPLOADING → UPLOADED", async () => {
    uploadFile.mockResolvedValue({
      url: "https://example.com/a.jpg",
      publicId: "a",
    });
    const { result } = renderHook(() => useUploadQueue());

    act(() => {
      result.current.enqueue([makeFile()]);
    });

    expect(result.current.items[0].status).toBe("UPLOADING");

    await waitFor(() =>
      expect(result.current.items[0].status).toBe("UPLOADED"),
    );
    expect(result.current.items[0].result).toEqual({
      url: "https://example.com/a.jpg",
      publicId: "a",
    });
  });

  it("moves a file to FAILED when the upload rejects, and retry re-enters UPLOADING", async () => {
    uploadFile.mockRejectedValueOnce(new Error("network down"));
    const { result } = renderHook(() => useUploadQueue());

    act(() => {
      result.current.enqueue([makeFile()]);
    });

    await waitFor(() => expect(result.current.items[0].status).toBe("FAILED"));
    expect(result.current.items[0].error).toBe("network down");

    uploadFile.mockResolvedValue({
      url: "https://example.com/b.jpg",
      publicId: "b",
    });
    act(() => {
      result.current.retry(result.current.items[0].id);
    });

    expect(result.current.items[0].status).toBe("UPLOADING");
    await waitFor(() =>
      expect(result.current.items[0].status).toBe("UPLOADED"),
    );
  });

  it("remove drops the item from the queue", async () => {
    uploadFile.mockResolvedValue({
      url: "https://example.com/a.jpg",
      publicId: "a",
    });
    const { result } = renderHook(() => useUploadQueue());

    act(() => {
      result.current.enqueue([makeFile()]);
    });
    const id = result.current.items[0].id;

    act(() => {
      result.current.remove(id);
    });

    expect(result.current.items).toHaveLength(0);
  });

  it("enqueues multiple files independently", async () => {
    uploadFile.mockResolvedValue({
      url: "https://example.com/a.jpg",
      publicId: "a",
    });
    const { result } = renderHook(() => useUploadQueue());

    act(() => {
      result.current.enqueue([makeFile("one.jpg"), makeFile("two.jpg")]);
    });

    expect(result.current.items).toHaveLength(2);
    await waitFor(() =>
      expect(
        result.current.items.every((item) => item.status === "UPLOADED"),
      ).toBe(true),
    );
  });
});
