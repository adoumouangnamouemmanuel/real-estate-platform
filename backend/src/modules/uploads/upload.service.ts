import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");

/**
 * Ensure the uploads directory exists.
 */
function ensureUploadsDir(): void {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

/**
 * Save a file buffer to the local uploads directory.
 * Returns the relative URL path and a publicId for the stored file.
 */
export function saveFile(
  originalName: string,
  buffer: Buffer,
  folder = "listings",
): { url: string; publicId: string } {
  ensureUploadsDir();

  const ext = path.extname(originalName);
  const baseName = path.basename(originalName, ext).replace(/\W+/g, "-");
  const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
  const filename = `${uniqueSuffix}-${baseName}${ext}`;

  // Create subfolder if needed
  const folderPath = path.join(UPLOADS_DIR, folder);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  const filePath = path.join(folderPath, filename);
  fs.writeFileSync(filePath, buffer);

  const publicId = `${folder}/${filename}`;
  const url = `/uploads/${publicId}`;

  return { url, publicId };
}

/**
 * Delete a file from the local uploads directory by its publicId.
 */
export async function deleteUpload(publicId: string): Promise<void> {
  const filePath = path.join(UPLOADS_DIR, publicId);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}
