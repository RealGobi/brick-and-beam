import { Hono } from "hono";
import { getProduct } from "../products/productStore";
import { isObject, isUuid } from "../validation";
import { createReminder, deleteReminder, getReminder, listReminders, updateReminder } from "./reminderStore";
import { validateNewReminder, validateReminderChanges } from "./validateNewReminder";

/** Routes for the reminders of a product, mounted under /api. */
export const reminderRoutes = new Hono();

const productNotFound = { error: "Produkten finns inte" };
const reminderNotFound = { error: "Påminnelsen finns inte" };

// Checking the format first avoids a database error for ids like "abc"
async function isExistingProduct(productId: string): Promise<boolean> {
  return isUuid(productId) && (await getProduct(productId)) !== undefined;
}

reminderRoutes.get("/products/:productId/reminders", async (c) => {
  const productId = c.req.param("productId");
  if (!(await isExistingProduct(productId))) return c.json(productNotFound, 404);

  return c.json(await listReminders(productId));
});

reminderRoutes.post("/products/:productId/reminders", async (c) => {
  const productId = c.req.param("productId");
  if (!(await isExistingProduct(productId))) return c.json(productNotFound, 404);

  // c.req.json() throws on malformed JSON, which is the client's fault, not a server error
  const body: unknown = await c.req.json().catch(() => undefined);
  const result = validateNewReminder(body);
  if (!result.ok) return c.json({ error: result.error }, 400);

  return c.json(await createReminder(productId, result.value), 201);
});

reminderRoutes.patch("/reminders/:reminderId", async (c) => {
  const reminderId = c.req.param("reminderId");
  const existing = isUuid(reminderId) ? await getReminder(reminderId) : undefined;
  if (!existing) return c.json(reminderNotFound, 404);

  const body: unknown = await c.req.json().catch(() => undefined);
  if (!isObject(body)) return c.json({ error: "Body måste vara ett JSON-objekt" }, 400);

  // Fields left out keep their current value, e.g. { done: true } only marks it as done
  const { title, dueDate, note } = existing;
  const result = validateReminderChanges({ title, dueDate, note, done: existing.doneAt !== null, ...body });
  if (!result.ok) return c.json({ error: result.error }, 400);

  const reminder = await updateReminder(reminderId, result.value);
  if (!reminder) return c.json(reminderNotFound, 404);

  return c.json(reminder);
});

reminderRoutes.delete("/reminders/:reminderId", async (c) => {
  const reminderId = c.req.param("reminderId");
  const deleted = isUuid(reminderId) && (await deleteReminder(reminderId));
  if (!deleted) return c.json(reminderNotFound, 404);

  return c.body(null, 204);
});
