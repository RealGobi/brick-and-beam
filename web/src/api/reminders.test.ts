import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchNotifications } from './notifications'
import { createReminder, deleteReminder, fetchReminders, updateReminder } from './reminders'

const reminder = {
    id: 'r1',
    productId: 'p1',
    title: 'Byt batteri',
    dueDate: '2026-11-01',
    note: '',
    doneAt: null,
    createdAt: '2026-10-01T12:00:00.000Z',
}

function mockFetchResponse(body: unknown, status = 200) {
    return vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(body), { status }))
}

afterEach(() => {
    vi.restoreAllMocks()
})

describe('reminders api', () => {
    it('fetches the reminders of a product', async () => {
        const fetchMock = mockFetchResponse([reminder])

        expect(await fetchReminders('p1')).toEqual([reminder])
        expect(fetchMock).toHaveBeenCalledWith('/api/products/p1/reminders')
    })

    it('adds a reminder with POST', async () => {
        const fetchMock = mockFetchResponse(reminder, 201)

        await createReminder('p1', { title: 'Byt batteri', dueDate: '2026-11-01', note: '' })

        expect(fetchMock.mock.calls[0][0]).toBe('/api/products/p1/reminders')
        expect(fetchMock.mock.calls[0][1]?.method).toBe('POST')
    })

    it('marks a reminder as done with PATCH', async () => {
        const fetchMock = mockFetchResponse({ ...reminder, doneAt: '2026-10-24T10:00:00.000Z' })

        const done = await updateReminder('r1', { done: true })

        expect(done.doneAt).toBe('2026-10-24T10:00:00.000Z')
        expect(fetchMock.mock.calls[0][1]?.body).toBe(JSON.stringify({ done: true }))
    })

    it('throws with the server message', async () => {
        mockFetchResponse({ error: 'dueDate krävs' }, 400)

        await expect(createReminder('p1', { title: 'X', dueDate: '', note: '' })).rejects.toThrow('dueDate krävs')
    })

    it('deletes a reminder with DELETE', async () => {
        const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }))

        await deleteReminder('r1')

        expect(fetchMock).toHaveBeenCalledWith('/api/reminders/r1', { method: 'DELETE' })
    })
})

describe('fetchNotifications', () => {
    it('returns the notifications', async () => {
        const notice = { key: 'k', kind: 'service', productId: 'p1', productName: 'X', title: 'T', date: '2026-11-01', overdue: false }
        mockFetchResponse([notice])

        expect(await fetchNotifications()).toEqual([notice])
    })

    it('throws when a notification has an unknown kind', async () => {
        mockFetchResponse([{ key: 'k', kind: 'party', productId: 'p1', productName: 'X', title: 'T', date: '2026-11-01', overdue: false }])

        await expect(fetchNotifications()).rejects.toThrow('Oväntat svar från servern')
    })
})
