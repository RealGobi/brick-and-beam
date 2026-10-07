import { useState, type ChangeEvent } from 'react'
import { acceptedImageTypes, deleteStepImage, uploadStepImages, type StepImage } from '../api/steps'
import { ImageViewer } from './ImageViewer'
import './StepCard.css'

type StepImagesProps = {
    stepId: string
    images: StepImage[]
    onChange: (images: StepImage[]) => void
}

const errorMessage = (error: unknown, fallback: string) => (error instanceof Error ? error.message : fallback)

/** The images of a step, with buttons for viewing them large, uploading more and removing one. */
export function StepImages({ stepId, images, onChange }: StepImagesProps) {
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState<string | null>(null)
    // Index of the image shown in the viewer, or null when the viewer is closed
    const [viewerIndex, setViewerIndex] = useState<number | null>(null)

    async function handleFilesChosen(event: ChangeEvent<HTMLInputElement>) {
        const input = event.target
        const files = Array.from(input.files ?? [])
        if (files.length === 0) return

        setBusy(true)
        setError(null)
        try {
            onChange([...images, ...(await uploadStepImages(stepId, files))])
        } catch (uploadError) {
            setError(errorMessage(uploadError, 'Kunde inte ladda upp bilderna'))
        } finally {
            setBusy(false)
            // Clear the picker so the same file can be chosen again after an error
            input.value = ''
        }
    }

    async function handleDelete(image: StepImage) {
        if (!window.confirm(`Ta bort bilden ${image.originalName}?`)) return

        setBusy(true)
        setError(null)
        try {
            await deleteStepImage(image.id)
            onChange(images.filter((existing) => existing.id !== image.id))
        } catch (deleteError) {
            setError(errorMessage(deleteError, 'Kunde inte ta bort bilden'))
        } finally {
            setBusy(false)
        }
    }

    return (
        <>
            {images.length > 0 && (
                <ul className="step-images">
                    {images.map((image, index) => (
                        <li key={image.id}>
                            <button
                                type="button"
                                className="step-image-open"
                                aria-label={`Visa bilden ${image.originalName}`}
                                onClick={() => setViewerIndex(index)}
                            >
                                <img src={image.url} alt={image.originalName} loading="lazy" />
                            </button>
                            <button
                                type="button"
                                className="step-image-delete"
                                aria-label={`Ta bort bilden ${image.originalName}`}
                                disabled={busy}
                                onClick={() => handleDelete(image)}
                            >
                                ×
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {viewerIndex !== null && (
                <ImageViewer images={images} startIndex={viewerIndex} onClose={() => setViewerIndex(null)} />
            )}

            {error && <p className="form-error" role="alert">{error}</p>}

            <label className={`button step-upload${busy ? ' is-disabled' : ''}`}>
                {busy ? 'Vänta…' : 'Lägg till bilder'}
                <input
                    type="file"
                    className="visually-hidden"
                    accept={acceptedImageTypes.join(',')}
                    multiple
                    disabled={busy}
                    onChange={handleFilesChosen}
                />
            </label>
        </>
    )
}
