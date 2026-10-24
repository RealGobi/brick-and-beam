import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { announceNotificationsChanged, type Notification } from '../api/notifications'
import { useNotifications } from './useNotifications'

const notice: Notification = {
    key: 'reminder-r1',
    kind: 'reminder',
    productId: 'p1',
    productName: 'Brandvarnare',
    title: 'Byt batteri',
    date: '2026-11-01',
    overdue: false,
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })

afterEach(() => {
    vi.restoreAllMocks()
})

describe('useNotifications', () => {
    it('fetches the notifications when mounted', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(json([notice]))

        const { result } = renderHook(() => useNotifications())

        await waitFor(() => expect(result.current).toEqual([notice]))
    })

    it('fetches again when a change is announced', async () => {
        const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(json([])).mockResolvedValueOnce(json([notice]))
        const { result } = renderHook(() => useNotifications())
        await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce())

        act(() => announceNotificationsChanged())

        await waitFor(() => expect(result.current).toEqual([notice]))
    })

    it('stays empty when the server cannot be reached', async () => {
        const fetchMock = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'))

        const { result } = renderHook(() => useNotifications())

        await waitFor(() => expect(fetchMock).toHaveBeenCalled())
        expect(result.current).toEqual([])
    })
})
