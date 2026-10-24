import {
  invalid,
  isObject,
  valid,
  validateDate,
  validateDescription,
  validateName,
  validateShortText,
  type Result,
} from "../validation";
import type { NewServiceEntry } from "./serviceStore";

// Largest value a Postgres integer column can hold
export const MAX_COST = 2_147_483_647;

function validateCost(value: unknown): Result<number | null> {
  if (value === undefined || value === null) return valid(null);
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > MAX_COST) {
    return invalid("cost måste vara ett heltal som är 0 eller större");
  }
  return valid(value);
}

/**
 * Checks the request body for a documented service. Name and date are required;
 * description, who did it and the cost are optional.
 */
export function validateNewService(body: unknown): Result<NewServiceEntry> {
  if (!isObject(body)) return invalid("Body måste vara ett JSON-objekt");

  const name = validateName(body.name);
  if (!name.ok) return name;
  const description = validateDescription(body.description);
  if (!description.ok) return description;
  const performedOn = validateDate(body.performedOn, "performedOn");
  if (!performedOn.ok) return performedOn;
  if (performedOn.value === null) return invalid("performedOn krävs");
  const performedBy = validateShortText(body.performedBy, "performedBy");
  if (!performedBy.ok) return performedBy;
  const cost = validateCost(body.cost);
  if (!cost.ok) return cost;

  return valid({
    name: name.value,
    description: description.value,
    performedOn: performedOn.value,
    performedBy: performedBy.value,
    cost: cost.value,
  });
}
