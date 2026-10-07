import { useState } from 'react'
import { deleteExpense, type Expense } from '../api/expenses'
import type { Step } from '../api/steps'
import { expenseCategoryLabels, formatAmount, formatDate } from '../utils/formatProject'
import { BudgetSummary } from './BudgetSummary'
import { ExpenseForm } from './ExpenseForm'
import './Expenses.css'

type ExpenseSectionProps = {
    projectId: string
    budget: number | null
    steps: Step[]
    expenses: Expense[]
    loading: boolean
    error: string | null
    /** Gets a new or edited expense */
    onSaved: (expense: Expense) => void
    onDeleted: (expenseId: string) => void
}

/** The budget summary, the list of expenses and a form for adding more. */
export function ExpenseSection(props: ExpenseSectionProps) {
    const { projectId, budget, steps, expenses, loading, error, onSaved, onDeleted } = props
    const [showForm, setShowForm] = useState(false)
    const spent = expenses.reduce((sum, expense) => sum + expense.amount, 0)

    function handleSaved(expense: Expense) {
        onSaved(expense)
        setShowForm(false)
    }

    return (
        <section className="expense-section">
            <div className="section-head">
                <h2>Budget och kostnader</h2>
                {!showForm && !loading && !error && (
                    <button type="button" className="button button-primary" onClick={() => setShowForm(true)}>
                        + Lägg till kostnad
                    </button>
                )}
            </div>

            {loading && <p className="empty">Hämtar kostnader…</p>}
            {error && <p className="form-error" role="alert">Kunde inte hämta kostnaderna. {error}</p>}

            {!loading && !error && (
                <>
                    <BudgetSummary budget={budget} spent={spent} />
                    {showForm && (
                        <ExpenseForm projectId={projectId} steps={steps} onSaved={handleSaved} onCancel={() => setShowForm(false)} />
                    )}
                    {expenses.length === 0 && !showForm && <p className="empty">Inga kostnader än.</p>}
                    {expenses.length > 0 && (
                        <ul className="expense-list">
                            {expenses.map((expense) => (
                                <ExpenseRow
                                    key={expense.id}
                                    projectId={projectId}
                                    expense={expense}
                                    steps={steps}
                                    onSaved={onSaved}
                                    onDeleted={onDeleted}
                                />
                            ))}
                        </ul>
                    )}
                </>
            )}
        </section>
    )
}

type ExpenseRowProps = {
    projectId: string
    expense: Expense
    steps: Step[]
    onSaved: (expense: Expense) => void
    onDeleted: (expenseId: string) => void
}

function ExpenseRow({ projectId, expense, steps, onSaved, onDeleted }: ExpenseRowProps) {
    const [editing, setEditing] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const stepName = steps.find((step) => step.id === expense.stepId)?.name ?? 'Hela projektet'
    // "Inköp: Bauhaus · Riva kakel · 1 okt. 2026"
    const category = expenseCategoryLabels[expense.category]
    const categoryAndSupplier = expense.supplier ? `${category}: ${expense.supplier}` : category
    const details = [categoryAndSupplier, stepName, expense.date ? formatDate(expense.date) : null]
        .filter(Boolean)
        .join(' · ')

    async function handleDelete() {
        if (!window.confirm(`Ta bort kostnaden "${expense.description}"?`)) return

        setDeleting(true)
        setError(null)
        try {
            await deleteExpense(expense.id)
            onDeleted(expense.id)
        } catch (deleteError) {
            setError(deleteError instanceof Error ? deleteError.message : 'Kunde inte ta bort kostnaden')
            setDeleting(false)
        }
    }

    if (editing) {
        return (
            <li className="expense-row-editing">
                <ExpenseForm
                    projectId={projectId}
                    steps={steps}
                    expense={expense}
                    onSaved={(saved) => {
                        onSaved(saved)
                        setEditing(false)
                    }}
                    onCancel={() => setEditing(false)}
                />
            </li>
        )
    }

    return (
        <li className="expense-row">
            <div className="expense-row-main">
                <span className="expense-row-description">{expense.description}</span>
                <span className="expense-row-details">{details}</span>
                {error && <span className="form-error" role="alert">{error}</span>}
            </div>
            <span className="expense-row-amount">{formatAmount(expense.amount)}</span>
            <button
                type="button"
                className="expense-row-edit"
                aria-label={`Redigera kostnaden ${expense.description}`}
                disabled={deleting}
                onClick={() => setEditing(true)}
            >
                Redigera
            </button>
            <button
                type="button"
                className="expense-row-delete"
                aria-label={`Ta bort kostnaden ${expense.description}`}
                disabled={deleting}
                onClick={handleDelete}
            >
                ×
            </button>
        </li>
    )
}
