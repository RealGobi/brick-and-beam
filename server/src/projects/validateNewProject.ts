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
import type { NewProject, ProjectStatus } from "./projectStore";

export { MAX_DESCRIPTION_LENGTH, MAX_NAME_LENGTH } from "../validation";

// Largest value a Postgres integer column can hold
export const MAX_BUDGET = 2_147_483_647;

const statuses: readonly ProjectStatus[] = ["planned", "ongoing", "done"];

function validateBudget(value: unknown): Result<number | null> {
  if (value === undefined || value === null) return valid(null);
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > MAX_BUDGET) {
    return invalid("budget måste vara ett heltal som är 0 eller större");
  }
  return valid(value);
}

/**
 * Checks the request body for a new project.
 * Text is trimmed. Optional fields left out get their defaults: empty description,
 * status "planned", and null for dates and budget.
 */
export function validateNewProject(body: unknown): Result<NewProject> {
  if (!isObject(body)) return invalid("Body måste vara ett JSON-objekt");

  const name = validateName(body.name);
  if (!name.ok) return name;
  const description = validateDescription(body.description);
  if (!description.ok) return description;
  const status = validateChoice(body.status, "status", statuses, "planned");
  if (!status.ok) return status;
  const startDate = validateDate(body.startDate, "startDate");
  if (!startDate.ok) return startDate;
  const endDate = validateDate(body.endDate, "endDate");
  if (!endDate.ok) return endDate;
  const budget = validateBudget(body.budget);
  if (!budget.ok) return budget;

  // ISO dates compare correctly as strings
  if (startDate.value && endDate.value && endDate.value < startDate.value) {
    return invalid("endDate får inte vara före startDate");
  }

  return valid({
    name: name.value,
    description: description.value,
    status: status.value,
    startDate: startDate.value,
    endDate: endDate.value,
    budget: budget.value,
  });
}
