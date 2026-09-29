import { describe, expect, it } from "vitest";
import { validateNewStep } from "./validateNewStep";

function errorFor(body: unknown) {
  const result = validateNewStep(body);
  return result.ok ? undefined : result.error;
}

describe("validateNewStep", () => {
  it("accepts a step with every field set", () => {
    const input = { name: "Riva kakel", description: "Hela väggen", status: "done", date: "2026-09-05" };

    expect(validateNewStep(input)).toEqual({ ok: true, value: input });
  });

  it("fills in defaults when only a name is given", () => {
    expect(validateNewStep({ name: "Ny dusch" })).toEqual({
      ok: true,
      value: { name: "Ny dusch", description: "", status: "ongoing", date: null },
    });
  });

  it("trims the name and description", () => {
    const result = validateNewStep({ name: "  Måla  ", description: " Två lager " });

    expect(result.ok && [result.value.name, result.value.description]).toEqual(["Måla", "Två lager"]);
  });

  it("rejects a missing name", () => {
    expect(errorFor({ description: "Utan namn" })).toBe("name krävs");
  });

  it("only allows the step statuses ongoing and done", () => {
    expect(errorFor({ name: "Måla", status: "planned" })).toBe("status måste vara ongoing eller done");
  });

  it("rejects a date that does not exist", () => {
    expect(errorFor({ name: "Måla", date: "2026-13-01" })).toBe("date måste vara ett datum i formatet ÅÅÅÅ-MM-DD");
  });

  it("rejects a body that is not an object", () => {
    expect(errorFor(null)).toBe("Body måste vara ett JSON-objekt");
    expect(errorFor([{ name: "Måla" }])).toBe("Body måste vara ett JSON-objekt");
  });
});
