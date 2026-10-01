import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "../app";
import { deleteImageFiles } from "../images/imageStorage";
import {
  createProject,
  deleteProject,
  getProject,
  listProjects,
  updateProject,
  type Project,
} from "./projectStore";

// Replace the database queries so the tests never need a running database
vi.mock("./projectStore");
vi.mock("../images/imageStorage");

const storedProject: Project = {
  id: "7c3e0f5a-1b2c-4d5e-8f90-123456789abc",
  name: "Nytt badrum",
  description: "Byta kakel och dusch",
  status: "ongoing",
  startDate: "2026-09-01",
  endDate: "2026-10-15",
  budget: 85000,
  createdAt: new Date("2026-09-01T10:00:00.000Z"),
  updatedAt: new Date("2026-09-02T08:30:00.000Z"),
  coverImageUrl: "/api/uploads/cover.jpg",
};

// How storedProject looks in a JSON response
const storedProjectJson = {
  ...storedProject,
  createdAt: "2026-09-01T10:00:00.000Z",
  updatedAt: "2026-09-02T08:30:00.000Z",
};

function postProject(body: string) {
  return app.request("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}

afterEach(() => {
  vi.resetAllMocks();
  vi.restoreAllMocks();
});

describe("GET /api/projects", () => {
  it("returns an empty list when there are no projects", async () => {
    vi.mocked(listProjects).mockResolvedValue([]);

    const response = await app.request("/api/projects");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([]);
  });

  it("returns the projects with timestamps as ISO strings", async () => {
    vi.mocked(listProjects).mockResolvedValue([storedProject]);

    const response = await app.request("/api/projects");

    expect(await response.json()).toEqual([storedProjectJson]);
  });

  it("returns 500 with an error message when the database fails", async () => {
    vi.mocked(listProjects).mockRejectedValue(new Error("connection refused"));
    // The error handler logs the error, keep the test output clean
    vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await app.request("/api/projects");

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Något gick fel på servern" });
  });
});

describe("GET /api/projects/:projectId", () => {
  it("returns the project", async () => {
    vi.mocked(getProject).mockResolvedValue(storedProject);

    const response = await app.request(`/api/projects/${storedProject.id}`);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(storedProjectJson);
  });

  it("returns 404 when the project does not exist", async () => {
    vi.mocked(getProject).mockResolvedValue(undefined);

    const response = await app.request(`/api/projects/${storedProject.id}`);

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Projektet finns inte" });
  });

  it("returns 404 without querying the database when the id is not a uuid", async () => {
    const response = await app.request("/api/projects/abc");

    expect(response.status).toBe(404);
    expect(getProject).not.toHaveBeenCalled();
  });
});

describe("POST /api/projects", () => {
  it("returns 201 and the created project", async () => {
    vi.mocked(createProject).mockResolvedValue(storedProject);

    const response = await postProject(JSON.stringify({ name: "Nytt badrum" }));

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual(storedProjectJson);
  });

  it("saves the validated input with defaults for missing fields", async () => {
    await postProject(JSON.stringify({ name: "  Kök  ", budget: 40000 }));

    expect(createProject).toHaveBeenCalledWith({
      name: "Kök",
      description: "",
      status: "planned",
      startDate: null,
      endDate: null,
      budget: 40000,
    });
  });

  it("returns 400 with the reason when the input is invalid", async () => {
    const response = await postProject(JSON.stringify({ name: "" }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "name krävs" });
    expect(createProject).not.toHaveBeenCalled();
  });

  it("returns 400 when the body is not valid JSON", async () => {
    const response = await postProject("{ name: Altan");

    expect(response.status).toBe(400);
    expect(createProject).not.toHaveBeenCalled();
  });

  it("returns 500 when the database fails", async () => {
    vi.mocked(createProject).mockRejectedValue(new Error("connection refused"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await postProject(JSON.stringify({ name: "Altan" }));

    expect(response.status).toBe(500);
  });
});

describe("PATCH /api/projects/:projectId", () => {
  const patchProject = (body: string) =>
    app.request(`/api/projects/${storedProject.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body,
    });

  beforeEach(() => {
    vi.mocked(getProject).mockResolvedValue(storedProject);
  });

  it("changes only the given fields and keeps the rest", async () => {
    vi.mocked(updateProject).mockResolvedValue({ ...storedProject, budget: 90000 });

    const response = await patchProject(JSON.stringify({ budget: 90000 }));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ budget: 90000 });
    expect(updateProject).toHaveBeenCalledWith(storedProject.id, {
      name: "Nytt badrum",
      description: "Byta kakel och dusch",
      status: "ongoing",
      startDate: "2026-09-01",
      endDate: "2026-10-15",
      budget: 90000,
    });
  });

  it("can clear optional fields", async () => {
    await patchProject(JSON.stringify({ endDate: null, budget: null }));

    expect(updateProject).toHaveBeenCalledWith(
      storedProject.id,
      expect.objectContaining({ endDate: null, budget: null }),
    );
  });

  it("returns 400 when only the end date changes to before the saved start date", async () => {
    const response = await patchProject(JSON.stringify({ endDate: "2026-08-01" }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "endDate får inte vara före startDate" });
    expect(updateProject).not.toHaveBeenCalled();
  });

  it("returns 400 when the body is not an object", async () => {
    const response = await patchProject("not json");

    expect(response.status).toBe(400);
  });

  it("returns 404 when the project does not exist", async () => {
    vi.mocked(getProject).mockResolvedValue(undefined);

    const response = await patchProject(JSON.stringify({ name: "Kök" }));

    expect(response.status).toBe(404);
    expect(updateProject).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/projects/:projectId", () => {
  it("deletes the project, removes all its image files and returns 204", async () => {
    vi.mocked(deleteProject).mockResolvedValue(["a.jpg", "b.png"]);

    const response = await app.request(`/api/projects/${storedProject.id}`, { method: "DELETE" });

    expect(response.status).toBe(204);
    expect(deleteImageFiles).toHaveBeenCalledWith(["a.jpg", "b.png"]);
  });

  it("returns 404 when the project does not exist", async () => {
    vi.mocked(deleteProject).mockResolvedValue(undefined);

    const response = await app.request(`/api/projects/${storedProject.id}`, { method: "DELETE" });

    expect(response.status).toBe(404);
    expect(deleteImageFiles).not.toHaveBeenCalled();
  });

  it("returns 404 without querying the database when the id is not a uuid", async () => {
    const response = await app.request("/api/projects/abc", { method: "DELETE" });

    expect(response.status).toBe(404);
    expect(deleteProject).not.toHaveBeenCalled();
  });
});
