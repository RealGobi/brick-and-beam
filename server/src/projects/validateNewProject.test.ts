import { describe, expect, it } from "vitest";
import {
  MAX_BUDGET,
  MAX_DESCRIPTION_LENGTH,
  MAX_NAME_LENGTH,
  validateNewProject,
} from "./validateNewProject";

const dateError = (field: string) => `${field} måste vara ett datum i formatet ÅÅÅÅ-MM-DD`;
const budgetError = "budget måste vara ett heltal som är 0 eller större";

// Returns the error message, or undefined when the input is valid
function errorFor(body: unknown) {
  const result = validateNewProject(body);
  return result.ok ? undefined : result.error;
}

describe("validateNewProject", () => {
  it("accepts a project with every field set", () => {
    const input = {
      name: "Nytt badrum",
      description: "Byta kakel",
      status: "ongoing",
      startDate: "2026-09-01",
      endDate: "2026-10-15",
      budget: 85000,
    };

    const result = validateNewProject(input);

    expect(result).toEqual({ ok: true, value: input });
  });

  it("fills in defaults when only a name is given", () => {
    const result = validateNewProject({ name: "Altan" });

    expect(result).toEqual({
      ok: true,
      value: { name: "Altan", description: "", status: "planned", startDate: null, endDate: null, budget: null },
    });
  });

  it("trims whitespace around name and description", () => {
    const result = validateNewProject({ name: "  Kök  ", description: "  Nya luckor \n" });

    expect(result.ok && result.value.name).toBe("Kök");
    expect(result.ok && result.value.description).toBe("Nya luckor");
  });

  it("rejects a body that is not an object", () => {
    expect(errorFor(undefined)).toBe("Body måste vara ett JSON-objekt");
    expect(errorFor(null)).toBe("Body måste vara ett JSON-objekt");
    expect(errorFor("Garage")).toBe("Body måste vara ett JSON-objekt");
  });
});

describe("validateNewProject: name", () => {
  it("rejects a missing, empty or non-text name", () => {
    expect(errorFor({})).toBe("name krävs");
    expect(errorFor({ name: "   " })).toBe("name krävs");
    expect(errorFor({ name: 42 })).toBe("name krävs");
  });

  it("accepts a name of exactly the maximum length", () => {
    expect(errorFor({ name: "a".repeat(MAX_NAME_LENGTH) })).toBeUndefined();
  });

  it("rejects a name longer than the maximum length", () => {
    const name = "a".repeat(MAX_NAME_LENGTH + 1);

    expect(errorFor({ name })).toBe(`name får vara högst ${MAX_NAME_LENGTH} tecken`);
  });
});

describe("validateNewProject: description", () => {
  it("rejects a description that is not text", () => {
    expect(errorFor({ name: "Tak", description: 5 })).toBe("description måste vara text");
  });

  it("rejects a description longer than the maximum length", () => {
    const description = "a".repeat(MAX_DESCRIPTION_LENGTH + 1);

    expect(errorFor({ name: "Tak", description })).toBe(
      `description får vara högst ${MAX_DESCRIPTION_LENGTH} tecken`,
    );
  });
});

describe("validateNewProject: status", () => {
  it("rejects an unknown status", () => {
    expect(errorFor({ name: "Tak", status: "paused" })).toBe("status måste vara planned, ongoing eller done");
  });
});

describe("validateNewProject: dates", () => {
  it("treats an empty string or null as no date", () => {
    const result = validateNewProject({ name: "Tak", startDate: "", endDate: null });

    expect(result.ok && [result.value.startDate, result.value.endDate]).toEqual([null, null]);
  });

  it("rejects dates in the wrong format", () => {
    expect(errorFor({ name: "Tak", startDate: "1/9/2026" })).toBe(dateError("startDate"));
    expect(errorFor({ name: "Tak", endDate: "2026-09-01T10:00" })).toBe(dateError("endDate"));
  });

  it("rejects a date that does not exist", () => {
    expect(errorFor({ name: "Tak", startDate: "2026-02-30" })).toBe(dateError("startDate"));
  });

  it("accepts the same start and end date", () => {
    expect(errorFor({ name: "Tak", startDate: "2026-09-01", endDate: "2026-09-01" })).toBeUndefined();
  });

  it("rejects an end date before the start date", () => {
    const body = { name: "Tak", startDate: "2026-09-02", endDate: "2026-09-01" };

    expect(errorFor(body)).toBe("endDate får inte vara före startDate");
  });
});

describe("validateNewProject: budget", () => {
  it("accepts zero and the maximum budget", () => {
    expect(errorFor({ name: "Tak", budget: 0 })).toBeUndefined();
    expect(errorFor({ name: "Tak", budget: MAX_BUDGET })).toBeUndefined();
  });

  it("rejects negative, decimal, too large or non-number budgets", () => {
    expect(errorFor({ name: "Tak", budget: -1 })).toBe(budgetError);
    expect(errorFor({ name: "Tak", budget: 99.5 })).toBe(budgetError);
    expect(errorFor({ name: "Tak", budget: MAX_BUDGET + 1 })).toBe(budgetError);
    expect(errorFor({ name: "Tak", budget: "5000" })).toBe(budgetError);
  });
});
