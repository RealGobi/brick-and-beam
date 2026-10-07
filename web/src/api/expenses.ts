import { errorFromResponse, expectSuccess } from './projects'

export const expenseCategories = ['purchase', 'carpenter', 'electrician', 'plumber', 'painter', 'other'] as const

/** "purchase" is something bought in a store, the others are work by a company or craftsman */
export type ExpenseCategory = (typeof expenseCategories)[number]

export function isExpenseCategory(value: unknown): value is ExpenseCategory {
    return expenseCategories.some((category) => category === value)
}

/** An expense in a project, as returned by the API. The date is "YYYY-MM-DD" or null. */
export type Expense = {
    id: string
    projectId: string
    /** The step the expense belongs to, or null for costs of the whole project */
    stepId: string | null
    category: ExpenseCategory
    /** Where it was bought, or the company that did the work. Empty when not given. */
    supplier: string
    description: string
    /** Whole kronor */
    amount: number
    date: string | null
    createdAt: string
}

export type NewExpenseInput = Pick<Expense, 'stepId' | 'category' | 'supplier' | 'description' | 'amount' | 'date'>

const isStringOrNull = (value: unknown) => typeof value === 'string' || value === null

function isExpense(value: unknown): value is Expense {
    if (typeof value !== 'object' || value === null) return false

    const expense = value as Record<string, unknown>
    return (
        typeof expense.id === 'string' &&
        typeof expense.projectId === 'string' &&
        isStringOrNull(expense.stepId) &&
        isExpenseCategory(expense.category) &&
        typeof expense.supplier === 'string' &&
        typeof expense.description === 'string' &&
        typeof expense.amount === 'number' &&
        isStringOrNull(expense.date) &&
        typeof expense.createdAt === 'string'
    )
}

/** Fetches the expenses of a project in date order. */
export async function fetchExpenses(projectId: string): Promise<Expense[]> {
    const response = await fetch(`/api/projects/${projectId}/expenses`)
    if (!response.ok) throw await errorFromResponse(response)

    const body: unknown = await response.json()
    if (!Array.isArray(body) || !body.every(isExpense)) throw new Error('Oväntat svar från servern')

    return body
}

/** Adds an expense to a project and returns it as saved by the server. */
export async function createExpense(projectId: string, input: NewExpenseInput): Promise<Expense> {
    const response = await fetch(`/api/projects/${projectId}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
    })
    if (!response.ok) throw await errorFromResponse(response)

    const body: unknown = await response.json()
    if (!isExpense(body)) throw new Error('Oväntat svar från servern')

    return body
}

/** Changes some fields of an expense. Fields left out keep their saved value. */
export async function updateExpense(expenseId: string, changes: Partial<NewExpenseInput>): Promise<Expense> {
    const response = await fetch(`/api/expenses/${expenseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes),
    })
    if (!response.ok) throw await errorFromResponse(response)

    const body: unknown = await response.json()
    if (!isExpense(body)) throw new Error('Oväntat svar från servern')

    return body
}

/** Deletes an expense. */
export async function deleteExpense(expenseId: string): Promise<void> {
    await expectSuccess(await fetch(`/api/expenses/${expenseId}`, { method: 'DELETE' }))
}
