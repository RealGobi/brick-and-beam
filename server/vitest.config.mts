import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      include: ["src/**/*.ts"],
      // index.ts only starts the server and is not unit tested
      exclude: ["src/**/*.test.ts", "src/index.ts"],
    },
  },
});
