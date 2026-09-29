import { invalid, valid, type Result } from "../validation";

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_IMAGES_PER_UPLOAD = 10;

/**
 * Allowed image types and the extension used when saving them.
 * The extension comes from this list, never from the uploaded file name.
 */
export const imageExtensions: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

/** Checks the files from a multipart upload: 1–10 images of an allowed type, each at most 10 MB. */
export function validateImages(entries: unknown[]): Result<File[]> {
  if (entries.length === 0) return invalid("Välj minst en bild");
  if (entries.length > MAX_IMAGES_PER_UPLOAD) {
    return invalid(`Högst ${MAX_IMAGES_PER_UPLOAD} bilder åt gången`);
  }

  for (const entry of entries) {
    if (!(entry instanceof File)) return invalid("images måste vara filer");
    if (!(entry.type in imageExtensions)) {
      return invalid(`${entry.name} är inte en bild som stöds (JPG, PNG, WebP eller GIF)`);
    }
    if (entry.size === 0) return invalid(`${entry.name} är tom`);
    if (entry.size > MAX_IMAGE_BYTES) return invalid(`${entry.name} är större än 10 MB`);
  }

  return valid(entries as File[]);
}
