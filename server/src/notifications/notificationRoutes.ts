import { Hono } from "hono";
import { listProducts } from "../products/productStore";
import { listDueReminders } from "../reminders/reminderStore";
import { REMINDER_DAYS_AHEAD, addDays, buildNotifications, todayIso } from "./buildNotifications";

/** GET /api/notifications: everything that needs attention soon, soonest first. */
export const notificationRoutes = new Hono();

notificationRoutes.get("/", async (c) => {
  const today = todayIso();
  const [products, reminders] = await Promise.all([
    listProducts(),
    listDueReminders(addDays(today, REMINDER_DAYS_AHEAD)),
  ]);

  return c.json(buildNotifications(products, reminders, today));
});
