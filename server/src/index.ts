import { serve } from "@hono/node-server";
import { Hono } from "hono";

const app = new Hono();

app.get("/api/health", (c) =>
  c.json({ ok: true, time: new Date().toISOString() }),
);

serve({ fetch: app.fetch, port: 3000 }, (info) => {
  console.log(`Servern lyssnar på http://localhost:${info.port}`);
});
