import { describe, expect, it } from "vitest";
import { isObject, isUuid, validateChoice } from "./validation";

// Name, description and date are covered through validateNewProject and validateNewStep

describe("isUuid", () => {
  it("accepts a uuid in lower or upper case", () => {
    expect(isUuid("7c3e0f5a-1b2c-4d5e-8f90-123456789abc")).toBe(true);
    expect(isUuid("7C3E0F5A-1B2C-4D5E-8F90-123456789ABC")).toBe(true);
  });

  it("rejects anything that is not a uuid", () => {
    expect(isUuid("")).toBe(false);
    expect(isUuid("123")).toBe(false);
    expect(isUuid("7c3e0f5a-1b2c-4d5e-8f90-123456789abc-extra")).toBe(false);
  });
});

describe("isObject", () => {
  it("accepts a plain object", () => {
    expect(isObject({ name: "Tak" })).toBe(true);
  });

  it("rejects null, arrays and primitive values", () => {
    expect(isObject(null)).toBe(false);
    expect(isObject([])).toBe(false);
    expect(isObject("Tak")).toBe(false);
  });
});

describe("validateChoice", () => {
  const sizes = ["small", "medium", "large"] as const;

  it("returns the default when the value is missing", () => {
    expect(validateChoice(undefined, "size", sizes, "medium")).toEqual({ ok: true, value: "medium" });
  });

  it("accepts an allowed value", () => {
    expect(validateChoice("large", "size", sizes, "medium")).toEqual({ ok: true, value: "large" });
  });

  it("lists the allowed values when the value is not one of them", () => {
    expect(validateChoice("huge", "size", sizes, "medium")).toEqual({
      ok: false,
      error: "size måste vara small, medium eller large",
    });
  });

  it("lists two allowed values without a comma", () => {
    const result = validateChoice(null, "status", ["ongoing", "done"], "ongoing");

    expect(result).toEqual({ ok: false, error: "status måste vara ongoing eller done" });
  });
});
