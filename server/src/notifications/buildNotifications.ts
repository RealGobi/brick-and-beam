import type { Product } from "../products/productStore";
import type { DueReminder } from "../reminders/reminderStore";

/** Something that needs attention soon, shown in the bell and on the dashboard. */
export type Notification = {
  /** Unique across all kinds, e.g. "service-<product id>" */
  key: string;
  kind: "reminder" | "service" | "warranty";
  productId: string;
  productName: string;
  title: string;
  /** "YYYY-MM-DD" */
  date: string;
  /** True when the date has passed */
  overdue: boolean;
};

// How far ahead things show up
export const SERVICE_DAYS_AHEAD = 14;
export const REMINDER_DAYS_AHEAD = 14;
export const WARRANTY_DAYS_AHEAD = 30;

/** Adds days to a "YYYY-MM-DD" date. */
export function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Today as "YYYY-MM-DD" in the server's own time zone. */
export function todayIso(now = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/**
 * Collects what needs attention, soonest first. ISO dates compare correctly as strings.
 * - Reminders that are due within REMINDER_DAYS_AHEAD days or overdue (the caller passes only active ones)
 * - Regular services due within SERVICE_DAYS_AHEAD days or overdue
 * - Warranties that run out within WARRANTY_DAYS_AHEAD days, but not those already expired
 */
export function buildNotifications(products: Product[], reminders: DueReminder[], today: string): Notification[] {
  const notifications: Notification[] = [];

  for (const reminder of reminders) {
    if (reminder.dueDate > addDays(today, REMINDER_DAYS_AHEAD)) continue;
    notifications.push({
      key: `reminder-${reminder.id}`,
      kind: "reminder",
      productId: reminder.productId,
      productName: reminder.productName,
      title: reminder.title,
      date: reminder.dueDate,
      overdue: reminder.dueDate < today,
    });
  }

  for (const product of products) {
    const next = product.nextServiceDate;
    if (next && next <= addDays(today, SERVICE_DAYS_AHEAD)) {
      notifications.push({
        key: `service-${product.id}`,
        kind: "service",
        productId: product.id,
        productName: product.name,
        title: "Dags för service",
        date: next,
        overdue: next < today,
      });
    }

    const warranty = product.warrantyUntil;
    if (warranty && warranty >= today && warranty <= addDays(today, WARRANTY_DAYS_AHEAD)) {
      notifications.push({
        key: `warranty-${product.id}`,
        kind: "warranty",
        productId: product.id,
        productName: product.name,
        title: "Garantin går ut",
        date: warranty,
        overdue: false,
      });
    }
  }

  return notifications.sort((a, b) => a.date.localeCompare(b.date));
}
