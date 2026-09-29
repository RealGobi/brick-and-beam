import { useState, type ChangeEvent } from 'react'
import { acceptedImageTypes, uploadStepImages, type Step, type StepImage } from '../api/steps'
import { formatDate, stepStatusLabels } from '../utils/formatProject'
import './StepCard.css'

type StepCardProps = {
    step: Step
    onImagesAdded: (stepId: string, images: StepImage[]) => void
}

/** One step with its images and a button for uploading more. */
export function StepCard({ step, onImagesAdded }: StepCardProps) {
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleFilesChosen(event: ChangeEvent<HTMLInputElement>) {
        const input = event.target
        const files = Array.from(input.files ?? [])
        if (files.length === 0) return

        setUploading(true)
        setError(null)
        try {
            onImagesAdded(step.id, await uploadStepImages(step.id, files))
        } catch (uploadError) {
            setError(uploadError instanceof Error ? uploadError.message : 'Kunde inte ladda upp bilderna')
        } finally {
            setUploading(false)
            // Clear the picker so the same file can be chosen again after an error
            input.value = ''
        }
    }

    return (
        <article className="step-card">
            <header className="step-card-head">
                <h3>{step.name}</h3>
                <span className={`step-status step-status-${step.status}`}>{stepStatusLabels[step.status]}</span>
            </header>

            <p className="step-card-date">{step.date ? formatDate(step.date) : 'Inget datum'}</p>
            {step.description && <p className="step-card-description">{step.description}</p>}

            {step.images.length > 0 && (
                <ul className="step-images">
                    {step.images.map((image) => (
                        <li key={image.id}>
                            <a href={image.url} target="_blank" rel="noreferrer">
                                <img src={image.url} alt={image.originalName} loading="lazy" />
                            </a>
                        </li>
                    ))}
                </ul>
            )}

            {error && <p className="form-error" role="alert">{error}</p>}

            <label className={`button step-upload${uploading ? ' is-disabled' : ''}`}>
                {uploading ? 'Laddar upp…' : 'Lägg till bilder'}
                <input
                    type="file"
                    className="visually-hidden"
                    accept={acceptedImageTypes.join(',')}
                    multiple
                    disabled={uploading}
                    onChange={handleFilesChosen}
                />
            </label>
        </article>
    )
}
