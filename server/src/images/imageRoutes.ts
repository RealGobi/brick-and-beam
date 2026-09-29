import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { addStepImages, deleteStepImage, stepExists } from "../steps/stepStore";
import { isUuid } from "../validation";
import { deleteImageFiles, saveImageFile } from "./imageStorage";
import { MAX_IMAGE_BYTES, MAX_IMAGES_PER_UPLOAD, validateImages } from "./validateImages";

/** Routes for uploading and deleting step images, mounted under /api. */
export const imageRoutes = new Hono();

// Room for the maximum number of full-size images plus the multipart overhead
const MAX_UPLOAD_REQUEST_BYTES = MAX_IMAGES_PER_UPLOAD * MAX_IMAGE_BYTES + 1024 * 1024;

imageRoutes.post(
  "/steps/:stepId/images",
  bodyLimit({
    maxSize: MAX_UPLOAD_REQUEST_BYTES,
    onError: (c) => c.json({ error: "Uppladdningen är för stor" }, 413),
  }),
  async (c) => {
    const stepId = c.req.param("stepId");
    if (!isUuid(stepId) || !(await stepExists(stepId))) return c.json({ error: "Steget finns inte" }, 404);

    const body = await c.req.parseBody({ all: true }).catch(() => ({}));
    const field = "images" in body ? body.images : [];
    const result = validateImages(Array.isArray(field) ? field : [field]);
    if (!result.ok) return c.json({ error: result.error }, 400);

    const savedFiles = await Promise.all(result.value.map((file) => saveImageFile(file)));
    try {
      return c.json(await addStepImages(stepId, savedFiles), 201);
    } catch (error) {
      // Don't leave files on disk that no step points to
      await deleteImageFiles(savedFiles.map((file) => file.fileName));
      throw error;
    }
  },
);

imageRoutes.delete("/images/:imageId", async (c) => {
  const imageId = c.req.param("imageId");
  const fileName = isUuid(imageId) ? await deleteStepImage(imageId) : undefined;
  if (!fileName) return c.json({ error: "Bilden finns inte" }, 404);

  await deleteImageFiles([fileName]);
  return c.body(null, 204);
});
