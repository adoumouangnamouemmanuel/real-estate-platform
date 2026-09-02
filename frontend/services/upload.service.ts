import { api } from "@/lib/api";
import type { ApiResponse } from "@/types";

export interface UploadedFile {
  url: string;
  publicId: string;
}

/**
 * Upload a file to the backend, which saves it locally in the uploads/ folder.
 * Returns the relative URL path and a publicId for the stored file.
 */
export const uploadService = {
  uploadFile: async (file: File): Promise<UploadedFile> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "listings");

    const res = await api.post<ApiResponse<UploadedFile>>("/uploads/file", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.data;
  },

  deleteUpload: (publicId: string): Promise<void> =>
    api.delete(`/uploads/${publicId}`).then(() => undefined),
};
