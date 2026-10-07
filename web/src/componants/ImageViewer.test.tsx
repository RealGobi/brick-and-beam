import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { makeStepImage } from '../test/makeStep'
import { ImageViewer } from './ImageViewer'

const images = [makeStepImage('fore.jpg'), makeStepImage('mitten.jpg'), makeStepImage('efter.jpg')]

function renderViewer(startIndex = 0, shown = images) {
    const onClose = vi.fn()
    render(<ImageViewer images={shown} startIndex={startIndex} onClose={onClose} />)
    return { onClose, user: userEvent.setup() }
}

const shownImage = () => screen.getByRole('dialog').querySelector('img')

describe('ImageViewer', () => {
    it('shows the chosen image with its name and position', () => {
        renderViewer(1)

        expect(shownImage()).toHaveAttribute('src', '/api/uploads/mitten.jpg')
        expect(screen.getByText('2 / 3')).toBeInTheDocument()
        expect(screen.getByRole('dialog')).toHaveAccessibleName('Bild 2 av 3: mitten.jpg')
    })

    it('moves to the next and previous image with the buttons', async () => {
        const { user } = renderViewer(0)

        await user.click(screen.getByRole('button', { name: 'Nästa bild' }))
        expect(shownImage()).toHaveAttribute('src', '/api/uploads/mitten.jpg')

        await user.click(screen.getByRole('button', { name: 'Föregående bild' }))
        expect(shownImage()).toHaveAttribute('src', '/api/uploads/fore.jpg')
    })

    it('wraps around from the last image to the first and back', async () => {
        const { user } = renderViewer(2)

        await user.click(screen.getByRole('button', { name: 'Nästa bild' }))
        expect(shownImage()).toHaveAttribute('src', '/api/uploads/fore.jpg')

        await user.click(screen.getByRole('button', { name: 'Föregående bild' }))
        expect(shownImage()).toHaveAttribute('src', '/api/uploads/efter.jpg')
    })

    it('moves between images with the arrow keys', async () => {
        const { user } = renderViewer(0)

        await user.keyboard('{ArrowRight}{ArrowRight}')
        expect(shownImage()).toHaveAttribute('src', '/api/uploads/efter.jpg')

        await user.keyboard('{ArrowLeft}')
        expect(shownImage()).toHaveAttribute('src', '/api/uploads/mitten.jpg')
    })

    it('closes on Escape, on the close button and on a click outside the image', async () => {
        const { user, onClose } = renderViewer(0)

        await user.keyboard('{Escape}')
        await user.click(screen.getByRole('button', { name: 'Stäng' }))
        await user.click(screen.getByRole('dialog'))

        expect(onClose).toHaveBeenCalledTimes(3)
    })

    it('stays open when the image itself is clicked', async () => {
        const { user, onClose } = renderViewer(0)

        await user.click(shownImage()!)

        expect(onClose).not.toHaveBeenCalled()
    })

    it('hides the navigation when there is only one image', () => {
        renderViewer(0, [makeStepImage('ensam.jpg')])

        expect(screen.queryByRole('button', { name: 'Nästa bild' })).not.toBeInTheDocument()
        expect(screen.queryByText('1 / 1')).not.toBeInTheDocument()
    })

    it('links to the original image', () => {
        renderViewer(0)

        expect(screen.getByRole('link', { name: 'Öppna original' })).toHaveAttribute('href', '/api/uploads/fore.jpg')
    })

    it('puts focus on the close button and locks page scrolling while open', () => {
        const { unmount } = render(<ImageViewer images={images} startIndex={0} onClose={vi.fn()} />)

        expect(screen.getByRole('button', { name: 'Stäng' })).toHaveFocus()
        expect(document.body.style.overflow).toBe('hidden')

        unmount()
        expect(document.body.style.overflow).toBe('')
    })
})
