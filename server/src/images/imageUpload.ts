import type { Context } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { NewStepImage } from "../steps/stepStore";
import { deleteImageFiles, saveImageFile } from "./imageStorage";
import { MAX_IMAGE_BYTES, MAX_IMAGES_PER_UPLOAD, validateImages } from "./validateImages";

// Room for the maximum number of full-size images plus the multipart overhead
const MAX_UPLOAD_REQUEST_BYTES = MAX_IMAGES_PER_UPLOAD * MAX_IMAGE_BYTES + 1024 * 1024;

/** Middleware that stops uploads that are too large before they are read. */
export const imageUploadLimit = bodyLimit({
  maxSize: MAX_UPLOAD_REQUEST_BYTES,
  onError: (c) => c.json({ error: "Uppladdningen är för stor" }, 413),
});

/**
 * Handles a multipart upload with files in the "images" field: checks them, saves them to disk
 * and lets `link` store them in the database. Answers 201 with what `link` returns,
 * or 400 when the files are not valid images.
 */
export async function uploadImages<T>(c: Context, link: (savedFiles: NewStepImage[]) => Promise<T>) {
  const body = await c.req.parseBody({ all: true }).catch(() => ({}));
  const field = "images" in body ? body.images : [];
  const result = validateImages(Array.isArray(field) ? field : [field]);
  if (!result.ok) return c.json({ error: result.error }, 400);

  const savedFiles = await Promise.all(result.value.map((file) => saveImageFile(file)));
  try {
    return c.json(await link(savedFiles), 201);
  } catch (error) {
    // Don't leave files on disk that nothing points to
    await deleteImageFiles(savedFiles.map((file) => file.fileName));
    throw error;
  }
}
