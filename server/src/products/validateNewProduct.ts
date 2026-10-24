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
import type { NewProduct } from "./productStore";

// Fifty years is plenty for anything in a house
export const MAX_SERVICE_INTERVAL_MONTHS = 600;

function validateServiceInterval(value: unknown): Result<number | null> {
  if (value === undefined || value === null) return valid(null);
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > MAX_SERVICE_INTERVAL_MONTHS) {
    return invalid(`serviceIntervalMonths måste vara ett heltal mellan 1 och ${MAX_SERVICE_INTERVAL_MONTHS}`);
  }
  return valid(value);
}

/**
 * Checks the request body for a new product. Only the name is required.
 * Text is trimmed, left-out text becomes empty and left-out dates and interval become null.
 */
export function validateNewProduct(body: unknown): Result<NewProduct> {
  if (!isObject(body)) return invalid("Body måste vara ett JSON-objekt");

  const name = validateName(body.name);
  if (!name.ok) return name;
  const description = validateDescription(body.description);
  if (!description.ok) return description;
  const manufacturer = validateShortText(body.manufacturer, "manufacturer");
  if (!manufacturer.ok) return manufacturer;
  const model = validateShortText(body.model, "model");
  if (!model.ok) return model;
  const serialNumber = validateShortText(body.serialNumber, "serialNumber");
  if (!serialNumber.ok) return serialNumber;
  const location = validateShortText(body.location, "location");
  if (!location.ok) return location;
  const purchaseDate = validateDate(body.purchaseDate, "purchaseDate");
  if (!purchaseDate.ok) return purchaseDate;
  const warrantyUntil = validateDate(body.warrantyUntil, "warrantyUntil");
  if (!warrantyUntil.ok) return warrantyUntil;
  const serviceIntervalMonths = validateServiceInterval(body.serviceIntervalMonths);
  if (!serviceIntervalMonths.ok) return serviceIntervalMonths;

  // ISO dates compare correctly as strings
  if (purchaseDate.value && warrantyUntil.value && warrantyUntil.value < purchaseDate.value) {
    return invalid("warrantyUntil får inte vara före purchaseDate");
  }

  return valid({
    name: name.value,
    description: description.value,
    manufacturer: manufacturer.value,
    model: model.value,
    serialNumber: serialNumber.value,
    location: location.value,
    purchaseDate: purchaseDate.value,
    warrantyUntil: warrantyUntil.value,
    serviceIntervalMonths: serviceIntervalMonths.value,
  });
}
