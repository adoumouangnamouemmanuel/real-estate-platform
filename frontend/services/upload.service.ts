const MOCK_LATENCY_MS = 900;

let uploadCounter = 0;

export interface UploadedFile {
  url: string;
  publicId: string;
}

function delay<T>(value: T, ms = MOCK_LATENCY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

/**
 * Stands in for the two-step flow docs/ARCHITECTURE.md §7 specifies for the real
 * integration: the frontend requests a signed upload from
 * `POST /api/v1/uploads/signature`, then uploads directly to Cloudinary from the
 * browser. There's no real Cloudinary account behind this mock, so both steps are
 * collapsed into one method that simulates the round-trip latency and returns a
 * Cloudinary-shaped result; the `url` doesn't resolve to a real image, which is
 * why `MediaUploader` renders the browser's local object-URL preview rather than
 * this returned `url` for images uploaded in the current session.
 * TODO(backend): split into `getUploadSignature()` + a direct Cloudinary POST once
 * the signing endpoint exists.
 */
export const uploadService = {
  uploadFile: (file: File): Promise<UploadedFile> => {
    uploadCounter += 1;
    const publicId = `byte/listings/mock-${uploadCounter}-${file.name.replace(/\W+/g, "-")}`;
    return delay({
      url: `https://res.cloudinary.com/byte-demo/image/upload/${publicId}`,
      publicId,
    });
  },

  // TODO(backend): DELETE /api/v1/uploads/:publicId — the real endpoint calls
  // Cloudinary's authenticated destroy API server-side. Kept as a no-op parameter
  // here for interface-shape parity with that future signature.
  deleteUpload: (publicId: string): Promise<void> => {
    void publicId;
    return delay(undefined, 300);
  },
};
