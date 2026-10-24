import { invalid, isObject, valid, validateDate, validateDescription, validateName, type Result } from "../validation";
import type { NewReminder } from "./reminderStore";

/** Checks the request body for a new reminder. Title and due date are required, the note is optional. */
export function validateNewReminder(body: unknown): Result<NewReminder> {
  if (!isObject(body)) return invalid("Body måste vara ett JSON-objekt");

  const title = validateName(body.title, "title");
  if (!title.ok) return title;
  const dueDate = validateDate(body.dueDate, "dueDate");
  if (!dueDate.ok) return dueDate;
  if (dueDate.value === null) return invalid("dueDate krävs");
  const note = validateDescription(body.note, "note");
  if (!note.ok) return note;

  return valid({ title: title.value, dueDate: dueDate.value, note: note.value });
}

/** Checks the body of a change to a reminder: the same fields as a new one, plus whether it is done. */
export function validateReminderChanges(body: unknown): Result<NewReminder & { done: boolean }> {
  const reminder = validateNewReminder(body);
  if (!reminder.ok) return reminder;

  const done = isObject(body) ? body.done : undefined;
  if (typeof done !== "boolean") return invalid("done måste vara true eller false");

  return valid({ ...reminder.value, done });
}
