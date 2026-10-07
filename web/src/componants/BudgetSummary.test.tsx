import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { BudgetSummary } from './BudgetSummary'

describe('BudgetSummary', () => {
    it('shows what is spent of the budget and what is left', () => {
        render(<BudgetSummary budget={85000} spent={42000} />)

        expect(screen.getByText(/42\s000\skr/)).toBeInTheDocument()
        expect(screen.getByText(/^43\s000\skr kvar$/)).toBeInTheDocument()
        expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '49')
    })

    it('warns when more than the budget is spent and keeps the bar full', () => {
        render(<BudgetSummary budget={10000} spent={18000} />)

        expect(screen.getByText(/^8\s000\skr över budget$/)).toBeInTheDocument()
        expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '100')
    })

    it('shows 0 kr left when exactly the budget is spent', () => {
        render(<BudgetSummary budget={5000} spent={5000} />)

        expect(screen.getByText(/^0\skr kvar$/)).toBeInTheDocument()
    })

    it('shows only what is spent when the project has no budget', () => {
        render(<BudgetSummary budget={null} spent={3500} />)

        expect(screen.getByText(/3\s500\skr/)).toBeInTheDocument()
        expect(screen.getByText(/Ingen budget satt/)).toBeInTheDocument()
        expect(screen.queryByRole('meter')).not.toBeInTheDocument()
    })
})
