# Testing guidelines – server

How we write and run tests for the Brick & Beam server (Hono + TypeScript).
The general rules in the root `CLAUDE.md` still apply; this file adds the server-specific details.

## Commands

Run from the `server/` folder:

```bash
npm test                 # run all tests once (vitest run)
npm run test:watch       # watch mode while developing
npm run test:coverage    # run tests with a coverage report
```

All tests must pass before a task is considered done.

## Where tests live

- Place the test file next to the code it tests: `app.ts` → `app.test.ts`.
- Only files matching `src/**/*.test.ts` are picked up (see `vitest.config.mts`).

## Testing routes

Routes are defined in `src/app.ts`. `src/index.ts` only starts the server.
This split lets tests call the app directly with `app.request()`, with no running server and no open port:

```ts
import { describe, expect, it } from "vitest";
import { app } from "./app";

describe("GET /api/health", () => {
  it("returns status 200", async () => {
    const response = await app.request("/api/health");

    expect(response.status).toBe(200);
  });
});
```

Sending a body:

```ts
const response = await app.request("/api/projects", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "Garage" }),
});
```

Always import `app` from `./app`, never from `./index` – importing `index.ts` starts a real server.

## What to test

For every route, cover at least:

- **The happy path** – correct status code and response body.
- **Invalid input** – missing fields, wrong types, empty strings → expect `400`.
- **Not found** – ids that don't exist → expect `404`.
- **Boundary values** – empty lists, zero, very long strings, where relevant.

For plain functions (helpers, calculations, validation), test them directly without going through a route.

## How to write tests

- One behavior per test, following **Arrange → Act → Assert** with a blank line between each part.
- Test names describe the expected behavior: `it("returns 404 when the project does not exist")`.
- Group related tests with `describe`, usually one block per route (`describe("POST /api/projects")`).
- Assert on what the client sees (status, body, headers), not on internal details.
- Tests must be independent: they must not depend on the order they run in or on state left by another test.

## Things to avoid

- **Real network calls or external services.** Mock them with `vi.mock()` or `vi.fn()`.
- **Time-dependent assertions.** Don't compare against `new Date()`. Check the format, or freeze time with `vi.useFakeTimers()` and `vi.setSystemTime()`.
- **Shared mutable state between tests.** Reset it in `beforeEach` if needed.
- **Skipped tests** (`it.skip`, `it.only`) left in committed code.

## Bug fixes

Every bug fix starts with a test that fails because of the bug. Fix the code, then check that the test passes.
