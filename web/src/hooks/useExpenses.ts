import { useCallback, useEffect, useState } from 'react'
import { fetchExpenses, type Expense } from '../api/expenses'

type ExpensesState = {
    expenses: Expense[]
    loading: boolean
    error: string | null
}

type UseExpensesResult = ExpensesState & {
    /** Adds a new expense or replaces an existing one with the same id, keeping date order. */
    saveExpense: (expense: Expense) => void
    removeExpense: (expenseId: string) => void
    /** Keeps the expenses of a deleted step, but without the link, like the server does. */
    unlinkStep: (stepId: string) => void
}

const initialState: ExpensesState = { expenses: [], loading: true, error: null }

// Same order as the server: by date, expenses without a date last, then by creation time
function compareExpenses(a: Expense, b: Expense): number {
    if (a.date !== b.date) {
        if (a.date === null) return 1
        if (b.date === null) return -1
        return a.date < b.date ? -1 : 1
    }
    return a.createdAt < b.createdAt ? -1 : 1
}

/** Loads the expenses of a project and keeps them updated as they change. */
export function useExpenses(projectId: string): UseExpensesResult {
    const [state, setState] = useState(initialState)

    useEffect(() => {
        // Ignore the result if the component unmounted before the request finished
        let ignore = false

        fetchExpenses(projectId)
            .then((expenses) => {
                if (!ignore) setState({ expenses, loading: false, error: null })
            })
            .catch((error: Error) => {
                if (!ignore) setState({ expenses: [], loading: false, error: error.message })
            })

        return () => {
            ignore = true
        }
    }, [projectId])

    const saveExpense = useCallback((expense: Expense) => {
        setState((previous) => {
            const otherExpenses = previous.expenses.filter((existing) => existing.id !== expense.id)
            return { ...previous, expenses: [...otherExpenses, expense].sort(compareExpenses) }
        })
    }, [])

    const removeExpense = useCallback((expenseId: string) => {
        setState((previous) => ({
            ...previous,
            expenses: previous.expenses.filter((expense) => expense.id !== expenseId),
        }))
    }, [])

    const unlinkStep = useCallback((stepId: string) => {
        setState((previous) => ({
            ...previous,
            expenses: previous.expenses.map((expense) =>
                expense.stepId === stepId ? { ...expense, stepId: null } : expense,
            ),
        }))
    }, [])

    return { ...state, saveExpense, removeExpense, unlinkStep }
}
