import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "../app";
import { deleteImageFiles, saveImageFile } from "../images/imageStorage";
import { getProduct, type Product } from "../products/productStore";
import {
  addServiceImages,
  createService,
  deleteService,
  deleteServiceImage,
  getService,
  listServices,
  serviceExists,
  updateService,
  type ServiceEntry,
} from "./serviceStore";

// Replace the database and the file system so the tests need neither
vi.mock("./serviceStore");
vi.mock("../products/productStore");
vi.mock("../images/imageStorage");

const productId = "3a2b1c0d-9e8f-4a7b-8c6d-5e4f3a2b1c0d";
const serviceId = "5b4a3c2d-1e0f-4a9b-8c7d-6e5f4a3b2c1d";
const imageId = "9a8b7c6d-5e4f-4321-8765-0fedcba98765";

const service: ServiceEntry = {
  id: serviceId,
  productId,
  name: "Filterbyte",
  description: "",
  performedOn: "2026-03-01",
  performedBy: "Ventilationsteknik",
  cost: 1200,
  createdAt: new Date("2026-03-01T10:00:00.000Z"),
  updatedAt: new Date("2026-03-01T10:00:00.000Z"),
  images: [],
};

const sendJson = (method: string, path: string, body: unknown) =>
  app.request(path, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

function uploadImages(files: File[]) {
  const form = new FormData();
  files.forEach((file) => form.append("images", file));
  return app.request(`/api/services/${serviceId}/images`, { method: "POST", body: form });
}

beforeEach(() => {
  vi.mocked(getProduct).mockResolvedValue({ id: productId } as Product);
  vi.mocked(getService).mockResolvedValue(service);
  vi.mocked(serviceExists).mockResolvedValue(true);
});

afterEach(() => {
  vi.resetAllMocks();
});

describe("GET and POST /api/products/:productId/services", () => {
  it("returns the services of the product", async () => {
    vi.mocked(listServices).mockResolvedValue([service]);

    const response = await app.request(`/api/products/${productId}/services`);

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject([{ id: serviceId, performedOn: "2026-03-01", cost: 1200 }]);
  });

  it("saves the validated service for the product and returns 201", async () => {
    vi.mocked(createService).mockResolvedValue(service);

    const response = await sendJson("POST", `/api/products/${productId}/services`, {
      name: " Filterbyte ",
      performedOn: "2026-03-01",
    });

    expect(response.status).toBe(201);
    expect(createService).toHaveBeenCalledWith(productId, {
      name: "Filterbyte",
      description: "",
      performedOn: "2026-03-01",
      performedBy: "",
      cost: null,
    });
  });

  it("returns 400 when the date is missing", async () => {
    const response = await sendJson("POST", `/api/products/${productId}/services`, { name: "Filterbyte" });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "performedOn krävs" });
  });

  it("returns 404 when the product does not exist", async () => {
    vi.mocked(getProduct).mockResolvedValue(undefined);

    const response = await app.request(`/api/products/${productId}/services`);

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Produkten finns inte" });
  });
});

describe("PATCH and DELETE /api/services/:serviceId", () => {
  it("changes only the given fields and keeps the rest", async () => {
    vi.mocked(updateService).mockResolvedValue({ ...service, cost: null });

    const response = await sendJson("PATCH", `/api/services/${serviceId}`, { cost: null });

    expect(response.status).toBe(200);
    expect(updateService).toHaveBeenCalledWith(serviceId, {
      name: "Filterbyte",
      description: "",
      performedOn: "2026-03-01",
      performedBy: "Ventilationsteknik",
      cost: null,
    });
  });

  it("returns 404 when editing a service that does not exist", async () => {
    vi.mocked(getService).mockResolvedValue(undefined);

    const response = await sendJson("PATCH", `/api/services/${serviceId}`, { cost: 5 });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Servicen finns inte" });
  });

  it("deletes the service, removes its image files and returns 204", async () => {
    vi.mocked(deleteService).mockResolvedValue(["a.jpg"]);

    const response = await app.request(`/api/services/${serviceId}`, { method: "DELETE" });

    expect(response.status).toBe(204);
    expect(deleteImageFiles).toHaveBeenCalledWith(["a.jpg"]);
  });

  it("returns 404 without querying the database when the id is not a uuid", async () => {
    const response = await app.request("/api/services/abc", { method: "DELETE" });

    expect(response.status).toBe(404);
    expect(deleteService).not.toHaveBeenCalled();
  });
});

describe("service images", () => {
  const savedFile = { fileName: "abc.png", originalName: "filter.png", contentType: "image/png", sizeBytes: 4 };

  it("saves uploaded images and links them to the service", async () => {
    vi.mocked(saveImageFile).mockResolvedValue(savedFile);
    vi.mocked(addServiceImages).mockResolvedValue([]);

    const response = await uploadImages([new File(["png!"], "filter.png", { type: "image/png" })]);

    expect(response.status).toBe(201);
    expect(addServiceImages).toHaveBeenCalledWith(serviceId, [savedFile]);
  });

  it("returns 404 when uploading to a service that does not exist", async () => {
    vi.mocked(serviceExists).mockResolvedValue(false);

    const response = await uploadImages([new File(["png!"], "filter.png", { type: "image/png" })]);

    expect(response.status).toBe(404);
    expect(saveImageFile).not.toHaveBeenCalled();
  });

  it("deletes one image and its file", async () => {
    vi.mocked(deleteServiceImage).mockResolvedValue("abc.png");

    const response = await app.request(`/api/service-images/${imageId}`, { method: "DELETE" });

    expect(response.status).toBe(204);
    expect(deleteImageFiles).toHaveBeenCalledWith(["abc.png"]);
  });

  it("returns 404 when the image does not exist", async () => {
    vi.mocked(deleteServiceImage).mockResolvedValue(undefined);

    const response = await app.request(`/api/service-images/${imageId}`, { method: "DELETE" });

    expect(response.status).toBe(404);
  });
});
