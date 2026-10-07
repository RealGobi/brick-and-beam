import { sql } from "../db";
import type { ExpenseCategory } from "./expenseCategory";

export type Expense = {
  id: string;
  projectId: string;
  /** The step the expense belongs to, or null for costs of the whole project */
  stepId: string | null;
  category: ExpenseCategory;
  /** Where it was bought, or the company that did the work. Empty when not given. */
  supplier: string;
  description: string;
  /** Whole kronor */
  amount: number;
  /** "YYYY-MM-DD", or null when not set */
  date: string | null;
  createdAt: Date;
};

/** The fields a client provides when adding an expense. */
export type NewExpense = Pick<Expense, "stepId" | "category" | "supplier" | "description" | "amount" | "date">;

const expenseColumns = sql`
  id, project_id, step_id, category, supplier, description, amount, date, created_at
`;

/** Returns the expenses of a project in date order. Expenses without a date come last. */
export async function listExpenses(projectId: string): Promise<Expense[]> {
  return sql<Expense[]>`
    select ${expenseColumns}
    from expenses
    where project_id = ${projectId}
    order by date nulls last, created_at
  `;
}

/** Saves a new expense for a project and returns it. */
export async function createExpense(projectId: string, newExpense: NewExpense): Promise<Expense> {
  const [expense] = await sql<Expense[]>`
    insert into expenses (project_id, step_id, category, supplier, description, amount, date)
    values (
      ${projectId},
      ${newExpense.stepId},
      ${newExpense.category},
      ${newExpense.supplier},
      ${newExpense.description},
      ${newExpense.amount},
      ${newExpense.date}
    )
    returning ${expenseColumns}
  `;
  return expense;
}

/** Returns one expense, or undefined when it does not exist. */
export async function getExpense(expenseId: string): Promise<Expense | undefined> {
  const [expense] = await sql<Expense[]>`select ${expenseColumns} from expenses where id = ${expenseId}`;
  return expense;
}

/** Replaces the editable fields of an expense. Returns undefined when it does not exist. */
export async function updateExpense(expenseId: string, changes: NewExpense): Promise<Expense | undefined> {
  const [expense] = await sql<Expense[]>`
    update expenses
    set
      step_id = ${changes.stepId},
      category = ${changes.category},
      supplier = ${changes.supplier},
      description = ${changes.description},
      amount = ${changes.amount},
      date = ${changes.date}
    where id = ${expenseId}
    returning ${expenseColumns}
  `;
  return expense;
}

/** Deletes an expense. Returns false when it does not exist. */
export async function deleteExpense(expenseId: string): Promise<boolean> {
  const deleted = await sql`delete from expenses where id = ${expenseId} returning id`;
  return deleted.length > 0;
}
