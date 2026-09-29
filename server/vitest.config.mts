import os from "node:os";
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    env: {
      // db.ts requires a URL at import time. postgres.js only connects on the first query,
      // and tests mock all queries, so this database is never contacted.
      DATABASE_URL: "postgres://test:test@localhost:5432/test",
      // Keep test uploads out of the real uploads folder
      UPLOADS_DIR: path.join(os.tmpdir(), "brick-and-beam-test-uploads"),
    },
    coverage: {
      include: ["src/**/*.ts"],
      // These files only start the server or run the migration, they are not unit tested
      exclude: ["src/**/*.test.ts", "src/index.ts", "src/migrate.ts"],
    },
  },
});
