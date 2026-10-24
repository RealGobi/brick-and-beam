import { Hono } from "hono";
import { addStepImages, deleteStepImage, stepExists } from "../steps/stepStore";
import { isUuid } from "../validation";
import { imageUploadLimit, uploadImages } from "./imageUpload";
import { deleteImageFiles } from "./imageStorage";

/** Routes for uploading and deleting step images, mounted under /api. */
export const imageRoutes = new Hono();

imageRoutes.post("/steps/:stepId/images", imageUploadLimit, async (c) => {
  const stepId = c.req.param("stepId");
  if (!isUuid(stepId) || !(await stepExists(stepId))) return c.json({ error: "Steget finns inte" }, 404);

  return uploadImages(c, (savedFiles) => addStepImages(stepId, savedFiles));
});

imageRoutes.delete("/images/:imageId", async (c) => {
  const imageId = c.req.param("imageId");
  const fileName = isUuid(imageId) ? await deleteStepImage(imageId) : undefined;
  if (!fileName) return c.json({ error: "Bilden finns inte" }, 404);

  await deleteImageFiles([fileName]);
  return c.body(null, 204);
});
