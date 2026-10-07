import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { makeStep } from '../test/makeStep'
import { makeExpense } from '../test/projectDetailPage'
import { ExpenseForm } from './ExpenseForm'

const steps = [makeStep({ id: 's1', name: 'Riva kakel' }), makeStep({ id: 's2', name: 'Ny dusch' })]

function renderForm() {
    const onSaved = vi.fn()
    const onCancel = vi.fn()
    render(<ExpenseForm projectId="p1" steps={steps} onSaved={onSaved} onCancel={onCancel} />)
    return { onSaved, onCancel, user: userEvent.setup() }
}

const json = (body: unknown, status: number) => new Response(JSON.stringify(body), { status })
const sentBody = (fetchMock: ReturnType<typeof vi.spyOn>) => JSON.parse(String(fetchMock.mock.calls[0][1]?.body))

afterEach(() => {
    vi.restoreAllMocks()
})

describe('ExpenseForm', () => {
    it('sends every field, with the amount as a number and the chosen step', async () => {
        const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(json(makeExpense(), 201))
        const { user } = renderForm()

        await user.selectOptions(screen.getByLabelText('Kategori'), 'Elektriker')
        await user.type(screen.getByLabelText('Företag (valfritt)'), ' Elfirma AB ')
        await user.type(screen.getByLabelText('Vad'), 'Kakel')
        await user.type(screen.getByLabelText('Belopp (kr)'), '12000')
        await user.type(screen.getByLabelText('Datum'), '2026-10-01')
        await user.selectOptions(screen.getByLabelText('Steg'), 'Ny dusch')
        await user.click(screen.getByRole('button', { name: 'Spara kostnad' }))

        expect(fetchMock.mock.calls[0][0]).toBe('/api/projects/p1/expenses')
        expect(sentBody(fetchMock)).toEqual({
            category: 'electrician',
            supplier: 'Elfirma AB',
            description: 'Kakel',
            amount: 12000,
            date: '2026-10-01',
            stepId: 's2',
        })
    })

    it('starts as a purchase and asks for the store', () => {
        renderForm()

        expect(screen.getByLabelText('Kategori')).toHaveValue('purchase')
        expect(screen.getByLabelText('Inköpsställe (valfritt)')).toHaveAttribute('placeholder', 't.ex. Bauhaus')
    })

    it('asks for a company instead of a store when a craftsman is chosen', async () => {
        const { user } = renderForm()

        await user.selectOptions(screen.getByLabelText('Kategori'), 'Snickare')

        expect(screen.getByLabelText('Företag (valfritt)')).toHaveAttribute('placeholder', 't.ex. Elfirma AB')
        expect(screen.queryByLabelText('Inköpsställe (valfritt)')).not.toBeInTheDocument()
    })

    it('belongs to the whole project when no step is chosen', async () => {
        const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(json(makeExpense(), 201))
        const { user } = renderForm()

        await user.type(screen.getByLabelText('Vad'), 'Container')
        await user.type(screen.getByLabelText('Belopp (kr)'), '3500')
        await user.click(screen.getByRole('button', { name: 'Spara kostnad' }))

        expect(sentBody(fetchMock)).toEqual({
            category: 'purchase',
            supplier: '',
            description: 'Container',
            amount: 3500,
            date: null,
            stepId: null,
        })
    })

    it('lists the steps after a choice for the whole project', () => {
        renderForm()

        const stepSelect = within(screen.getByLabelText('Steg'))
        const options = stepSelect.getAllByRole('option').map((option) => option.textContent)
        expect(options).toEqual(['Hela projektet', 'Riva kakel', 'Ny dusch'])
    })

    it('passes the saved expense to onSaved', async () => {
        const saved = makeExpense({ description: 'Kakel' })
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(json(saved, 201))
        const { user, onSaved } = renderForm()

        await user.type(screen.getByLabelText('Vad'), 'Kakel')
        await user.type(screen.getByLabelText('Belopp (kr)'), '1000')
        await user.click(screen.getByRole('button', { name: 'Spara kostnad' }))

        expect(onSaved).toHaveBeenCalledWith(saved)
    })

    it('shows the error from the server', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(json({ error: 'Steget hör inte till projektet' }, 400))
        const { user, onSaved } = renderForm()

        await user.type(screen.getByLabelText('Vad'), 'Kakel')
        await user.type(screen.getByLabelText('Belopp (kr)'), '1000')
        await user.click(screen.getByRole('button', { name: 'Spara kostnad' }))

        expect(await screen.findByRole('alert')).toHaveTextContent('Steget hör inte till projektet')
        expect(onSaved).not.toHaveBeenCalled()
    })

    it('does not send anything without a description and amount', async () => {
        const fetchMock = vi.spyOn(globalThis, 'fetch')
        const { user } = renderForm()

        await user.click(screen.getByRole('button', { name: 'Spara kostnad' }))

        expect(fetchMock).not.toHaveBeenCalled()
    })
})

describe('ExpenseForm: editing', () => {
    const existing = makeExpense({
        id: 'e1',
        category: 'electrician',
        supplier: 'Elfirma AB',
        description: 'Elcentral',
        amount: 9000,
        date: '2026-10-02',
        stepId: 's1',
    })

    function renderEditForm() {
        const onSaved = vi.fn()
        render(<ExpenseForm projectId="p1" steps={steps} expense={existing} onSaved={onSaved} onCancel={vi.fn()} />)
        return { onSaved, user: userEvent.setup() }
    }

    it('starts with the saved values filled in', () => {
        renderEditForm()

        expect(screen.getByLabelText('Kategori')).toHaveValue('electrician')
        expect(screen.getByLabelText('Företag (valfritt)')).toHaveValue('Elfirma AB')
        expect(screen.getByLabelText('Vad')).toHaveValue('Elcentral')
        expect(screen.getByLabelText('Belopp (kr)')).toHaveValue(9000)
        expect(screen.getByLabelText('Datum')).toHaveValue('2026-10-02')
        expect(screen.getByLabelText('Steg')).toHaveValue('s1')
    })

    it('sends the changes to the expense with PATCH and passes the result on', async () => {
        const updated = { ...existing, amount: 9500 }
        const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(json(updated, 200))
        const { user, onSaved } = renderEditForm()

        await user.clear(screen.getByLabelText('Belopp (kr)'))
        await user.type(screen.getByLabelText('Belopp (kr)'), '9500')
        await user.click(screen.getByRole('button', { name: 'Spara ändringar' }))

        const [url, options] = fetchMock.mock.calls[0]
        expect(url).toBe('/api/expenses/e1')
        expect(options?.method).toBe('PATCH')
        expect(sentBody(fetchMock)).toMatchObject({ amount: 9500, supplier: 'Elfirma AB', stepId: 's1' })
        expect(onSaved).toHaveBeenCalledWith(updated)
    })
})
