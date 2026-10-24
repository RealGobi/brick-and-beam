import { describe, expect, it } from "vitest";
import { MAX_SERVICE_INTERVAL_MONTHS, validateNewProduct } from "./validateNewProduct";

const intervalError = `serviceIntervalMonths måste vara ett heltal mellan 1 och ${MAX_SERVICE_INTERVAL_MONTHS}`;

function errorFor(body: unknown) {
  const result = validateNewProduct(body);
  return result.ok ? undefined : result.error;
}

describe("validateNewProduct", () => {
  it("accepts a product with every field set", () => {
    const input = {
      name: "Värmepump",
      description: "Luft/vatten",
      manufacturer: "Nibe",
      model: "F2120",
      serialNumber: "SN-12345",
      location: "Pannrummet",
      purchaseDate: "2024-05-01",
      warrantyUntil: "2029-05-01",
      serviceIntervalMonths: 12,
    };

    expect(validateNewProduct(input)).toEqual({ ok: true, value: input });
  });

  it("fills in defaults when only a name is given", () => {
    expect(validateNewProduct({ name: "Brandvarnare" })).toEqual({
      ok: true,
      value: {
        name: "Brandvarnare",
        description: "",
        manufacturer: "",
        model: "",
        serialNumber: "",
        location: "",
        purchaseDate: null,
        warrantyUntil: null,
        serviceIntervalMonths: null,
      },
    });
  });

  it("trims the text fields", () => {
    const result = validateNewProduct({ name: " Diskmaskin ", manufacturer: " Bosch ", location: " Köket " });

    expect(result.ok && [result.value.name, result.value.manufacturer, result.value.location]).toEqual([
      "Diskmaskin",
      "Bosch",
      "Köket",
    ]);
  });

  it("requires a name", () => {
    expect(errorFor({ manufacturer: "Nibe" })).toBe("name krävs");
  });

  it("rejects text fields that are not text", () => {
    expect(errorFor({ name: "X", model: 2120 })).toBe("model måste vara text");
    expect(errorFor({ name: "X", serialNumber: "a".repeat(201) })).toBe("serialNumber får vara högst 200 tecken");
  });

  it("accepts the shortest and longest service interval", () => {
    expect(errorFor({ name: "X", serviceIntervalMonths: 1 })).toBeUndefined();
    expect(errorFor({ name: "X", serviceIntervalMonths: MAX_SERVICE_INTERVAL_MONTHS })).toBeUndefined();
  });

  it("rejects a zero, negative, decimal, too long or text interval", () => {
    expect(errorFor({ name: "X", serviceIntervalMonths: 0 })).toBe(intervalError);
    expect(errorFor({ name: "X", serviceIntervalMonths: -6 })).toBe(intervalError);
    expect(errorFor({ name: "X", serviceIntervalMonths: 1.5 })).toBe(intervalError);
    expect(errorFor({ name: "X", serviceIntervalMonths: MAX_SERVICE_INTERVAL_MONTHS + 1 })).toBe(intervalError);
    expect(errorFor({ name: "X", serviceIntervalMonths: "12" })).toBe(intervalError);
  });

  it("rejects a date that does not exist", () => {
    expect(errorFor({ name: "X", purchaseDate: "2026-02-30" })).toBe(
      "purchaseDate måste vara ett datum i formatet ÅÅÅÅ-MM-DD",
    );
  });

  it("accepts a warranty that ends the day it was bought, but not before", () => {
    expect(errorFor({ name: "X", purchaseDate: "2026-01-10", warrantyUntil: "2026-01-10" })).toBeUndefined();
    expect(errorFor({ name: "X", purchaseDate: "2026-01-10", warrantyUntil: "2026-01-09" })).toBe(
      "warrantyUntil får inte vara före purchaseDate",
    );
  });

  it("rejects a body that is not an object", () => {
    expect(errorFor(null)).toBe("Body måste vara ett JSON-objekt");
  });
});
