/** Shared helpers for validating request bodies. Each validator returns the cleaned value or an error message. */

export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export const valid = <T>(value: T): Result<T> => ({ ok: true, value });
export const invalid = (error: string): { ok: false; error: string } => ({ ok: false, error });

export const MAX_NAME_LENGTH = 200;
export const MAX_DESCRIPTION_LENGTH = 5000;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Postgres rejects malformed ids with an error, so check them before querying. */
export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Required, trimmed text of at most MAX_NAME_LENGTH characters. The field name is used in error messages. */
export function validateName(value: unknown, field = "name"): Result<string> {
  if (typeof value !== "string" || value.trim() === "") return invalid(`${field} krävs`);

  const name = value.trim();
  if (name.length > MAX_NAME_LENGTH) return invalid(`${field} får vara högst ${MAX_NAME_LENGTH} tecken`);
  return valid(name);
}

/** Optional, trimmed text. Missing becomes an empty string. */
export function validateDescription(value: unknown): Result<string> {
  if (value === undefined || value === null) return valid("");
  if (typeof value !== "string") return invalid("description måste vara text");

  const description = value.trim();
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    return invalid(`description får vara högst ${MAX_DESCRIPTION_LENGTH} tecken`);
  }
  return valid(description);
}

/** Accepts one of the allowed values, or the default when the value is missing. */
export function validateChoice<T extends string>(
  value: unknown,
  field: string,
  allowed: readonly T[],
  defaultValue: T,
): Result<T> {
  if (value === undefined) return valid(defaultValue);

  const match = allowed.find((option) => option === value);
  if (match !== undefined) return valid(match);

  // "planned, ongoing eller done"
  const options = `${allowed.slice(0, -1).join(", ")} eller ${allowed[allowed.length - 1]}`;
  return invalid(`${field} måste vara ${options}`);
}

/** Accepts "YYYY-MM-DD" for a real calendar date. Missing or empty means no date. */
export function validateDate(value: unknown, field: string): Result<string | null> {
  if (value === undefined || value === null || value === "") return valid(null);

  const error = `${field} måste vara ett datum i formatet ÅÅÅÅ-MM-DD`;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return invalid(error);

  // Date rolls impossible dates over (2026-02-30 becomes 2026-03-02), so compare the result
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || !parsed.toISOString().startsWith(value)) return invalid(error);

  return valid(value);
}
