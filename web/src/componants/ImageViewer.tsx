import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { StepImage } from '../api/steps'
import './ImageViewer.css'

type ImageViewerProps = {
    images: StepImage[]
    startIndex: number
    onClose: () => void
}

// Wraps around, so moving past the last image shows the first and the other way round
const wrapIndex = (index: number, count: number) => (index + count) % count

/**
 * Shows one image at a time on top of the page. Arrow keys or the buttons move between images,
 * Escape, the close button or a click outside the image closes it.
 */
export function ImageViewer({ images, startIndex, onClose }: ImageViewerProps) {
    const [index, setIndex] = useState(startIndex)
    const closeButton = useRef<HTMLButtonElement>(null)
    const image = images[index]
    const hasSeveral = images.length > 1

    const showPrevious = () => setIndex((current) => wrapIndex(current - 1, images.length))
    const showNext = () => setIndex((current) => wrapIndex(current + 1, images.length))

    useEffect(() => {
        function handleKey(event: KeyboardEvent) {
            if (event.key === 'Escape') onClose()
            if (event.key === 'ArrowLeft') setIndex((current) => wrapIndex(current - 1, images.length))
            if (event.key === 'ArrowRight') setIndex((current) => wrapIndex(current + 1, images.length))
        }
        window.addEventListener('keydown', handleKey)
        return () => window.removeEventListener('keydown', handleKey)
    }, [images.length, onClose])

    useEffect(() => {
        // Move focus into the viewer and stop the page behind it from scrolling.
        // Both are restored on close, focus goes back to the thumbnail that opened it.
        const previouslyFocused = document.activeElement
        const previousOverflow = document.body.style.overflow
        closeButton.current?.focus()
        document.body.style.overflow = 'hidden'

        return () => {
            document.body.style.overflow = previousOverflow
            if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus()
        }
    }, [])

    if (!image) return null

    return createPortal(
        <div
            className="image-viewer"
            role="dialog"
            aria-modal="true"
            aria-label={`Bild ${index + 1} av ${images.length}: ${image.originalName}`}
            onClick={(event) => {
                // Only clicks on the dark backdrop itself close the viewer
                if (event.target === event.currentTarget) onClose()
            }}
        >
            <button ref={closeButton} type="button" className="image-viewer-close" aria-label="Stäng" onClick={onClose}>
                ×
            </button>

            {hasSeveral && (
                <button type="button" className="image-viewer-nav is-previous" aria-label="Föregående bild" onClick={showPrevious}>
                    ‹
                </button>
            )}

            <figure className="image-viewer-figure">
                <img src={image.url} alt={image.originalName} />
                <figcaption>
                    <span>{image.originalName}</span>
                    {hasSeveral && <span>{index + 1} / {images.length}</span>}
                    <a href={image.url} target="_blank" rel="noreferrer">Öppna original</a>
                </figcaption>
            </figure>

            {hasSeveral && (
                <button type="button" className="image-viewer-nav is-next" aria-label="Nästa bild" onClick={showNext}>
                    ›
                </button>
            )}
        </div>,
        document.body,
    )
}
