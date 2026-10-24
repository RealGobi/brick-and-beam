import { describe, expect, it } from "vitest";
import { validateNewReminder, validateReminderChanges } from "./validateNewReminder";

function errorFor(body: unknown) {
  const result = validateNewReminder(body);
  return result.ok ? undefined : result.error;
}

describe("validateNewReminder", () => {
  it("accepts a reminder with every field set, trimmed", () => {
    expect(validateNewReminder({ title: " Byt batteri ", dueDate: "2026-11-01", note: " 9V " })).toEqual({
      ok: true,
      value: { title: "Byt batteri", dueDate: "2026-11-01", note: "9V" },
    });
  });

  it("leaves the note empty when it is left out", () => {
    const result = validateNewReminder({ title: "Byt batteri", dueDate: "2026-11-01" });

    expect(result.ok && result.value.note).toBe("");
  });

  it("requires a title and a due date", () => {
    expect(errorFor({ dueDate: "2026-11-01" })).toBe("title krävs");
    expect(errorFor({ title: "Byt batteri" })).toBe("dueDate krävs");
  });

  it("rejects a date that does not exist and a note that is not text", () => {
    expect(errorFor({ title: "X", dueDate: "2026-02-30" })).toBe("dueDate måste vara ett datum i formatet ÅÅÅÅ-MM-DD");
    expect(errorFor({ title: "X", dueDate: "2026-11-01", note: 9 })).toBe("note måste vara text");
  });
});

describe("validateReminderChanges", () => {
  it("accepts done as true or false", () => {
    const base = { title: "Byt batteri", dueDate: "2026-11-01" };

    expect(validateReminderChanges({ ...base, done: true })).toMatchObject({ ok: true, value: { done: true } });
    expect(validateReminderChanges({ ...base, done: false })).toMatchObject({ ok: true, value: { done: false } });
  });

  it("rejects done that is not a boolean", () => {
    expect(validateReminderChanges({ title: "X", dueDate: "2026-11-01", done: "ja" })).toEqual({
      ok: false,
      error: "done måste vara true eller false",
    });
  });
});
