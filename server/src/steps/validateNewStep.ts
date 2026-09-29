import {
  invalid,
  isObject,
  valid,
  validateChoice,
  validateDate,
  validateDescription,
  validateName,
  type Result,
} from "../validation";
import type { NewStep, StepStatus } from "./stepStore";

const statuses: readonly StepStatus[] = ["ongoing", "done"];

/**
 * Checks the request body for a new step.
 * Text is trimmed. Left-out fields get defaults: empty description, status "ongoing" and no date.
 */
export function validateNewStep(body: unknown): Result<NewStep> {
  if (!isObject(body)) return invalid("Body måste vara ett JSON-objekt");

  const name = validateName(body.name);
  if (!name.ok) return name;
  const description = validateDescription(body.description);
  if (!description.ok) return description;
  const status = validateChoice(body.status, "status", statuses, "ongoing");
  if (!status.ok) return status;
  const date = validateDate(body.date, "date");
  if (!date.ok) return date;

  return valid({ name: name.value, description: description.value, status: status.value, date: date.value });
}
