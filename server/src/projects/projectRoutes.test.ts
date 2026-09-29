import { afterEach, describe, expect, it, vi } from "vitest";
import { app } from "../app";
import { createProject, getProject, listProjects, type Project } from "./projectStore";

// Replace the database queries so the tests never need a running database
vi.mock("./projectStore");

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
