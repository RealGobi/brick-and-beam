import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { makeStepImage } from '../test/makeStep'
import { makeService } from '../test/makeService'
import { ServiceForm } from './ServiceForm'

const json = (body: unknown, status: number) => new Response(JSON.stringify(body), { status })
const sentBody = (fetchMock: ReturnType<typeof vi.spyOn>) => JSON.parse(String(fetchMock.mock.calls[0][1]?.body))

function renderForm() {
    const onSaved = vi.fn()
    render(<ServiceForm productId="p1" onSaved={onSaved} onCancel={vi.fn()} />)
    return { onSaved, user: userEvent.setup() }
}

// A new service starts on today's date, so freeze it
beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 9, 24, 12, 0))
})

afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
})

describe('ServiceForm: new service', () => {
    it('starts on today and sends every field', async () => {
        const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(json(makeService(), 201))
        const { user } = renderForm()

        expect(screen.getByLabelText('Datum')).toHaveValue('2026-10-24')
        await user.type(screen.getByLabelText('Vad gjordes'), 'Filterbyte')
        await user.type(screen.getByLabelText('Beskrivning'), 'F7-filter')
        await user.type(screen.getByLabelText('Utförd av'), ' Ventilationsteknik ')
        await user.type(screen.getByLabelText('Kostnad (kr)'), '1200')
        await user.click(screen.getByRole('button', { name: 'Spara service' }))

        expect(fetchMock.mock.calls[0][0]).toBe('/api/products/p1/services')
        expect(sentBody(fetchMock)).toEqual({
            name: 'Filterbyte',
            description: 'F7-filter',
            performedOn: '2026-10-24',
            performedBy: 'Ventilationsteknik',
            cost: 1200,
        })
    })

    it('sends an empty cost as null', async () => {
        const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(json(makeService(), 201))
        const { user } = renderForm()

        await user.type(screen.getByLabelText('Vad gjordes'), 'Byte av batteri')
        await user.click(screen.getByRole('button', { name: 'Spara service' }))

        expect(sentBody(fetchMock)).toMatchObject({ cost: null, performedBy: '' })
    })

    it('uploads chosen images to the new service', async () => {
        const created = makeService({ id: 's1' })
        const uploaded = [makeStepImage('filter.jpg')]
        const fetchMock = vi.spyOn(globalThis, 'fetch')
            .mockResolvedValueOnce(json(created, 201))
            .mockResolvedValueOnce(json(uploaded, 201))
        const { user, onSaved } = renderForm()

        await user.type(screen.getByLabelText('Vad gjordes'), 'Filterbyte')
        await user.upload(screen.getByLabelText(/^Bilder/), new File(['jpg'], 'filter.jpg', { type: 'image/jpeg' }))
        await user.click(screen.getByRole('button', { name: 'Spara service' }))

        expect(fetchMock.mock.calls[1][0]).toBe('/api/services/s1/images')
        expect(onSaved).toHaveBeenCalledWith({ ...created, images: uploaded })
    })

    it('keeps the service and passes a warning when the images fail', async () => {
        const created = makeService({ id: 's1' })
        vi.spyOn(globalThis, 'fetch')
            .mockResolvedValueOnce(json(created, 201))
            .mockResolvedValueOnce(json({ error: 'Uppladdningen är för stor' }, 413))
        const { user, onSaved } = renderForm()

        await user.type(screen.getByLabelText('Vad gjordes'), 'Filterbyte')
        await user.upload(screen.getByLabelText(/^Bilder/), new File(['jpg'], 'filter.jpg', { type: 'image/jpeg' }))
        await user.click(screen.getByRole('button', { name: 'Spara service' }))

        expect(onSaved).toHaveBeenCalledWith(created, expect.stringContaining('Uppladdningen är för stor'))
    })
})

describe('ServiceForm: editing', () => {
    it('starts with the saved values and sends changes with PATCH', async () => {
        const existing = makeService({ id: 's1', name: 'Filterbyte', performedOn: '2026-03-01', cost: 1200 })
        const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(json(existing, 200))
        render(<ServiceForm productId="p1" service={existing} onSaved={vi.fn()} onCancel={vi.fn()} />)
        const user = userEvent.setup()

        expect(screen.getByLabelText('Datum')).toHaveValue('2026-03-01')
        expect(screen.getByLabelText('Kostnad (kr)')).toHaveValue(1200)
        expect(screen.queryByLabelText(/^Bilder/)).not.toBeInTheDocument()

        await user.clear(screen.getByLabelText('Kostnad (kr)'))
        await user.click(screen.getByRole('button', { name: 'Spara ändringar' }))

        expect(fetchMock.mock.calls[0][0]).toBe('/api/services/s1')
        expect(sentBody(fetchMock)).toMatchObject({ cost: null, performedOn: '2026-03-01' })
    })
})
