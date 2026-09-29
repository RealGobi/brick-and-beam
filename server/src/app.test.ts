import fs from "node:fs/promises";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { app } from "./app";
import { uploadsDir } from "./images/imageStorage";

describe("GET /api/health", () => {
  it("returns status 200", async () => {
    const response = await app.request("/api/health");

    expect(response.status).toBe(200);
  });

  it("returns ok: true and a valid ISO timestamp", async () => {
    const response = await app.request("/api/health");
    const body = await response.json();

    expect(body.ok).toBe(true);
    expect(new Date(body.time).toISOString()).toBe(body.time);
  });
});

describe("GET /api/uploads/:fileName", () => {
  // UPLOADS_DIR points to a temporary folder in tests, see vitest.config.mts
  const fileName = "served-image-test.png";

  afterEach(async () => {
    await fs.rm(path.join(uploadsDir, fileName), { force: true });
  });

  it("serves an uploaded image with the right content type", async () => {
    await fs.mkdir(uploadsDir, { recursive: true });
    await fs.writeFile(path.join(uploadsDir, fileName), "png bytes");

    const response = await app.request(`/api/uploads/${fileName}`);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
    expect(await response.text()).toBe("png bytes");
  });

  it("returns 404 for an image that does not exist", async () => {
    const response = await app.request("/api/uploads/missing.png");

    expect(response.status).toBe(404);
  });
});

describe("unknown routes", () => {
  it("returns 404 for a route that does not exist", async () => {
    const response = await app.request("/api/does-not-exist");

    expect(response.status).toBe(404);
  });
});
