import crypto from "node:crypto";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";
import { getEnv } from "../../config/env.js";
import { prisma } from "../../config/prisma.js";
import { requireDeveloperId } from "../../middleware/auth.js";
import { BadRequestError, ConflictError } from "../../utils/errors.js";
const BUCKET = "property-media",
  TTL = 120;
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function storage() {
  const env = getEnv();
  if (!env.SUPABASE_STORAGE_KEY)
    throw new BadRequestError(
      "Media storage is not configured",
      "STORAGE_UNAVAILABLE",
    );
  return createClient(env.SUPABASE_URL, env.SUPABASE_STORAGE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  }).storage.from(BUCKET);
}
function keyFor(developerId: string, id: string) {
  requireDeveloperId(developerId);
  if (!UUID.test(id)) throw new BadRequestError("Invalid upload ID");
  return developerId + "/" + id + ".webp";
}
export async function encodeImage(bytes: Buffer): Promise<Buffer> {
  if (!bytes.length || bytes.length > 10 * 1024 * 1024)
    throw new BadRequestError("Image exceeds size limit");
  try {
    const image = sharp(bytes, {
        limitInputPixels: 40_000_000,
        animated: false,
      }),
      meta = await image.metadata();
    if (
      !["jpeg", "png", "webp"].includes(meta.format ?? "") ||
      !meta.width ||
      !meta.height ||
      (meta.pages ?? 1) > 1
    )
      throw new Error("Unsupported image");
    return await image
      .rotate()
      .resize({
        width: 2400,
        height: 2400,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 85 })
      .toBuffer();
  } catch {
    throw new BadRequestError(
      "Upload a valid JPEG, PNG or WebP image",
      "INVALID_IMAGE",
    );
  }
}
export async function saveFile(developerId: string, bytes: Buffer) {
  requireDeveloperId(developerId);
  const encoded = await encodeImage(bytes),
    id = crypto.randomUUID(),
    key = keyFor(developerId, id);
  const { error } = await storage().upload(key, encoded, {
    contentType: "image/webp",
    upsert: false,
    cacheControl: "60",
  });
  if (error) throw new BadRequestError("Upload failed", "UPLOAD_FAILED");
  const { data, error: signedError } = await storage().createSignedUrl(
    key,
    TTL,
  );
  if (signedError)
    throw new BadRequestError(
      "Upload preview unavailable",
      "UPLOAD_PREVIEW_FAILED",
    );
  return { publicId: id, url: data.signedUrl };
}
export async function mediaForRead(m: any) {
  if (m.storageProvider !== "supabase")
    return { url: m.url, publicId: m.publicId, order: m.order };
  // Callers have already loaded this child through the scoped parent RLS policy.
  const { data, error } = await storage().createSignedUrl(m.storageKey, TTL);
  if (error)
    throw new BadRequestError(
      "Media is temporarily unavailable",
      "MEDIA_UNAVAILABLE",
    );
  return { url: data.signedUrl, publicId: m.publicId, order: m.order };
}
export async function validateMediaReferences(
  developerId: string,
  items: any[],
  existing: any[],
) {
  requireDeveloperId(developerId);
  if (new Set(items.map((m) => m.publicId)).size !== items.length)
    throw new BadRequestError("Duplicate media");
  if (new Set(items.map((m) => m.order)).size !== items.length)
    throw new BadRequestError("Duplicate media order");
  items = [...items].sort((a, b) => a.order - b.order);
  const output: any[] = [];
  for (let index = 0; index < items.length; index++) {
    const item = items[index],
      old = existing.find((m) => m.publicId === item.publicId);
    if (old) {
      output.push({
        id: old.id,
        createdAt: old.createdAt,
        mediaType: old.mediaType,
        altText: old.altText,
        url: old.url,
        publicId: old.publicId,
        storageProvider: old.storageProvider,
        storageKey: old.storageKey,
        order: index,
        isPrimary: index === 0,
      });
      continue;
    }
    const key = keyFor(developerId, item.publicId),
      name = item.publicId + ".webp";
    const { data, error } = await storage().list(developerId, {
      search: name,
      limit: 2,
    });
    if (error || !data?.some((o) => o.name === name))
      throw new BadRequestError(
        "Upload is missing or belongs to another seller",
        "INVALID_MEDIA_OWNER",
      );
    output.push({
      url: "storage://" + BUCKET + "/" + key,
      publicId: item.publicId,
      storageProvider: "supabase",
      storageKey: key,
      order: index,
      isPrimary: index === 0,
    });
  }
  return output;
}
export async function deleteUpload(developerId: string, publicId: string) {
  requireDeveloperId(developerId);
  const key = keyFor(developerId, publicId);
  // Attached files must first be removed from the listing. Never unlink live media
  // and delete the object as two independently committed operations.
  if (
    await prisma.propertyMedia.findFirst({
      where: { publicId, property: { propertyDeveloperId: developerId } },
    })
  )
    throw new ConflictError(
      "Remove this image from the listing before deleting the file",
    );
  const { error } = await storage().remove([key]);
  if (error) throw new BadRequestError("Delete failed", "DELETE_FAILED");
}
