import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";

import type { ListingFormValues } from "@/lib/validation/listing";
import { uploadService } from "@/services";

import { MediaUploader } from "./MediaUploader";

vi.mock("@/services", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services")>();
  return {
    ...actual,
    uploadService: { uploadFile: vi.fn(), deleteUpload: vi.fn() },
  };
});

const uploadFile = vi.mocked(uploadService.uploadFile);
const deleteUpload = vi.mocked(uploadService.deleteUpload);

function makeFile(name = "photo.jpg", type = "image/jpeg", size = 1024) {
  const file = new File(["x".repeat(size)], name, { type });
  return file;
}

function Harness({ media = [] }: { media?: ListingFormValues["media"] }) {
  const form = useForm<ListingFormValues>({
    defaultValues: {
      title: "",
      description: "",
      amenities: [],
      media,
    } as ListingFormValues,
  });
  return (
    <FormProvider {...form}>
      <MediaUploader />
    </FormProvider>
  );
}

describe("MediaUploader", () => {
  beforeEach(() => {
    uploadFile.mockReset();
    deleteUpload.mockReset();
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  });

  it("shows an 'Add photos' control when under the limit", () => {
    render(<Harness />);
    expect(screen.getByLabelText("Add photos")).toBeInTheDocument();
  });

  it("uploads a selected file and adds it to the grid once done", async () => {
    const user = userEvent.setup();
    uploadFile.mockResolvedValue({
      url: "https://res.cloudinary.com/demo/a.jpg",
      publicId: "a",
    });
    render(<Harness />);

    await user.upload(screen.getByLabelText("Add photos"), makeFile());

    await waitFor(() => expect(screen.getByText("Cover")).toBeInTheDocument());
    expect(uploadFile).toHaveBeenCalledTimes(1);
  });

  it("rejects an unsupported file type", () => {
    // fireEvent bypasses user-event's accept-attribute filtering (which mimics
    // a real browser's file picker) — this exercises the code path's own
    // defense-in-depth check, reachable via any input not limited to `accept`.
    const errorSpy = vi.spyOn(toast, "error");
    render(<Harness />);

    fireEvent.change(screen.getByLabelText("Add photos"), {
      target: { files: [makeFile("doc.pdf", "application/pdf")] },
    });

    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("supported image format"),
    );
    expect(uploadFile).not.toHaveBeenCalled();
  });

  it("rejects a file over the size limit", async () => {
    const user = userEvent.setup();
    const errorSpy = vi.spyOn(toast, "error");
    render(<Harness />);

    const oversized = makeFile("big.jpg", "image/jpeg", 1);
    Object.defineProperty(oversized, "size", { value: 11 * 1024 * 1024 });

    await user.upload(screen.getByLabelText("Add photos"), oversized);

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("10 MB"));
    expect(uploadFile).not.toHaveBeenCalled();
  });

  it("removing an already-uploaded photo calls deleteUpload", async () => {
    const user = userEvent.setup();
    deleteUpload.mockResolvedValue(undefined);
    render(
      <Harness
        media={[
          { url: "https://example.com/a.jpg", publicId: "pub-a", order: 0 },
        ]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Remove photo" }));

    expect(deleteUpload).toHaveBeenCalledWith("pub-a");
    expect(screen.queryByText("Cover")).not.toBeInTheDocument();
  });

  it("moving a photo later hands the Cover badge to the next one", async () => {
    const user = userEvent.setup();
    render(
      <Harness
        media={[
          { url: "https://example.com/a.jpg", publicId: "a", order: 0 },
          { url: "https://example.com/b.jpg", publicId: "b", order: 1 },
        ]}
      />,
    );

    const moveLaterButtons = screen.getAllByRole("button", {
      name: "Move later",
    });
    await user.click(moveLaterButtons[0]);

    // The second image (order 1, formerly not-cover) is now first/cover.
    const images = screen.getAllByRole("img");
    expect(images[0]).toHaveAttribute("src", "https://example.com/b.jpg");
  });

  it("hides the add-photos control once at the 10-image limit", () => {
    const media = Array.from({ length: 10 }, (_, index) => ({
      url: `https://example.com/${index}.jpg`,
      publicId: `p${index}`,
      order: index,
    }));
    render(<Harness media={media} />);

    expect(screen.queryByLabelText("Add photos")).not.toBeInTheDocument();
  });
});
