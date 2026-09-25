// Adds DOM matchers like toBeInTheDocument() to expect
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Unmount rendered components so tests don't leak DOM into each other
afterEach(() => {
  cleanup();
});
