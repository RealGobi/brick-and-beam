import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { deleteImageFiles, saveImageFile } from "../images/imageStorage";
import { MAX_IMAGE_BYTES, MAX_IMAGES_PER_UPLOAD, validateImages } from "../images/validateImages";
import { projectExists } from "../projects/projectStore";
import { isUuid } from "../validation";
import { addStepImages, createStep, listSteps, stepExists } from "./stepStore";
import { validateNewStep } from "./validateNewStep";

/** Routes for steps and their images, mounted under /api. */
export const stepRoutes = new Hono();

// Room for the maximum number of full-size images plus the multipart overhead
const MAX_UPLOAD_REQUEST_BYTES = MAX_IMAGES_PER_UPLOAD * MAX_IMAGE_BYTES + 1024 * 1024;

const projectNotFound = { error: "Projektet finns inte" };
const stepNotFound = { error: "Steget finns inte" };

async function isExistingProject(projectId: string): Promise<boolean> {
  return isUuid(projectId) && (await projectExists(projectId));
}

stepRoutes.get("/projects/:projectId/steps", async (c) => {
  const projectId = c.req.param("projectId");
  if (!(await isExistingProject(projectId))) return c.json(projectNotFound, 404);

  return c.json(await listSteps(projectId));
});

stepRoutes.post("/projects/:projectId/steps", async (c) => {
  const projectId = c.req.param("projectId");
  if (!(await isExistingProject(projectId))) return c.json(projectNotFound, 404);

  // c.req.json() throws on malformed JSON, which is the client's fault, not a server error
  const body: unknown = await c.req.json().catch(() => undefined);
  const result = validateNewStep(body);
  if (!result.ok) return c.json({ error: result.error }, 400);

  return c.json(await createStep(projectId, result.value), 201);
});

stepRoutes.post(
  "/steps/:stepId/images",
  bodyLimit({
    maxSize: MAX_UPLOAD_REQUEST_BYTES,
    onError: (c) => c.json({ error: "Uppladdningen är för stor" }, 413),
  }),
  async (c) => {
    const stepId = c.req.param("stepId");
    if (!isUuid(stepId) || !(await stepExists(stepId))) return c.json(stepNotFound, 404);

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
