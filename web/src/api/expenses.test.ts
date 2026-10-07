import { afterEach, describe, expect, it, vi } from 'vitest'
import { makeExpense } from '../test/projectDetailPage'
import { createExpense, deleteExpense, fetchExpenses, updateExpense, type NewExpenseInput } from './expenses'

const expense = makeExpense({ stepId: 's1', date: '2026-10-01', amount: 12000 })
const input: NewExpenseInput = {
    category: 'purchase',
    supplier: 'Bauhaus',
    description: 'Kakel',
    amount: 12000,
    date: null,
    stepId: null,
}

function mockFetchResponse(body: unknown, status = 200) {
    return vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(body), { status }))
}

afterEach(() => {
    vi.restoreAllMocks()
})

describe('fetchExpenses', () => {
    it('fetches the expenses of the project', async () => {
        const fetchMock = mockFetchResponse([expense])

        expect(await fetchExpenses('p1')).toEqual([expense])
        expect(fetchMock).toHaveBeenCalledWith('/api/projects/p1/expenses')
    })

    it('throws when an expense has an unknown category', async () => {
        mockFetchResponse([{ ...expense, category: 'gardener' }])

        await expect(fetchExpenses('p1')).rejects.toThrow('Oväntat svar från servern')
    })

    it('throws when an expense has the amount as text', async () => {
        mockFetchResponse([{ ...expense, amount: '12000' }])

        await expect(fetchExpenses('p1')).rejects.toThrow('Oväntat svar från servern')
    })

    it('throws with the server message when the project does not exist', async () => {
        mockFetchResponse({ error: 'Projektet finns inte' }, 404)

        await expect(fetchExpenses('p1')).rejects.toThrow('Projektet finns inte')
    })
})

describe('createExpense', () => {
    it('sends the input as JSON to the project and returns the expense', async () => {
        const fetchMock = mockFetchResponse(expense, 201)

        expect(await createExpense('p1', input)).toEqual(expense)
        expect(fetchMock).toHaveBeenCalledWith('/api/projects/p1/expenses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input),
        })
    })

    it('throws with the validation message from the server', async () => {
        mockFetchResponse({ error: 'amount måste vara ett heltal större än 0' }, 400)

        await expect(createExpense('p1', input)).rejects.toThrow('amount måste vara ett heltal större än 0')
    })
})

describe('deleteExpense', () => {
    it('sends DELETE and accepts an empty 204 response', async () => {
        const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }))

        await expect(deleteExpense('e1')).resolves.toBeUndefined()
        expect(fetchMock).toHaveBeenCalledWith('/api/expenses/e1', { method: 'DELETE' })
    })
})

describe('updateExpense', () => {
    it('sends only the changed fields with PATCH and returns the expense', async () => {
        const fetchMock = mockFetchResponse(expense)

        expect(await updateExpense('e1', { description: 'Kakel' })).toEqual(expense)
        expect(fetchMock).toHaveBeenCalledWith('/api/expenses/e1', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ description: 'Kakel' }),
        })
    })

    it('throws with the server message when the expense does not exist', async () => {
        mockFetchResponse({ error: 'Kostnaden finns inte' }, 404)

        await expect(updateExpense('e1', { amount: 5 })).rejects.toThrow('Kostnaden finns inte')
    })
})
