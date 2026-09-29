import { Hono } from "hono";
import { deleteImageFiles } from "../images/imageStorage";
import { isObject, isUuid } from "../validation";
import {
  createProject,
  deleteProject,
  getProject,
  listProjects,
  updateProject,
  type NewProject,
  type Project,
} from "./projectStore";
import { validateNewProject } from "./validateNewProject";

/** Routes for /api/projects. */
export const projectRoutes = new Hono();

const projectNotFound = { error: "Projektet finns inte" };

// Checking the format first avoids a database error for ids like "abc"
async function findProject(projectId: string): Promise<Project | undefined> {
  return isUuid(projectId) ? getProject(projectId) : undefined;
}

function editableFields({ name, description, status, startDate, endDate, budget }: Project): NewProject {
  return { name, description, status, startDate, endDate, budget };
}

projectRoutes.get("/", async (c) => {
  const projects = await listProjects();
  return c.json(projects);
});

projectRoutes.get("/:projectId", async (c) => {
  const project = await findProject(c.req.param("projectId"));
  if (!project) return c.json(projectNotFound, 404);

  return c.json(project);
});

projectRoutes.post("/", async (c) => {
  // c.req.json() throws on malformed JSON, which is the client's fault, not a server error
  const body: unknown = await c.req.json().catch(() => undefined);

  const result = validateNewProject(body);
  if (!result.ok) {
    return c.json({ error: result.error }, 400);
  }

  const project = await createProject(result.value);
  return c.json(project, 201);
});

projectRoutes.patch("/:projectId", async (c) => {
  const existing = await findProject(c.req.param("projectId"));
  if (!existing) return c.json(projectNotFound, 404);

  const body: unknown = await c.req.json().catch(() => undefined);
  if (!isObject(body)) return c.json({ error: "Body måste vara ett JSON-objekt" }, 400);

  // Fields left out keep their current value, then everything is checked like a new project.
  // That also catches an end date that ends up before the start date.
  const result = validateNewProject({ ...editableFields(existing), ...body });
  if (!result.ok) return c.json({ error: result.error }, 400);

  const project = await updateProject(existing.id, result.value);
  if (!project) return c.json(projectNotFound, 404);

  return c.json(project);
});

projectRoutes.delete("/:projectId", async (c) => {
  const projectId = c.req.param("projectId");
  const imageFiles = isUuid(projectId) ? await deleteProject(projectId) : undefined;
  if (!imageFiles) return c.json(projectNotFound, 404);

  await deleteImageFiles(imageFiles);
  return c.body(null, 204);
});
