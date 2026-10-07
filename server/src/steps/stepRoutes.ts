import { Hono } from "hono";
import { deleteImageFiles } from "../images/imageStorage";
import { projectExists } from "../projects/projectStore";
import { isObject, isUuid } from "../validation";
import { createStep, deleteStep, getStep, listSteps, updateStep } from "./stepStore";
import { validateNewStep } from "./validateNewStep";

/** Routes for the steps of a project, mounted under /api. Image routes live in images/imageRoutes.ts. */
export const stepRoutes = new Hono();

const projectNotFound = { error: "Projektet finns inte" };
const stepNotFound = { error: "Steget finns inte" };

// Checking the format first avoids a database error for ids like "abc"
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

stepRoutes.patch("/steps/:stepId", async (c) => {
  const stepId = c.req.param("stepId");
  const existing = isUuid(stepId) ? await getStep(stepId) : undefined;
  if (!existing) return c.json(stepNotFound, 404);

  const body: unknown = await c.req.json().catch(() => undefined);
  if (!isObject(body)) return c.json({ error: "Body måste vara ett JSON-objekt" }, 400);

  // Fields left out keep their current value, then everything is checked like a new step
  const { name, description, status, priority, date } = existing;
  const result = validateNewStep({ name, description, status, priority, date, ...body });
  if (!result.ok) return c.json({ error: result.error }, 400);

  const step = await updateStep(stepId, result.value);
  if (!step) return c.json(stepNotFound, 404);

  return c.json(step);
});

stepRoutes.delete("/steps/:stepId", async (c) => {
  const stepId = c.req.param("stepId");
  const imageFiles = isUuid(stepId) ? await deleteStep(stepId) : undefined;
  if (!imageFiles) return c.json(stepNotFound, 404);

  await deleteImageFiles(imageFiles);
  return c.body(null, 204);
});
