import { Hono } from "hono";

/** The Hono app with all routes. Kept separate from index.ts so tests can call it without starting a server. */
export const app = new Hono();

app.get("/api/health", (c) =>
  c.json({ ok: true, time: new Date().toISOString() }),
);
