import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "../app";
import { projectExists } from "../projects/projectStore";
import { getStep, type Step } from "../steps/stepStore";
import {
  createExpense,
  deleteExpense,
  getExpense,
  listExpenses,
  updateExpense,
  type Expense,
} from "./expenseStore";

// Replace the database queries so the tests never need a running database
vi.mock("./expenseStore");
vi.mock("../projects/projectStore");
vi.mock("../steps/stepStore");

const projectId = "7c3e0f5a-1b2c-4d5e-8f90-123456789abc";
const stepId = "1f2e3d4c-5b6a-4978-8695-a4b3c2d1e0f9";
const expenseId = "9a8b7c6d-5e4f-4321-8765-0fedcba98765";

const expense: Expense = {
  id: expenseId,
  projectId,
  stepId,
  category: "purchase",
  supplier: "Bauhaus",
  description: "Kakel",
  amount: 12000,
  date: "2026-10-01",
  createdAt: new Date("2026-10-01T10:00:00.000Z"),
};

const stepIn = (inProject: string): Step => ({
  id: stepId,
  projectId: inProject,
  name: "Kakel",
  description: "",
  status: "ongoing",
  priority: "normal",
  date: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  images: [],
});

function sendJson(method: string, path: string, body: unknown) {
  return app.request(path, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
}

const postExpense = (body: unknown) => sendJson("POST", `/api/projects/${projectId}/expenses`, body);

beforeEach(() => {
  vi.mocked(projectExists).mockResolvedValue(true);
});

afterEach(() => {
  vi.resetAllMocks();
});

describe("GET /api/projects/:projectId/expenses", () => {
  it("returns the expenses of the project", async () => {
    vi.mocked(listExpenses).mockResolvedValue([expense]);

    const response = await app.request(`/api/projects/${projectId}/expenses`);

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject([{ id: expenseId, amount: 12000, date: "2026-10-01" }]);
    expect(listExpenses).toHaveBeenCalledWith(projectId);
  });

  it("returns 404 when the project does not exist", async () => {
    vi.mocked(projectExists).mockResolvedValue(false);

    const response = await app.request(`/api/projects/${projectId}/expenses`);

    expect(response.status).toBe(404);
  });
});

describe("POST /api/projects/:projectId/expenses", () => {
  it("saves an expense without a step and returns 201", async () => {
    vi.mocked(createExpense).mockResolvedValue({ ...expense, stepId: null });

    const response = await postExpense({ description: " Container ", amount: 3500 });

    expect(response.status).toBe(201);
    expect(createExpense).toHaveBeenCalledWith(projectId, {
      description: "Container",
      amount: 3500,
      date: null,
      stepId: null,
      category: "other",
      supplier: "",
    });
    expect(getStep).not.toHaveBeenCalled();
  });

  it("saves the category and supplier", async () => {
    vi.mocked(createExpense).mockResolvedValue(expense);

    await postExpense({ description: "Elcentral", amount: 9000, category: "electrician", supplier: " Elfirma AB " });

    expect(createExpense).toHaveBeenCalledWith(
      projectId,
      expect.objectContaining({ category: "electrician", supplier: "Elfirma AB" }),
    );
  });

  it("saves an expense for a step in the same project", async () => {
    vi.mocked(getStep).mockResolvedValue(stepIn(projectId));
    vi.mocked(createExpense).mockResolvedValue(expense);

    const response = await postExpense({ description: "Kakel", amount: 12000, stepId });

    expect(response.status).toBe(201);
    expect(createExpense).toHaveBeenCalledWith(projectId, expect.objectContaining({ stepId }));
  });

  it("returns 400 when the step belongs to another project", async () => {
    vi.mocked(getStep).mockResolvedValue(stepIn("00000000-0000-4000-8000-000000000000"));

    const response = await postExpense({ description: "Kakel", amount: 12000, stepId });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Steget hör inte till projektet" });
    expect(createExpense).not.toHaveBeenCalled();
  });

  it("returns 400 when the step does not exist", async () => {
    vi.mocked(getStep).mockResolvedValue(undefined);

    const response = await postExpense({ description: "Kakel", amount: 12000, stepId });

    expect(response.status).toBe(400);
    expect(createExpense).not.toHaveBeenCalled();
  });

  it("returns 400 with the reason when the input is invalid", async () => {
    const response = await postExpense({ description: "Kakel", amount: 0 });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "amount måste vara ett heltal större än 0" });
  });

  it("returns 404 when the project does not exist", async () => {
    vi.mocked(projectExists).mockResolvedValue(false);

    const response = await postExpense({ description: "Kakel", amount: 100 });

    expect(response.status).toBe(404);
    expect(createExpense).not.toHaveBeenCalled();
  });
});

describe("PATCH /api/expenses/:expenseId", () => {
  const patchExpense = (body: unknown) => sendJson("PATCH", `/api/expenses/${expenseId}`, body);

  beforeEach(() => {
    vi.mocked(getExpense).mockResolvedValue(expense);
    vi.mocked(getStep).mockResolvedValue(stepIn(projectId));
  });

  it("changes only the given fields and keeps the rest", async () => {
    vi.mocked(updateExpense).mockResolvedValue({ ...expense, description: "Golvkakel" });

    const response = await patchExpense({ description: " Golvkakel " });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ description: "Golvkakel" });
    expect(updateExpense).toHaveBeenCalledWith(expenseId, {
      stepId,
      category: "purchase",
      supplier: "Bauhaus",
      description: "Golvkakel",
      amount: 12000,
      date: "2026-10-01",
    });
  });

  it("can move the expense to the whole project", async () => {
    await patchExpense({ stepId: null });

    expect(updateExpense).toHaveBeenCalledWith(expenseId, expect.objectContaining({ stepId: null }));
  });

  it("returns 400 when the new step belongs to another project", async () => {
    vi.mocked(getStep).mockResolvedValue(stepIn("00000000-0000-4000-8000-000000000000"));

    const response = await patchExpense({ stepId });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Steget hör inte till projektet" });
    expect(updateExpense).not.toHaveBeenCalled();
  });

  it("returns 400 when a changed field is invalid", async () => {
    const response = await patchExpense({ amount: -5 });

    expect(response.status).toBe(400);
    expect(updateExpense).not.toHaveBeenCalled();
  });

  it("returns 400 when the body is not an object", async () => {
    const response = await patchExpense([1, 2]);

    expect(response.status).toBe(400);
  });

  it("returns 404 when the expense does not exist", async () => {
    vi.mocked(getExpense).mockResolvedValue(undefined);

    const response = await patchExpense({ amount: 100 });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Kostnaden finns inte" });
  });
});

describe("DELETE /api/expenses/:expenseId", () => {
  it("deletes the expense and returns 204", async () => {
    vi.mocked(deleteExpense).mockResolvedValue(true);

    const response = await app.request(`/api/expenses/${expenseId}`, { method: "DELETE" });

    expect(response.status).toBe(204);
    expect(deleteExpense).toHaveBeenCalledWith(expenseId);
  });

  it("returns 404 when the expense does not exist", async () => {
    vi.mocked(deleteExpense).mockResolvedValue(false);

    const response = await app.request(`/api/expenses/${expenseId}`, { method: "DELETE" });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Kostnaden finns inte" });
  });

  it("returns 404 without querying the database when the id is not a uuid", async () => {
    const response = await app.request("/api/expenses/abc", { method: "DELETE" });

    expect(response.status).toBe(404);
    expect(deleteExpense).not.toHaveBeenCalled();
  });
});
