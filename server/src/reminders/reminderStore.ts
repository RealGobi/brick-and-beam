import { sql } from "../db";

/** A reminder the user added to a product, e.g. "Byt batteri i brandvarnaren". */
export type Reminder = {
  id: string;
  productId: string;
  title: string;
  /** "YYYY-MM-DD" */
  dueDate: string;
  note: string;
  /** When it was marked as done, or null while it is still active */
  doneAt: Date | null;
  createdAt: Date;
};

/** The fields a client provides when adding a reminder. */
export type NewReminder = Pick<Reminder, "title" | "dueDate" | "note">;

/** An active reminder together with the name of its product, for the notifications. */
export type DueReminder = Reminder & { productName: string };

const reminderColumns = sql`id, product_id, title, due_date, note, done_at, created_at`;

/** Returns the reminders of a product: active ones first by due date, then done ones, latest done first. */
export async function listReminders(productId: string): Promise<Reminder[]> {
  return sql<Reminder[]>`
    select ${reminderColumns}
    from reminders
    where product_id = ${productId}
    order by done_at is not null, due_date, done_at desc
  `;
}

/** Returns one reminder, or undefined when it does not exist. */
export async function getReminder(reminderId: string): Promise<Reminder | undefined> {
  const [reminder] = await sql<Reminder[]>`select ${reminderColumns} from reminders where id = ${reminderId}`;
  return reminder;
}

/** Saves a new reminder for a product and returns it. */
export async function createReminder(productId: string, reminder: NewReminder): Promise<Reminder> {
  const [created] = await sql<Reminder[]>`
    insert into reminders ${sql({ productId, ...reminder }, "productId", "title", "dueDate", "note")}
    returning ${reminderColumns}
  `;
  return created;
}

/**
 * Replaces the editable fields of a reminder and marks it as done or active again.
 * Keeps the original time when a reminder that is already done is saved again.
 * Returns undefined when it does not exist.
 */
export async function updateReminder(
  reminderId: string,
  changes: NewReminder & { done: boolean },
): Promise<Reminder | undefined> {
  const [reminder] = await sql<Reminder[]>`
    update reminders
    set
      title = ${changes.title},
      due_date = ${changes.dueDate},
      note = ${changes.note},
      done_at = case when ${changes.done} then coalesce(done_at, now()) else null end
    where id = ${reminderId}
    returning ${reminderColumns}
  `;
  return reminder;
}

/** Deletes a reminder. Returns false when it does not exist. */
export async function deleteReminder(reminderId: string): Promise<boolean> {
  const deleted = await sql`delete from reminders where id = ${reminderId} returning id`;
  return deleted.length > 0;
}

/** Active reminders of all products that are due on or before the given date. */
export async function listDueReminders(until: string): Promise<DueReminder[]> {
  return sql<DueReminder[]>`
    select r.id, r.product_id, r.title, r.due_date, r.note, r.done_at, r.created_at, p.name as product_name
    from reminders r
    join products p on p.id = r.product_id
    where r.done_at is null and r.due_date <= ${until}
    order by r.due_date
  `;
}
