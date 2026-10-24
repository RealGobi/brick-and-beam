import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NOTIFICATIONS_CHANGED } from '../api/notifications'
import type { Reminder } from '../api/reminders'
import { ReminderSection } from './ReminderSection'

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })

function makeReminder(overrides: Partial<Reminder> = {}): Reminder {
    return {
        id: 'r1',
        productId: 'p1',
        title: 'Byt batteri',
        dueDate: '2026-11-01',
        note: '',
        doneAt: null,
        createdAt: '2026-10-01T12:00:00.000Z',
        ...overrides,
    }
}

function renderSection(reminders: Reminder[]) {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(json(reminders))
    render(<ReminderSection productId="p1" />)
    return { fetchMock, user: userEvent.setup() }
}

// Overdue depends on today, so freeze the date
beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 9, 24, 12, 0))
})

afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
})

describe('ReminderSection', () => {
    it('lists the reminders with date and note, overdue ones marked', async () => {
        renderSection([
            makeReminder({ id: 'a', title: 'Testa larmet', dueDate: '2026-10-20' }),
            makeReminder({ id: 'b', title: 'Byt batteri', dueDate: '2026-11-01', note: '9V' }),
        ])

        expect(await screen.findByText('Testa larmet')).toBeInTheDocument()
        expect(screen.getByText(/Försenad, 20 okt\. 2026/)).toBeInTheDocument()
        expect(screen.getByText('9V')).toBeInTheDocument()
    })

    it('says how regular service is handled when there are no reminders', async () => {
        renderSection([])

        expect(await screen.findByText(/Inga påminnelser/)).toBeInTheDocument()
    })

    it('adds a reminder from the form and tells the bell', async () => {
        const announced = vi.fn()
        window.addEventListener(NOTIFICATIONS_CHANGED, announced)
        const { fetchMock, user } = renderSection([])
        await screen.findByText(/Inga påminnelser/)
        fetchMock.mockResolvedValueOnce(json(makeReminder({ title: 'Byt batteri' }), 201))

        await user.click(screen.getByRole('button', { name: '+ Ny påminnelse' }))
        await user.type(screen.getByLabelText('Påminn om'), ' Byt batteri ')
        await user.type(screen.getByLabelText('Datum'), '2026-11-01')
        await user.click(screen.getByRole('button', { name: 'Spara påminnelse' }))

        expect(await screen.findByText('Byt batteri')).toBeInTheDocument()
        expect(JSON.parse(String(fetchMock.mock.calls[1][1]?.body))).toEqual({ title: 'Byt batteri', dueDate: '2026-11-01', note: '' })
        expect(announced).toHaveBeenCalled()
        window.removeEventListener(NOTIFICATIONS_CHANGED, announced)
    })

    it('marks a reminder as done and moves it after the active ones', async () => {
        const { fetchMock, user } = renderSection([
            makeReminder({ id: 'a', title: 'Först', dueDate: '2026-11-01' }),
            makeReminder({ id: 'b', title: 'Sedan', dueDate: '2026-12-01' }),
        ])
        await screen.findByText('Först')
        fetchMock.mockResolvedValueOnce(json(makeReminder({ id: 'a', title: 'Först', doneAt: '2026-10-24T10:00:00.000Z' })))

        await user.click(within(screen.getAllByRole('listitem')[0]).getByRole('button', { name: 'Klar' }))

        await waitFor(() => expect(screen.getAllByRole('listitem')[1]).toHaveTextContent('Först'))
        expect(JSON.parse(String(fetchMock.mock.calls[1][1]?.body))).toEqual({ done: true })
        expect(within(screen.getAllByRole('listitem')[1]).getByRole('button', { name: 'Ångra' })).toBeInTheDocument()
    })

    it('deletes a reminder after confirming', async () => {
        vi.spyOn(window, 'confirm').mockReturnValue(true)
        const { fetchMock, user } = renderSection([makeReminder({ id: 'r1', title: 'Byt batteri' })])
        await screen.findByText('Byt batteri')
        fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }))

        await user.click(screen.getByRole('button', { name: 'Ta bort påminnelsen Byt batteri' }))

        await waitFor(() => expect(screen.queryByText('Byt batteri')).not.toBeInTheDocument())
        expect(fetchMock).toHaveBeenLastCalledWith('/api/reminders/r1', { method: 'DELETE' })
    })

    it('shows the error when a change fails', async () => {
        const { fetchMock, user } = renderSection([makeReminder()])
        await screen.findByText('Byt batteri')
        fetchMock.mockResolvedValueOnce(json({ error: 'Påminnelsen finns inte' }, 404))

        await user.click(screen.getByRole('button', { name: 'Klar' }))

        expect(await screen.findByRole('alert')).toHaveTextContent('Påminnelsen finns inte')
    })
})
