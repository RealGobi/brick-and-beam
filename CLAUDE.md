# CLAUDE.md

Guidelines for Claude Code in this project.

## Code style

- Write code that is **good but easy to understand**. Readability over clever solutions.
- Use clear, descriptive names for variables, functions and files.
- Keep functions small and focused on one thing.
- Avoid unnecessary abstraction. Don't add layers, patterns or dependencies that aren't needed right now.
- Prefer simple, straightforward logic over nested conditionals. Use early returns where it makes the code clearer.
- Follow existing patterns and conventions in the codebase.

## File size

- Keep files **under 200–250 lines**.
- If a file grows beyond that, split it into smaller modules with clear responsibilities.
- Each file should have a clear purpose that can be described in one sentence.

## Comments

- All comments are written in **English**.
- Comment **where needed**, not everywhere:
  - Explain *why* something is done, not *what* the code does when it's already obvious.
  - Comment non-obvious logic, workarounds and important assumptions.
  - Use JSDoc/TSDoc for exported functions where it helps understanding.
- Remove commented-out code and outdated comments.

```ts
// Bad: increments i
i++;

// Good: skip the header row, it contains column names
i++;
```

## Testing with Vitest

- All tests are written with **Vitest**.
- New functionality must have tests. Bug fixes must include a test that proves the bug is fixed.
- Place test files next to the code they test, named `*.test.ts` (or `*.test.js`).
- Write clear test names that describe expected behavior, e.g. `it("returns 0 when the list is empty")`.
- Keep tests simple: one thing per test, following Arrange → Act → Assert.
- Test both normal cases and edge cases (empty values, errors, boundary values).
- Server-specific testing guidelines: @server/TESTING.md
- Frontend-specific testing guidelines: @web/TESTING.md

### Commands

```bash
npx vitest                  # run tests in watch mode
npx vitest run              # run all tests once
npx vitest run --coverage   # run tests with coverage report
```

## Workflow

1. Understand the task and read relevant existing code before changing anything.
2. Make small, focused changes.
3. Write or update tests.
4. Run `npx vitest run` and make sure **all tests pass** before considering the task done.
5. Check that no file has grown beyond 250 lines.
