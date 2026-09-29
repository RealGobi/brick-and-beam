import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "../app";
import { addStepImages, deleteStepImage, stepExists } from "../steps/stepStore";
import { deleteImageFiles, saveImageFile } from "./imageStorage";

// Replace the database and the file system so the tests need neither
vi.mock("../steps/stepStore");
vi.mock("./imageStorage");

const stepId = "1f2e3d4c-5b6a-4978-8695-a4b3c2d1e0f9";
const imageId = "9a8b7c6d-5e4f-4321-8765-0fedcba98765";

const savedFile = { fileName: "abc.png", originalName: "kakel.png", contentType: "image/png", sizeBytes: 4 };
const storedImage = { id: imageId, url: "/api/uploads/abc.png", originalName: "kakel.png", createdAt: new Date() };

function uploadImages(files: File[]) {
  const form = new FormData();
  files.forEach((file) => form.append("images", file));
  return app.request(`/api/steps/${stepId}/images`, { method: "POST", body: form });
}

const pngFile = () => new File(["png!"], "kakel.png", { type: "image/png" });

beforeEach(() => {
  vi.mocked(stepExists).mockResolvedValue(true);
});

afterEach(() => {
  vi.resetAllMocks();
  vi.restoreAllMocks();
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

describe("DELETE /api/images/:imageId", () => {
  it("deletes the image, removes its file and returns 204", async () => {
    vi.mocked(deleteStepImage).mockResolvedValue("abc.png");

    const response = await app.request(`/api/images/${imageId}`, { method: "DELETE" });

    expect(response.status).toBe(204);
    expect(deleteStepImage).toHaveBeenCalledWith(imageId);
    expect(deleteImageFiles).toHaveBeenCalledWith(["abc.png"]);
  });

  it("returns 404 when the image does not exist", async () => {
    vi.mocked(deleteStepImage).mockResolvedValue(undefined);

    const response = await app.request(`/api/images/${imageId}`, { method: "DELETE" });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Bilden finns inte" });
    expect(deleteImageFiles).not.toHaveBeenCalled();
  });

  it("returns 404 without querying the database when the id is not a uuid", async () => {
    const response = await app.request("/api/images/abc", { method: "DELETE" });

    expect(response.status).toBe(404);
    expect(deleteStepImage).not.toHaveBeenCalled();
  });
});
