// Must match the check constraint in sql/migrations/005_expense_category.sql
export const expenseCategories = ["purchase", "carpenter", "electrician", "plumber", "painter", "other"] as const;

/** "purchase" is something bought in a store, the others are work by a company or craftsman */
export type ExpenseCategory = (typeof expenseCategories)[number];
