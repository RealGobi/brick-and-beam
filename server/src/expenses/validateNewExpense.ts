import {
  MAX_NAME_LENGTH,
  invalid,
  isObject,
  isUuid,
  valid,
  validateChoice,
  validateDate,
  validateName,
  type Result,
} from "../validation";
import { expenseCategories } from "./expenseCategory";
import type { NewExpense } from "./expenseStore";

// Largest value a Postgres integer column can hold
export const MAX_AMOUNT = 2_147_483_647;

function validateAmount(value: unknown): Result<number> {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0 || value > MAX_AMOUNT) {
    return invalid("amount måste vara ett heltal större än 0");
  }
  return valid(value);
}

/** Optional, trimmed text. Missing becomes an empty string. */
function validateSupplier(value: unknown): Result<string> {
  if (value === undefined || value === null) return valid("");
  if (typeof value !== "string") return invalid("supplier måste vara text");

  const supplier = value.trim();
  if (supplier.length > MAX_NAME_LENGTH) return invalid(`supplier får vara högst ${MAX_NAME_LENGTH} tecken`);
  return valid(supplier);
}

function validateStepId(value: unknown): Result<string | null> {
  if (value === undefined || value === null || value === "") return valid(null);
  if (typeof value !== "string" || !isUuid(value)) return invalid("stepId är inte ett giltigt steg");
  return valid(value);
}

/**
 * Checks the request body for a new expense: a description, a positive amount in whole kronor,
 * and optionally a category (default "other"), a supplier, a date and the step it belongs to.
 * Whether the step is part of the project is checked by the route, since that needs the database.
 */
export function validateNewExpense(body: unknown): Result<NewExpense> {
  if (!isObject(body)) return invalid("Body måste vara ett JSON-objekt");

  const description = validateName(body.description, "description");
  if (!description.ok) return description;
  const amount = validateAmount(body.amount);
  if (!amount.ok) return amount;
  const date = validateDate(body.date, "date");
  if (!date.ok) return date;
  const stepId = validateStepId(body.stepId);
  if (!stepId.ok) return stepId;
  const category = validateChoice(body.category, "category", expenseCategories, "other");
  if (!category.ok) return category;
  const supplier = validateSupplier(body.supplier);
  if (!supplier.ok) return supplier;

  return valid({
    description: description.value,
    amount: amount.value,
    date: date.value,
    stepId: stepId.value,
    category: category.value,
    supplier: supplier.value,
  });
}
