import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Step } from '../api/steps'
import { makeStep } from '../test/makeStep'
import { StepCard } from './StepCard'

function renderCard(step: Step) {
    const handlers = { onSaved: vi.fn(), onDeleted: vi.fn(), onImagesChange: vi.fn() }
    render(<StepCard step={step} {...handlers} />)
    return { ...handlers, user: userEvent.setup() }
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })

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

    it('marks an ongoing step as done', async () => {
        const updated = makeStep({ id: 's1', status: 'done' })
        const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(json(updated))
        const { user, onSaved } = renderCard(makeStep({ id: 's1', status: 'ongoing' }))

        await user.click(screen.getByRole('button', { name: 'Markera som klar' }))

        const [url, options] = fetchMock.mock.calls[0]
        expect(url).toBe('/api/steps/s1')
        expect(JSON.parse(String(options?.body))).toEqual({ status: 'done' })
        expect(onSaved).toHaveBeenCalledWith(updated)
    })

    it('marks a done step as ongoing again', async () => {
        const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(json(makeStep()))
        const { user } = renderCard(makeStep({ status: 'done' }))

        await user.click(screen.getByRole('button', { name: 'Markera som pågående' }))

        expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({ status: 'ongoing' })
    })

    it('shows the error when the status cannot be changed', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(json({ error: 'Steget finns inte' }, 404))
        const { user, onSaved } = renderCard(makeStep())

        await user.click(screen.getByRole('button', { name: 'Markera som klar' }))

        expect(await screen.findByRole('alert')).toHaveTextContent('Steget finns inte')
        expect(onSaved).not.toHaveBeenCalled()
    })

    it('switches to a filled-in form when Redigera is clicked, and back on Avbryt', async () => {
        const { user } = renderCard(makeStep({ name: 'Riva kakel' }))

        await user.click(screen.getByRole('button', { name: 'Redigera' }))
        expect(screen.getByLabelText('Namn på steget')).toHaveValue('Riva kakel')

        await user.click(screen.getByRole('button', { name: 'Avbryt' }))
        expect(screen.getByRole('heading', { name: 'Riva kakel' })).toBeInTheDocument()
    })

    it('deletes the step after confirming', async () => {
        vi.spyOn(window, 'confirm').mockReturnValue(true)
        const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }))
        const { user, onDeleted } = renderCard(makeStep({ id: 's1' }))

        await user.click(screen.getByRole('button', { name: 'Ta bort' }))

        expect(fetchMock).toHaveBeenCalledWith('/api/steps/s1', { method: 'DELETE' })
        expect(onDeleted).toHaveBeenCalledWith('s1')
    })

    it('keeps the step when the confirmation is cancelled', async () => {
        vi.spyOn(window, 'confirm').mockReturnValue(false)
        const fetchMock = vi.spyOn(globalThis, 'fetch')
        const { user, onDeleted } = renderCard(makeStep())

        await user.click(screen.getByRole('button', { name: 'Ta bort' }))

        expect(fetchMock).not.toHaveBeenCalled()
        expect(onDeleted).not.toHaveBeenCalled()
    })
})
