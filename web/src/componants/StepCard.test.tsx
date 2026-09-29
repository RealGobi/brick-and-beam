import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Step } from '../api/steps'
import { makeStep, makeStepImage } from '../test/makeStep'
import { StepCard } from './StepCard'

function renderCard(step: Step) {
    const onImagesAdded = vi.fn()
    render(<StepCard step={step} onImagesAdded={onImagesAdded} />)
    return { onImagesAdded, user: userEvent.setup() }
}

const photo = () => new File(['jpg'], 'fore.jpg', { type: 'image/jpeg' })

afterEach(() => {
    vi.restoreAllMocks()
})

describe('StepCard', () => {
    it('shows the name, status, date and description', () => {
        renderCard(makeStep({ name: 'Riva kakel', status: 'done', date: '2026-09-05', description: 'Hela väggen' }))

        expect(screen.getByRole('heading', { name: 'Riva kakel' })).toBeInTheDocument()
        expect(screen.getByText('Klar')).toBeInTheDocument()
        expect(screen.getByText('5 sep. 2026')).toBeInTheDocument()
        expect(screen.getByText('Hela väggen')).toBeInTheDocument()
    })

    it('says there is no date when none is set', () => {
        renderCard(makeStep({ date: null }))

        expect(screen.getByText('Inget datum')).toBeInTheDocument()
    })

    it('shows each image as a link to the full size image', () => {
        renderCard(makeStep({ images: [makeStepImage('a.jpg'), makeStepImage('b.png')] }))

        expect(screen.getByRole('img', { name: 'a.jpg' })).toHaveAttribute('src', '/api/uploads/a.jpg')
        expect(screen.getByRole('img', { name: 'b.png' }).closest('a')).toHaveAttribute('href', '/api/uploads/b.png')
    })

    it('uploads the chosen images and reports them', async () => {
        const saved = [makeStepImage('fore.jpg')]
        const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(saved), { status: 201 }))
        const { user, onImagesAdded } = renderCard(makeStep({ id: 's1' }))

        await user.upload(screen.getByLabelText('Lägg till bilder'), photo())

        expect(fetchMock.mock.calls[0][0]).toBe('/api/steps/s1/images')
        expect(onImagesAdded).toHaveBeenCalledWith('s1', saved)
    })

    it('shows the error when the upload is rejected', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response(JSON.stringify({ error: 'fore.jpg är större än 10 MB' }), { status: 400 }),
        )
        const { user, onImagesAdded } = renderCard(makeStep())

        await user.upload(screen.getByLabelText('Lägg till bilder'), photo())

        expect(await screen.findByRole('alert')).toHaveTextContent('fore.jpg är större än 10 MB')
        expect(onImagesAdded).not.toHaveBeenCalled()
    })

    it('shows that it is uploading while the request is running', async () => {
        vi.spyOn(globalThis, 'fetch').mockReturnValue(new Promise(() => {}))
        const { user } = renderCard(makeStep())

        await user.upload(screen.getByLabelText('Lägg till bilder'), photo())

        expect(screen.getByText('Laddar upp…')).toBeInTheDocument()
    })
})
