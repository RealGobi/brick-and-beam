import { describe, expect, it } from "vitest";
import { MAX_AMOUNT, validateNewExpense } from "./validateNewExpense";

const stepId = "1f2e3d4c-5b6a-4978-8695-a4b3c2d1e0f9";
const amountError = "amount måste vara ett heltal större än 0";

function errorFor(body: unknown) {
  const result = validateNewExpense(body);
  return result.ok ? undefined : result.error;
}

describe("validateNewExpense", () => {
  it("accepts an expense with every field set", () => {
    const input = {
      description: "Kakel",
      amount: 12000,
      date: "2026-10-01",
      stepId,
      category: "purchase",
      supplier: "Bauhaus",
    };

    expect(validateNewExpense(input)).toEqual({ ok: true, value: input });
  });

  it("uses defaults for the optional fields when they are left out", () => {
    expect(validateNewExpense({ description: "Container", amount: 3500 })).toEqual({
      ok: true,
      value: { description: "Container", amount: 3500, date: null, stepId: null, category: "other", supplier: "" },
    });
  });

  it("accepts each category", () => {
    for (const category of ["purchase", "carpenter", "electrician", "plumber", "painter", "other"]) {
      expect(errorFor({ description: "X", amount: 1, category })).toBeUndefined();
    }
  });

  it("rejects an unknown category", () => {
    expect(errorFor({ description: "X", amount: 1, category: "gardener" })).toBe(
      "category måste vara purchase, carpenter, electrician, plumber, painter eller other",
    );
  });

  it("trims the supplier and rejects one that is not text or too long", () => {
    const result = validateNewExpense({ description: "X", amount: 1, supplier: "  Bauhaus  " });

    expect(result.ok && result.value.supplier).toBe("Bauhaus");
    expect(errorFor({ description: "X", amount: 1, supplier: 5 })).toBe("supplier måste vara text");
    expect(errorFor({ description: "X", amount: 1, supplier: "a".repeat(201) })).toBe("supplier får vara högst 200 tecken");
  });

  it("trims the description and treats an empty step as no step", () => {
    const result = validateNewExpense({ description: "  Färg  ", amount: 900, stepId: "" });

    expect(result.ok && [result.value.description, result.value.stepId]).toEqual(["Färg", null]);
  });

  it("requires a description", () => {
    expect(errorFor({ amount: 100 })).toBe("description krävs");
    expect(errorFor({ description: "   ", amount: 100 })).toBe("description krävs");
  });

  it("accepts 1 kr and the maximum amount", () => {
    expect(errorFor({ description: "Skruv", amount: 1 })).toBeUndefined();
    expect(errorFor({ description: "Allt", amount: MAX_AMOUNT })).toBeUndefined();
  });

  it("rejects zero, negative, decimal, too large or missing amounts", () => {
    expect(errorFor({ description: "X", amount: 0 })).toBe(amountError);
    expect(errorFor({ description: "X", amount: -50 })).toBe(amountError);
    expect(errorFor({ description: "X", amount: 99.5 })).toBe(amountError);
    expect(errorFor({ description: "X", amount: MAX_AMOUNT + 1 })).toBe(amountError);
    expect(errorFor({ description: "X", amount: "500" })).toBe(amountError);
    expect(errorFor({ description: "X" })).toBe(amountError);
  });

  it("rejects a date that does not exist", () => {
    expect(errorFor({ description: "X", amount: 1, date: "2026-02-30" })).toBe(
      "date måste vara ett datum i formatet ÅÅÅÅ-MM-DD",
    );
  });

  it("rejects a step id that is not a uuid", () => {
    expect(errorFor({ description: "X", amount: 1, stepId: "abc" })).toBe("stepId är inte ett giltigt steg");
  });

  it("rejects a body that is not an object", () => {
    expect(errorFor(null)).toBe("Body måste vara ett JSON-objekt");
  });
});
