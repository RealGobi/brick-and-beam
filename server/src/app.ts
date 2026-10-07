import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { expenseRoutes } from "./expenses/expenseRoutes";
import { imageRoutes } from "./images/imageRoutes";
import { uploadsDir } from "./images/imageStorage";
import { projectRoutes } from "./projects/projectRoutes";
import { stepRoutes } from "./steps/stepRoutes";

/** The Hono app with all routes. Kept separate from index.ts so tests can call it without starting a server. */
export const app = new Hono();

app.get("/api/health", (c) =>
  c.json({ ok: true, time: new Date().toISOString() }),
);

app.route("/api/projects", projectRoutes);
app.route("/api", stepRoutes);
app.route("/api", imageRoutes);
app.route("/api", expenseRoutes);

// Uploaded images live under /api so the Vite dev proxy forwards them too
app.use(
  "/api/uploads/*",
  serveStatic({
    root: uploadsDir,
    rewriteRequestPath: (requestPath) => requestPath.replace(/^\/api\/uploads/, ""),
  }),
);

// Log unexpected errors (e.g. database down) and give the client JSON instead of a plain-text 500
app.onError((error, c) => {
  console.error(error);
  return c.json({ error: "Något gick fel på servern" }, 500);
});
