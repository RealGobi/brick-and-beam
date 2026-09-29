import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "../app";
import { deleteImageFiles } from "../images/imageStorage";
import { projectExists } from "../projects/projectStore";
import { createStep, deleteStep, getStep, listSteps, updateStep, type Step } from "./stepStore";

// Replace the database and the file system so the tests need neither
vi.mock("./stepStore");
vi.mock("../projects/projectStore");
vi.mock("../images/imageStorage");

const projectId = "7c3e0f5a-1b2c-4d5e-8f90-123456789abc";
const stepId = "1f2e3d4c-5b6a-4978-8695-a4b3c2d1e0f9";

const step: Step = {
  id: stepId,
  projectId,
  name: "Riva kakel",
  description: "Hela väggen",
  status: "ongoing",
  date: "2026-09-05",
  createdAt: new Date("2026-09-05T10:00:00.000Z"),
  updatedAt: new Date("2026-09-05T10:00:00.000Z"),
  images: [],
};

function sendJson(method: string, path: string, body: string) {
  return app.request(path, { method, headers: { "Content-Type": "application/json" }, body });
}

beforeEach(() => {
  vi.mocked(projectExists).mockResolvedValue(true);
  vi.mocked(getStep).mockResolvedValue(step);
});

afterEach(() => {
  vi.resetAllMocks();
  vi.restoreAllMocks();
});

describe("GET /api/projects/:projectId/steps", () => {
  it("returns the steps of the project", async () => {
    vi.mocked(listSteps).mockResolvedValue([step]);

    const response = await app.request(`/api/projects/${projectId}/steps`);

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject([{ id: stepId, name: "Riva kakel", date: "2026-09-05" }]);
    expect(listSteps).toHaveBeenCalledWith(projectId);
  });

  it("returns 404 when the project does not exist", async () => {
    vi.mocked(projectExists).mockResolvedValue(false);

    const response = await app.request(`/api/projects/${projectId}/steps`);

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Projektet finns inte" });
  });

  it("returns 404 without querying the database when the id is not a uuid", async () => {
    const response = await app.request("/api/projects/not-a-uuid/steps");

    expect(response.status).toBe(404);
    expect(projectExists).not.toHaveBeenCalled();
  });
});

describe("POST /api/projects/:projectId/steps", () => {
  const postStep = (body: string) => sendJson("POST", `/api/projects/${projectId}/steps`, body);

  it("returns 201 and the created step", async () => {
    vi.mocked(createStep).mockResolvedValue(step);

    const response = await postStep(JSON.stringify({ name: "Riva kakel" }));

    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ id: stepId, images: [] });
  });

  it("saves the validated input for the right project", async () => {
    await postStep(JSON.stringify({ name: " Måla ", status: "done" }));

    expect(createStep).toHaveBeenCalledWith(projectId, { name: "Måla", description: "", status: "done", date: null });
  });

  it("returns 400 with the reason when the input is invalid", async () => {
    const response = await postStep(JSON.stringify({ name: "" }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "name krävs" });
    expect(createStep).not.toHaveBeenCalled();
  });

  it("returns 404 when the project does not exist", async () => {
    vi.mocked(projectExists).mockResolvedValue(false);

    const response = await postStep(JSON.stringify({ name: "Måla" }));

    expect(response.status).toBe(404);
    expect(createStep).not.toHaveBeenCalled();
  });
});

describe("PATCH /api/steps/:stepId", () => {
  const patchStep = (body: string) => sendJson("PATCH", `/api/steps/${stepId}`, body);

  it("changes only the given fields and keeps the rest", async () => {
    vi.mocked(updateStep).mockResolvedValue({ ...step, status: "done" });

    const response = await patchStep(JSON.stringify({ status: "done" }));

    expect(response.status).toBe(200);
    expect(updateStep).toHaveBeenCalledWith(stepId, {
      name: "Riva kakel",
      description: "Hela väggen",
      status: "done",
      date: "2026-09-05",
    });
  });

  it("can clear the date", async () => {
    await patchStep(JSON.stringify({ date: null }));

    expect(updateStep).toHaveBeenCalledWith(stepId, expect.objectContaining({ date: null }));
  });

  it("ignores fields that can't be changed", async () => {
    await patchStep(JSON.stringify({ id: "other", projectId: "other", name: "Måla" }));

    expect(updateStep).toHaveBeenCalledWith(stepId, {
      name: "Måla",
      description: "Hela väggen",
      status: "ongoing",
      date: "2026-09-05",
    });
  });

  it("returns 400 when a changed field is invalid", async () => {
    const response = await patchStep(JSON.stringify({ status: "planned" }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "status måste vara ongoing eller done" });
    expect(updateStep).not.toHaveBeenCalled();
  });

  it("returns 400 when the body is not an object", async () => {
    const response = await patchStep("[1, 2]");

    expect(response.status).toBe(400);
  });

  it("returns 404 when the step does not exist", async () => {
    vi.mocked(getStep).mockResolvedValue(undefined);

    const response = await patchStep(JSON.stringify({ status: "done" }));

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Steget finns inte" });
  });
});

describe("DELETE /api/steps/:stepId", () => {
  it("deletes the step, removes its image files and returns 204", async () => {
    vi.mocked(deleteStep).mockResolvedValue(["a.jpg", "b.png"]);

    const response = await app.request(`/api/steps/${stepId}`, { method: "DELETE" });

    expect(response.status).toBe(204);
    expect(deleteImageFiles).toHaveBeenCalledWith(["a.jpg", "b.png"]);
  });

  it("returns 404 when the step does not exist", async () => {
    vi.mocked(deleteStep).mockResolvedValue(undefined);

    const response = await app.request(`/api/steps/${stepId}`, { method: "DELETE" });

    expect(response.status).toBe(404);
    expect(deleteImageFiles).not.toHaveBeenCalled();
  });

  it("returns 404 without querying the database when the id is not a uuid", async () => {
    const response = await app.request("/api/steps/abc", { method: "DELETE" });

    expect(response.status).toBe(404);
    expect(deleteStep).not.toHaveBeenCalled();
  });
});
