import { describe, expect, it } from "vitest";
import { app } from "./app";

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

describe("unknown routes", () => {
  it("returns 404 for a route that does not exist", async () => {
    const response = await app.request("/api/does-not-exist");

    expect(response.status).toBe(404);
  });
});
