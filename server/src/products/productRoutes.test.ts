import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "../app";
import { deleteImageFiles } from "../images/imageStorage";
import { createProduct, deleteProduct, getProduct, listProducts, updateProduct, type Product } from "./productStore";

// Replace the database and the file system so the tests need neither
vi.mock("./productStore");
vi.mock("../images/imageStorage");

const productId = "3a2b1c0d-9e8f-4a7b-8c6d-5e4f3a2b1c0d";

const product: Product = {
  id: productId,
  name: "Värmepump",
  description: "",
  manufacturer: "Nibe",
  model: "F2120",
  serialNumber: "",
  location: "Pannrummet",
  purchaseDate: "2024-05-01",
  warrantyUntil: "2029-05-01",
  serviceIntervalMonths: 12,
  createdAt: new Date("2024-05-01T10:00:00.000Z"),
  updatedAt: new Date("2024-05-01T10:00:00.000Z"),
  lastServiceDate: "2025-10-01",
  nextServiceDate: "2026-10-01",
  serviceCount: 2,
};

function sendJson(method: string, path: string, body: unknown) {
  return app.request(path, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
}

beforeEach(() => {
  vi.mocked(getProduct).mockResolvedValue(product);
});

afterEach(() => {
  vi.resetAllMocks();
});

describe("GET /api/products", () => {
  it("returns all products", async () => {
    vi.mocked(listProducts).mockResolvedValue([product]);

    const response = await app.request("/api/products");

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject([{ id: productId, nextServiceDate: "2026-10-01", serviceCount: 2 }]);
  });
});

describe("GET /api/products/:productId", () => {
  it("returns the product", async () => {
    const response = await app.request(`/api/products/${productId}`);

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ name: "Värmepump" });
  });

  it("returns 404 when the product does not exist", async () => {
    vi.mocked(getProduct).mockResolvedValue(undefined);

    const response = await app.request(`/api/products/${productId}`);

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Produkten finns inte" });
  });

  it("returns 404 without querying the database when the id is not a uuid", async () => {
    const response = await app.request("/api/products/abc");

    expect(response.status).toBe(404);
    expect(getProduct).not.toHaveBeenCalled();
  });
});

describe("POST /api/products", () => {
  it("saves the validated product and returns 201", async () => {
    vi.mocked(createProduct).mockResolvedValue(product);

    const response = await sendJson("POST", "/api/products", { name: " Värmepump ", serviceIntervalMonths: 12 });

    expect(response.status).toBe(201);
    expect(createProduct).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Värmepump", serviceIntervalMonths: 12, purchaseDate: null }),
    );
  });

  it("returns 400 with the reason when the input is invalid", async () => {
    const response = await sendJson("POST", "/api/products", { name: "" });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "name krävs" });
    expect(createProduct).not.toHaveBeenCalled();
  });
});

describe("PATCH /api/products/:productId", () => {
  it("changes only the given fields and keeps the rest", async () => {
    vi.mocked(updateProduct).mockResolvedValue({ ...product, location: "Garaget" });

    const response = await sendJson("PATCH", `/api/products/${productId}`, { location: "Garaget" });

    expect(response.status).toBe(200);
    expect(updateProduct).toHaveBeenCalledWith(productId, {
      name: "Värmepump",
      description: "",
      manufacturer: "Nibe",
      model: "F2120",
      serialNumber: "",
      location: "Garaget",
      purchaseDate: "2024-05-01",
      warrantyUntil: "2029-05-01",
      serviceIntervalMonths: 12,
    });
  });

  it("can turn off the regular service", async () => {
    await sendJson("PATCH", `/api/products/${productId}`, { serviceIntervalMonths: null });

    expect(updateProduct).toHaveBeenCalledWith(productId, expect.objectContaining({ serviceIntervalMonths: null }));
  });

  it("returns 400 when only the warranty changes to before the saved purchase date", async () => {
    const response = await sendJson("PATCH", `/api/products/${productId}`, { warrantyUntil: "2023-01-01" });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "warrantyUntil får inte vara före purchaseDate" });
    expect(updateProduct).not.toHaveBeenCalled();
  });

  it("ignores computed fields sent by the client", async () => {
    await sendJson("PATCH", `/api/products/${productId}`, { nextServiceDate: "2000-01-01", serviceCount: 99 });

    expect(updateProduct).toHaveBeenCalledWith(productId, expect.not.objectContaining({ serviceCount: 99 }));
  });

  it("returns 404 when the product does not exist", async () => {
    vi.mocked(getProduct).mockResolvedValue(undefined);

    const response = await sendJson("PATCH", `/api/products/${productId}`, { name: "Ny" });

    expect(response.status).toBe(404);
  });
});

describe("DELETE /api/products/:productId", () => {
  it("deletes the product, removes its image files and returns 204", async () => {
    vi.mocked(deleteProduct).mockResolvedValue(["a.jpg"]);

    const response = await app.request(`/api/products/${productId}`, { method: "DELETE" });

    expect(response.status).toBe(204);
    expect(deleteImageFiles).toHaveBeenCalledWith(["a.jpg"]);
  });

  it("returns 404 when the product does not exist", async () => {
    vi.mocked(deleteProduct).mockResolvedValue(undefined);

    const response = await app.request(`/api/products/${productId}`, { method: "DELETE" });

    expect(response.status).toBe(404);
    expect(deleteImageFiles).not.toHaveBeenCalled();
  });
});
