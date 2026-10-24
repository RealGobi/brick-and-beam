import { describe, expect, it } from "vitest";
import { MAX_COST, validateNewService } from "./validateNewService";

const costError = "cost måste vara ett heltal som är 0 eller större";

function errorFor(body: unknown) {
  const result = validateNewService(body);
  return result.ok ? undefined : result.error;
}

describe("validateNewService", () => {
  it("accepts a service with every field set", () => {
    const input = {
      name: "Filterbyte",
      description: "F7-filter",
      performedOn: "2026-03-01",
      performedBy: "Ventilationsteknik",
      cost: 1200,
    };

    expect(validateNewService(input)).toEqual({ ok: true, value: input });
  });

  it("fills in defaults for the optional fields", () => {
    expect(validateNewService({ name: "Filterbyte", performedOn: "2026-03-01" })).toEqual({
      ok: true,
      value: { name: "Filterbyte", description: "", performedOn: "2026-03-01", performedBy: "", cost: null },
    });
  });

  it("trims the name and who did it", () => {
    const result = validateNewService({ name: " Filterbyte ", performedOn: "2026-03-01", performedBy: " Firma AB " });

    expect(result.ok && [result.value.name, result.value.performedBy]).toEqual(["Filterbyte", "Firma AB"]);
  });

  it("requires a name and a date", () => {
    expect(errorFor({ performedOn: "2026-03-01" })).toBe("name krävs");
    expect(errorFor({ name: "Filterbyte" })).toBe("performedOn krävs");
    expect(errorFor({ name: "Filterbyte", performedOn: "" })).toBe("performedOn krävs");
  });

  it("rejects a date that does not exist", () => {
    expect(errorFor({ name: "X", performedOn: "2026-02-30" })).toBe("performedOn måste vara ett datum i formatet ÅÅÅÅ-MM-DD");
  });

  it("accepts a free service and the largest cost", () => {
    expect(errorFor({ name: "X", performedOn: "2026-03-01", cost: 0 })).toBeUndefined();
    expect(errorFor({ name: "X", performedOn: "2026-03-01", cost: MAX_COST })).toBeUndefined();
  });

  it("rejects negative, decimal, too large or text costs", () => {
    expect(errorFor({ name: "X", performedOn: "2026-03-01", cost: -1 })).toBe(costError);
    expect(errorFor({ name: "X", performedOn: "2026-03-01", cost: 9.5 })).toBe(costError);
    expect(errorFor({ name: "X", performedOn: "2026-03-01", cost: MAX_COST + 1 })).toBe(costError);
    expect(errorFor({ name: "X", performedOn: "2026-03-01", cost: "500" })).toBe(costError);
  });

  it("rejects a body that is not an object", () => {
    expect(errorFor(null)).toBe("Body måste vara ett JSON-objekt");
  });
});
