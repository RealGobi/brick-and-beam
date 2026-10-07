import { formatAmount } from '../utils/formatProject'
import './Expenses.css'

type BudgetSummaryProps = {
    /** Whole kronor, or null when the project has no budget */
    budget: number | null
    spent: number
}

/** How much of the budget is spent, with a bar and how much is left or over. */
export function BudgetSummary({ budget, spent }: BudgetSummaryProps) {
    if (budget === null) {
        return (
            <div className="budget-summary">
                <p className="budget-summary-spent">Använt <strong>{formatAmount(spent)}</strong></p>
                <p className="budget-summary-note">Ingen budget satt. Lägg till en genom att redigera projektet.</p>
            </div>
        )
    }

    const over = spent > budget
    // The bar is full when the budget is reached or passed
    const percent = budget === 0 ? 100 : Math.min(100, Math.round((spent / budget) * 100))

    return (
        <div className={`budget-summary${over ? ' is-over' : ''}`}>
            <p className="budget-summary-spent">
                Använt <strong>{formatAmount(spent)}</strong> av {formatAmount(budget)}
            </p>
            <div
                className="budget-summary-bar"
                role="meter"
                aria-label="Andel av budgeten som är använd"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={percent}
            >
                <span style={{ width: `${percent}%` }} />
            </div>
            <p className="budget-summary-note">
                {over ? `${formatAmount(spent - budget)} över budget` : `${formatAmount(budget - spent)} kvar`}
            </p>
        </div>
    )
}
