import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { StepImage } from '../api/steps'
import { makeStepImage } from '../test/makeStep'
import { StepImages } from './StepImages'

function renderImages(images: StepImage[] = []) {
    const onChange = vi.fn()
    render(<StepImages stepId="s1" images={images} onChange={onChange} />)
    return { onChange, user: userEvent.setup() }
}

const photo = () => new File(['jpg'], 'fore.jpg', { type: 'image/jpeg' })
const json = (body: unknown, status: number) => new Response(JSON.stringify(body), { status })

afterEach(() => {
    vi.restoreAllMocks()
})

describe('StepImages', () => {
    it('shows each image as a link to the full size image', () => {
        renderImages([makeStepImage('a.jpg'), makeStepImage('b.png')])

        expect(screen.getByRole('img', { name: 'a.jpg' })).toHaveAttribute('src', '/api/uploads/a.jpg')
        expect(screen.getByRole('img', { name: 'b.png' }).closest('a')).toHaveAttribute('href', '/api/uploads/b.png')
    })

    it('adds uploaded images after the existing ones', async () => {
        const existing = makeStepImage('a.jpg')
        const uploaded = makeStepImage('fore.jpg')
        const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(json([uploaded], 201))
        const { user, onChange } = renderImages([existing])

        await user.upload(screen.getByLabelText('Lägg till bilder'), photo())

        expect(fetchMock.mock.calls[0][0]).toBe('/api/steps/s1/images')
        expect(onChange).toHaveBeenCalledWith([existing, uploaded])
    })

    it('shows the error when the upload is rejected', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(json({ error: 'fore.jpg är större än 10 MB' }, 400))
        const { user, onChange } = renderImages()

        await user.upload(screen.getByLabelText('Lägg till bilder'), photo())

        expect(await screen.findByRole('alert')).toHaveTextContent('fore.jpg är större än 10 MB')
        expect(onChange).not.toHaveBeenCalled()
    })

    it('shows that it is working while the upload is running', async () => {
        vi.spyOn(globalThis, 'fetch').mockReturnValue(new Promise(() => {}))
        const { user } = renderImages()

        await user.upload(screen.getByLabelText('Lägg till bilder'), photo())

        expect(screen.getByText('Vänta…')).toBeInTheDocument()
    })

    it('removes an image after confirming', async () => {
        vi.spyOn(window, 'confirm').mockReturnValue(true)
        const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }))
        const kept = makeStepImage('b.png')
        const { user, onChange } = renderImages([{ ...makeStepImage('a.jpg'), id: 'img-a' }, kept])

        await user.click(screen.getByRole('button', { name: 'Ta bort bilden a.jpg' }))

        expect(fetchMock).toHaveBeenCalledWith('/api/images/img-a', { method: 'DELETE' })
        expect(onChange).toHaveBeenCalledWith([kept])
    })

    it('keeps the image when the confirmation is cancelled', async () => {
        vi.spyOn(window, 'confirm').mockReturnValue(false)
        const fetchMock = vi.spyOn(globalThis, 'fetch')
        const { user, onChange } = renderImages([makeStepImage('a.jpg')])

        await user.click(screen.getByRole('button', { name: 'Ta bort bilden a.jpg' }))

        expect(fetchMock).not.toHaveBeenCalled()
        expect(onChange).not.toHaveBeenCalled()
    })

    it('shows the error when an image cannot be removed', async () => {
        vi.spyOn(window, 'confirm').mockReturnValue(true)
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(json({ error: 'Bilden finns inte' }, 404))
        const { user, onChange } = renderImages([makeStepImage('a.jpg')])

        await user.click(screen.getByRole('button', { name: 'Ta bort bilden a.jpg' }))

        expect(await screen.findByRole('alert')).toHaveTextContent('Bilden finns inte')
        expect(onChange).not.toHaveBeenCalled()
    })
})
