import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Expense } from '../api/expenses'
import { makeStep } from '../test/makeStep'
import { makeExpense } from '../test/projectDetailPage'
import { ExpenseSection } from './ExpenseSection'

function renderSection(expenses: Expense[], options: { loading?: boolean; error?: string | null } = {}) {
    const onSaved = vi.fn()
    const onDeleted = vi.fn()
    render(
        <ExpenseSection
            projectId="p1"
            budget={50000}
            steps={[makeStep({ id: 's1', name: 'Riva kakel' })]}
            expenses={expenses}
            loading={options.loading ?? false}
            error={options.error ?? null}
            onSaved={onSaved}
            onDeleted={onDeleted}
        />,
    )
    return { onSaved, onDeleted, user: userEvent.setup() }
}

afterEach(() => {
    vi.restoreAllMocks()
})

describe('ExpenseSection', () => {
    it('lists each expense with its category, supplier, step, date and amount', () => {
        renderSection([
            makeExpense({
                description: 'Kakel',
                category: 'purchase',
                supplier: 'Bauhaus',
                stepId: 's1',
                date: '2026-10-01',
                amount: 12000,
            }),
        ])

        expect(screen.getByText('Kakel')).toBeInTheDocument()
        expect(screen.getByText('Inköp: Bauhaus · Riva kakel · 1 okt. 2026')).toBeInTheDocument()
        // The summary above shows the same sum, so look only in the list
        expect(within(screen.getByRole('list')).getByText(/^12\s000\skr$/)).toBeInTheDocument()
    })

    it('shows only the category when there is no supplier, and the whole project without a step', () => {
        renderSection([makeExpense({ category: 'electrician', supplier: '', stepId: null })])

        expect(screen.getByText('Elektriker · Hela projektet')).toBeInTheDocument()
    })

    it('adds up the expenses in the budget summary', () => {
        renderSection([makeExpense({ description: 'A', amount: 10000 }), makeExpense({ description: 'B', amount: 5000 })])

        expect(screen.getByText(/^35\s000\skr kvar$/)).toBeInTheDocument()
    })

    it('shows an empty message when there are no expenses', () => {
        renderSection([])

        expect(screen.getByText('Inga kostnader än.')).toBeInTheDocument()
    })

    it('shows loading and errors instead of the summary', () => {
        renderSection([], { error: 'Servern svarade med 500' })

        expect(screen.getByRole('alert')).toHaveTextContent('Kunde inte hämta kostnaderna')
        expect(screen.queryByRole('button', { name: '+ Lägg till kostnad' })).not.toBeInTheDocument()
    })

    it('deletes an expense after confirming', async () => {
        vi.spyOn(window, 'confirm').mockReturnValue(true)
        const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }))
        const { user, onDeleted } = renderSection([makeExpense({ id: 'e1', description: 'Kakel' })])

        await user.click(screen.getByRole('button', { name: 'Ta bort kostnaden Kakel' }))

        expect(fetchMock).toHaveBeenCalledWith('/api/expenses/e1', { method: 'DELETE' })
        expect(onDeleted).toHaveBeenCalledWith('e1')
    })

    it('keeps the expense when the confirmation is cancelled', async () => {
        vi.spyOn(window, 'confirm').mockReturnValue(false)
        const fetchMock = vi.spyOn(globalThis, 'fetch')
        const { user, onDeleted } = renderSection([makeExpense({ description: 'Kakel' })])

        await user.click(screen.getByRole('button', { name: 'Ta bort kostnaden Kakel' }))

        expect(fetchMock).not.toHaveBeenCalled()
        expect(onDeleted).not.toHaveBeenCalled()
    })
})

describe('ExpenseSection: editing', () => {
    it('opens a filled-in form in place of the row, and closes it on Avbryt', async () => {
        const { user } = renderSection([makeExpense({ description: 'Kakl', amount: 900 })])

        await user.click(screen.getByRole('button', { name: 'Redigera kostnaden Kakl' }))
        expect(screen.getByLabelText('Vad')).toHaveValue('Kakl')
        expect(screen.getByLabelText('Belopp (kr)')).toHaveValue(900)

        await user.click(screen.getByRole('button', { name: 'Avbryt' }))
        expect(screen.getByText('Kakl')).toBeInTheDocument()
    })

    it('passes the edited expense on and shows the row again', async () => {
        const edited = makeExpense({ id: 'e1', description: 'Kakel' })
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(edited)))
        const { user, onSaved } = renderSection([makeExpense({ id: 'e1', description: 'Kakl' })])

        await user.click(screen.getByRole('button', { name: 'Redigera kostnaden Kakl' }))
        await user.clear(screen.getByLabelText('Vad'))
        await user.type(screen.getByLabelText('Vad'), 'Kakel')
        await user.click(screen.getByRole('button', { name: 'Spara ändringar' }))

        expect(onSaved).toHaveBeenCalledWith(edited)
        expect(screen.queryByLabelText('Vad')).not.toBeInTheDocument()
    })
})
