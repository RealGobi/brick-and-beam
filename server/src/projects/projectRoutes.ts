import { Hono } from "hono";
import { isUuid } from "../validation";
import { createProject, getProject, listProjects } from "./projectStore";
import { validateNewProject } from "./validateNewProject";

/** Routes for /api/projects. */
export const projectRoutes = new Hono();

projectRoutes.get("/", async (c) => {
  const projects = await listProjects();
  return c.json(projects);
});

projectRoutes.get("/:projectId", async (c) => {
  const projectId = c.req.param("projectId");
  // Checking the format first avoids a database error for ids like "abc"
  const project = isUuid(projectId) ? await getProject(projectId) : undefined;
  if (!project) return c.json({ error: "Projektet finns inte" }, 404);

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
