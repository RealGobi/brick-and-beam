import { useState, type FormEvent } from 'react'
import {
    createExpense,
    expenseCategories,
    isExpenseCategory,
    updateExpense,
    type Expense,
    type ExpenseCategory,
} from '../api/expenses'
import type { Step } from '../api/steps'
import { expenseCategoryLabels, supplierLabel } from '../utils/formatProject'
import './Form.css'

type ExpenseFormProps = {
    projectId: string
    /** Steps the expense can be linked to */
    steps: Step[]
    /** The expense to edit. Leave out to add a new expense. */
    expense?: Expense
    onSaved: (expense: Expense) => void
    onCancel: () => void
}

/**
 * Form for adding or editing an expense. The category comes first, since it decides whether the
 * supplier field asks for a store (purchases) or a company (craftsmen).
 */
export function ExpenseForm({ projectId, steps, expense, onSaved, onCancel }: ExpenseFormProps) {
    // Inputs hold strings, so the amount and missing values are converted here and on save
    const [category, setCategory] = useState<ExpenseCategory>(expense?.category ?? 'purchase')
    const [supplier, setSupplier] = useState(expense?.supplier ?? '')
    const [description, setDescription] = useState(expense?.description ?? '')
    const [amount, setAmount] = useState(expense ? String(expense.amount) : '')
    const [date, setDate] = useState(expense?.date ?? '')
    // Empty string means the whole project
    const [stepId, setStepId] = useState(expense?.stepId ?? '')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const saveLabel = expense ? 'Spara ändringar' : 'Spara kostnad'

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setSaving(true)
        setError(null)

        try {
            const input = {
                category,
                supplier: supplier.trim(),
                description: description.trim(),
                amount: Number(amount),
                date: date || null,
                stepId: stepId || null,
            }
            onSaved(expense ? await updateExpense(expense.id, input) : await createExpense(projectId, input))
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : 'Kunde inte spara kostnaden')
            setSaving(false)
        }
    }

    return (
        <form className="project-form" onSubmit={handleSubmit}>
            <div className="field-row">
                <label className="field">
                    <span>Kategori</span>
                    <select
                        value={category}
                        onChange={(e) => {
                            if (isExpenseCategory(e.target.value)) setCategory(e.target.value)
                        }}
                    >
                        {expenseCategories.map((option) => (
                            <option key={option} value={option}>{expenseCategoryLabels[option]}</option>
                        ))}
                    </select>
                </label>

                <label className="field">
                    <span>{supplierLabel(category)} (valfritt)</span>
                    <input
                        maxLength={200}
                        placeholder={category === 'purchase' ? 't.ex. Bauhaus' : 't.ex. Elfirma AB'}
                        value={supplier}
                        onChange={(e) => setSupplier(e.target.value)}
                    />
                </label>
            </div>

            <div className="field-row">
                <label className="field">
                    <span>Vad</span>
                    <input required maxLength={200} value={description} onChange={(e) => setDescription(e.target.value)} />
                </label>

                <label className="field">
                    <span>Belopp (kr)</span>
                    <input
                        required
                        type="number"
                        min={1}
                        step={1}
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                    />
                </label>
            </div>

            <div className="field-row">
                <label className="field">
                    <span>Datum</span>
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </label>

                <label className="field">
                    <span>Steg</span>
                    <select value={stepId} onChange={(e) => setStepId(e.target.value)}>
                        <option value="">Hela projektet</option>
                        {steps.map((step) => (
                            <option key={step.id} value={step.id}>{step.name}</option>
                        ))}
                    </select>
                </label>
            </div>

            {error && <p className="form-error" role="alert">{error}</p>}

            <div className="form-actions">
                <button type="button" className="button" onClick={onCancel}>Avbryt</button>
                <button type="submit" className="button button-primary" disabled={saving}>
                    {saving ? 'Sparar…' : saveLabel}
                </button>
            </div>
        </form>
    )
}
