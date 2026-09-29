import { useState } from 'react'
import { deleteStep, updateStep, type Step, type StepImage } from '../api/steps'
import { formatDate, stepStatusLabels } from '../utils/formatProject'
import { StepForm } from './StepForm'
import { StepImages } from './StepImages'
import './StepCard.css'

type StepCardProps = {
    step: Step
    onSaved: (step: Step) => void
    onDeleted: (stepId: string) => void
    onImagesChange: (stepId: string, images: StepImage[]) => void
}

/** One step with its images, and buttons for changing status, editing and deleting it. */
export function StepCard({ step, onSaved, onDeleted, onImagesChange }: StepCardProps) {
    const [editing, setEditing] = useState(false)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function run(action: () => Promise<void>, fallbackError: string) {
        setBusy(true)
        setError(null)
        try {
            await action()
        } catch (actionError) {
            setError(actionError instanceof Error ? actionError.message : fallbackError)
        } finally {
            setBusy(false)
        }
    }

    function toggleStatus() {
        const status = step.status === 'done' ? 'ongoing' : 'done'
        return run(async () => onSaved(await updateStep(step.id, { status })), 'Kunde inte ändra status')
    }

    function handleDelete() {
        if (!window.confirm(`Ta bort steget "${step.name}"? Dess bilder tas också bort.`)) return
        return run(async () => {
            await deleteStep(step.id)
            onDeleted(step.id)
        }, 'Kunde inte ta bort steget')
    }

    if (editing) {
        return (
            <StepForm
                projectId={step.projectId}
                step={step}
                onSaved={(saved) => {
                    onSaved(saved)
                    setEditing(false)
                }}
                onCancel={() => setEditing(false)}
            />
        )
    }

    return (
        <article className="step-card">
            <header className="step-card-head">
                <h3>{step.name}</h3>
                <span className={`step-status step-status-${step.status}`}>{stepStatusLabels[step.status]}</span>
            </header>

            <p className="step-card-date">{step.date ? formatDate(step.date) : 'Inget datum'}</p>
            {step.description && <p className="step-card-description">{step.description}</p>}

            <StepImages stepId={step.id} images={step.images} onChange={(images) => onImagesChange(step.id, images)} />

            {error && <p className="form-error" role="alert">{error}</p>}

            <div className="step-actions">
                <button type="button" className="button" disabled={busy} onClick={toggleStatus}>
                    {step.status === 'done' ? 'Markera som pågående' : 'Markera som klar'}
                </button>
                <button type="button" className="button" disabled={busy} onClick={() => setEditing(true)}>
                    Redigera
                </button>
                <button type="button" className="button button-danger" disabled={busy} onClick={handleDelete}>
                    Ta bort
                </button>
            </div>
        </article>
    )
}
