import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ServiceEntry } from '../api/services'
import { makeStepImage } from '../test/makeStep'
import { makeService } from '../test/makeService'
import { ServiceCard } from './ServiceCard'

function renderCard(service: ServiceEntry) {
    const handlers = { onSaved: vi.fn(), onDeleted: vi.fn(), onImagesChange: vi.fn() }
    render(<ServiceCard service={service} {...handlers} />)
    return { ...handlers, user: userEvent.setup() }
}

afterEach(() => {
    vi.restoreAllMocks()
})

describe('ServiceCard', () => {
    it('shows the name, date, who did it, the cost and the description', () => {
        renderCard(
            makeService({
                name: 'Filterbyte',
                performedOn: '2026-03-01',
                performedBy: 'Ventilationsteknik',
                cost: 1200,
                description: 'F7-filter',
            }),
        )

        expect(screen.getByRole('heading', { name: 'Filterbyte' })).toBeInTheDocument()
        expect(screen.getByText('1 mars 2026')).toBeInTheDocument()
        expect(screen.getByText(/Ventilationsteknik · 1\s200\skr/)).toBeInTheDocument()
        expect(screen.getByText('F7-filter')).toBeInTheDocument()
    })

    it('leaves out who did it and the cost when they are not known', () => {
        renderCard(makeService({ performedBy: '', cost: null }))

        expect(screen.queryByText(/kr/)).not.toBeInTheDocument()
    })

    it('shows the images and uploads more to this service', async () => {
        const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response(JSON.stringify([makeStepImage('ny.jpg')]), { status: 201 }),
        )
        const { user, onImagesChange } = renderCard(makeService({ id: 's1', images: [makeStepImage('a.jpg')] }))

        expect(screen.getByRole('img', { name: 'a.jpg' })).toBeInTheDocument()
        await user.upload(screen.getByLabelText('Lägg till bilder'), new File(['jpg'], 'ny.jpg', { type: 'image/jpeg' }))

        expect(fetchMock.mock.calls[0][0]).toBe('/api/services/s1/images')
        expect(onImagesChange).toHaveBeenCalledWith('s1', [makeStepImage('a.jpg'), makeStepImage('ny.jpg')])
    })

    it('deletes the service after confirming', async () => {
        vi.spyOn(window, 'confirm').mockReturnValue(true)
        const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }))
        const { user, onDeleted } = renderCard(makeService({ id: 's1' }))

        await user.click(screen.getByRole('button', { name: 'Ta bort' }))

        expect(fetchMock).toHaveBeenCalledWith('/api/services/s1', { method: 'DELETE' })
        expect(onDeleted).toHaveBeenCalledWith('s1')
    })

    it('switches to a filled-in form when Redigera is clicked', async () => {
        const { user } = renderCard(makeService({ name: 'Filterbyte' }))

        await user.click(screen.getByRole('button', { name: 'Redigera' }))

        expect(screen.getByLabelText('Vad gjordes')).toHaveValue('Filterbyte')
    })
})
