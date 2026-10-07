import { Hono } from "hono";
import { projectExists } from "../projects/projectStore";
import { getStep } from "../steps/stepStore";
import { isObject, isUuid } from "../validation";
import { createExpense, deleteExpense, getExpense, listExpenses, updateExpense } from "./expenseStore";
import { validateNewExpense } from "./validateNewExpense";

/** Routes for the expenses of a project, mounted under /api. */
export const expenseRoutes = new Hono();

const projectNotFound = { error: "Projektet finns inte" };
const expenseNotFound = { error: "Kostnaden finns inte" };
const stepNotInProject = { error: "Steget hör inte till projektet" };

// Checking the format first avoids a database error for ids like "abc"
async function isExistingProject(projectId: string): Promise<boolean> {
  return isUuid(projectId) && (await projectExists(projectId));
}

/** An expense may only point to a step in its own project. No step at all is always fine. */
async function isStepAllowed(stepId: string | null, projectId: string): Promise<boolean> {
  if (stepId === null) return true;
  const step = await getStep(stepId);
  return step?.projectId === projectId;
}

expenseRoutes.get("/projects/:projectId/expenses", async (c) => {
  const projectId = c.req.param("projectId");
  if (!(await isExistingProject(projectId))) return c.json(projectNotFound, 404);

  return c.json(await listExpenses(projectId));
});

expenseRoutes.post("/projects/:projectId/expenses", async (c) => {
  const projectId = c.req.param("projectId");
  if (!(await isExistingProject(projectId))) return c.json(projectNotFound, 404);

  // c.req.json() throws on malformed JSON, which is the client's fault, not a server error
  const body: unknown = await c.req.json().catch(() => undefined);
  const result = validateNewExpense(body);
  if (!result.ok) return c.json({ error: result.error }, 400);

  if (!(await isStepAllowed(result.value.stepId, projectId))) return c.json(stepNotInProject, 400);

  return c.json(await createExpense(projectId, result.value), 201);
});

expenseRoutes.patch("/expenses/:expenseId", async (c) => {
  const expenseId = c.req.param("expenseId");
  const existing = isUuid(expenseId) ? await getExpense(expenseId) : undefined;
  if (!existing) return c.json(expenseNotFound, 404);

  const body: unknown = await c.req.json().catch(() => undefined);
  if (!isObject(body)) return c.json({ error: "Body måste vara ett JSON-objekt" }, 400);

  // Fields left out keep their current value, then everything is checked like a new expense
  const { stepId, category, supplier, description, amount, date } = existing;
  const result = validateNewExpense({ stepId, category, supplier, description, amount, date, ...body });
  if (!result.ok) return c.json({ error: result.error }, 400);
  if (!(await isStepAllowed(result.value.stepId, existing.projectId))) return c.json(stepNotInProject, 400);

  const expense = await updateExpense(expenseId, result.value);
  if (!expense) return c.json(expenseNotFound, 404);

  return c.json(expense);
});

expenseRoutes.delete("/expenses/:expenseId", async (c) => {
  const expenseId = c.req.param("expenseId");
  const deleted = isUuid(expenseId) && (await deleteExpense(expenseId));
  if (!deleted) return c.json(expenseNotFound, 404);

  return c.body(null, 204);
});
