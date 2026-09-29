import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "../app";
import { deleteImageFiles, saveImageFile } from "../images/imageStorage";
import { projectExists } from "../projects/projectStore";
import { addStepImages, createStep, listSteps, stepExists, type Step } from "./stepStore";

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
  description: "",
  status: "ongoing",
  date: "2026-09-05",
  createdAt: new Date("2026-09-05T10:00:00.000Z"),
  updatedAt: new Date("2026-09-05T10:00:00.000Z"),
  images: [],
};

const savedFile = { fileName: "abc.png", originalName: "kakel.png", contentType: "image/png", sizeBytes: 4 };
const storedImage = { id: "img-1", url: "/api/uploads/abc.png", originalName: "kakel.png", createdAt: new Date() };

function postJson(path: string, body: string) {
  return app.request(path, { method: "POST", headers: { "Content-Type": "application/json" }, body });
}

function uploadImages(files: File[]) {
  const form = new FormData();
  files.forEach((file) => form.append("images", file));
  return app.request(`/api/steps/${stepId}/images`, { method: "POST", body: form });
}

const pngFile = () => new File(["png!"], "kakel.png", { type: "image/png" });

beforeEach(() => {
  vi.mocked(projectExists).mockResolvedValue(true);
  vi.mocked(stepExists).mockResolvedValue(true);
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
  it("returns 201 and the created step", async () => {
    vi.mocked(createStep).mockResolvedValue(step);

    const response = await postJson(`/api/projects/${projectId}/steps`, JSON.stringify({ name: "Riva kakel" }));

    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ id: stepId, images: [] });
  });

  it("saves the validated input for the right project", async () => {
    await postJson(`/api/projects/${projectId}/steps`, JSON.stringify({ name: " Måla ", status: "done" }));

    expect(createStep).toHaveBeenCalledWith(projectId, { name: "Måla", description: "", status: "done", date: null });
  });

  it("returns 400 with the reason when the input is invalid", async () => {
    const response = await postJson(`/api/projects/${projectId}/steps`, JSON.stringify({ name: "" }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "name krävs" });
    expect(createStep).not.toHaveBeenCalled();
  });

  it("returns 404 when the project does not exist", async () => {
    vi.mocked(projectExists).mockResolvedValue(false);

    const response = await postJson(`/api/projects/${projectId}/steps`, JSON.stringify({ name: "Måla" }));

    expect(response.status).toBe(404);
    expect(createStep).not.toHaveBeenCalled();
  });
});

describe("POST /api/steps/:stepId/images", () => {
  it("saves each image and returns them with 201", async () => {
    vi.mocked(saveImageFile).mockResolvedValue(savedFile);
    vi.mocked(addStepImages).mockResolvedValue([storedImage, storedImage]);

    const response = await uploadImages([pngFile(), pngFile()]);

    expect(response.status).toBe(201);
    expect(saveImageFile).toHaveBeenCalledTimes(2);
    expect(addStepImages).toHaveBeenCalledWith(stepId, [savedFile, savedFile]);
  });

  it("returns 400 and saves nothing when a file is not an image", async () => {
    const response = await uploadImages([new File(["%PDF"], "ritning.pdf", { type: "application/pdf" })]);

    expect(response.status).toBe(400);
    expect(saveImageFile).not.toHaveBeenCalled();
  });

  it("returns 400 when no images are sent", async () => {
    const response = await uploadImages([]);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Välj minst en bild" });
  });

  it("returns 404 when the step does not exist", async () => {
    vi.mocked(stepExists).mockResolvedValue(false);

    const response = await uploadImages([pngFile()]);

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Steget finns inte" });
    expect(saveImageFile).not.toHaveBeenCalled();
  });

  it("removes the saved files when the database insert fails", async () => {
    vi.mocked(saveImageFile).mockResolvedValue(savedFile);
    vi.mocked(addStepImages).mockRejectedValue(new Error("connection refused"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await uploadImages([pngFile()]);

    expect(response.status).toBe(500);
    expect(deleteImageFiles).toHaveBeenCalledWith(["abc.png"]);
  });
});
