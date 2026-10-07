import { useState, type FormEvent } from 'react'
import {
    acceptedImageTypes,
    createStep,
    isStepPriority,
    isStepStatus,
    stepPriorities,
    stepStatuses,
    updateStep,
    uploadStepImages,
    type NewStepInput,
    type Step,
    type StepPriority,
    type StepStatus,
} from '../api/steps'
import { checkImageFiles } from '../utils/checkImageFiles'
import { stepPriorityLabels, stepStatusLabels } from '../utils/formatProject'
import './Form.css'

type StepFormProps = {
    projectId: string
    /** The step to edit. Leave out to create a new step. */
    step?: Step
    /** Gets a warning when a new step was saved but its images could not be uploaded. */
    onSaved: (step: Step, warning?: string) => void
    onCancel: () => void
}

type FormValues = {
    name: string
    description: string
    status: StepStatus
    priority: StepPriority
    date: string
}

const emptyValues: FormValues = { name: '', description: '', status: 'ongoing', priority: 'normal', date: '' }

function toFormValues(step: Step): FormValues {
    return {
        name: step.name,
        description: step.description,
        status: step.status,
        priority: step.priority,
        date: step.date ?? '',
    }
}

function toStepInput(values: FormValues): NewStepInput {
    return {
        name: values.name.trim(),
        description: values.description.trim(),
        status: values.status,
        priority: values.priority,
        date: values.date || null,
    }
}

/**
 * Form for adding or editing a step. New steps can get images right away,
 * images of an existing step are handled on its card.
 */
export function StepForm({ projectId, step, onSaved, onCancel }: StepFormProps) {
    const [values, setValues] = useState(step ? toFormValues(step) : emptyValues)
    const [files, setFiles] = useState<File[]>([])
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const saveLabel = step ? 'Spara ändringar' : 'Spara steg'

    function update<Field extends keyof FormValues>(field: Field, value: FormValues[Field]) {
        setValues((previous) => ({ ...previous, [field]: value }))
    }

    /** Creates the step, then uploads the images. The step is kept even if the upload fails. */
    async function createWithImages(): Promise<void> {
        const created = await createStep(projectId, toStepInput(values))
        if (files.length === 0) {
            onSaved(created)
            return
        }

        try {
            onSaved({ ...created, images: await uploadStepImages(created.id, files) })
        } catch (uploadError) {
            const reason = uploadError instanceof Error ? uploadError.message : 'okänt fel'
            onSaved(created, `Steget sparades, men bilderna kunde inte laddas upp (${reason}). Försök igen på steget.`)
        }
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        const fileError = checkImageFiles(files)
        if (fileError) {
            setError(fileError)
            return
        }

        setSaving(true)
        setError(null)
        try {
            if (step) onSaved(await updateStep(step.id, toStepInput(values)))
            else await createWithImages()
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : 'Kunde inte spara steget')
            setSaving(false)
        }
    }

    return (
        <form className="project-form" onSubmit={handleSubmit}>
            <label className="field">
                <span>Namn på steget</span>
                <input required maxLength={200} value={values.name} onChange={(e) => update('name', e.target.value)} />
            </label>

            <label className="field">
                <span>Beskrivning</span>
                <textarea
                    rows={3}
                    maxLength={5000}
                    value={values.description}
                    onChange={(e) => update('description', e.target.value)}
                />
            </label>

            <div className="field-row">
                <label className="field">
                    <span>Status</span>
                    <select
                        value={values.status}
                        onChange={(e) => {
                            if (isStepStatus(e.target.value)) update('status', e.target.value)
                        }}
                    >
                        {stepStatuses.map((status) => (
                            <option key={status} value={status}>{stepStatusLabels[status]}</option>
                        ))}
                    </select>
                </label>

                <label className="field">
                    <span>Nivå</span>
                    <select
                        value={values.priority}
                        onChange={(e) => {
                            if (isStepPriority(e.target.value)) update('priority', e.target.value)
                        }}
                    >
                        {stepPriorities.map((priority) => (
                            <option key={priority} value={priority}>{stepPriorityLabels[priority]}</option>
                        ))}
                    </select>
                </label>

                <label className="field">
                    <span>Datum</span>
                    <input type="date" value={values.date} onChange={(e) => update('date', e.target.value)} />
                </label>
            </div>

            {!step && (
                <label className="field">
                    <span>Bilder (valfritt, högst 10 st, max 10 MB var)</span>
                    <input
                        type="file"
                        multiple
                        accept={acceptedImageTypes.join(',')}
                        onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
                    />
                </label>
            )}

            {error && <p className="form-error" role="alert">{error}</p>}

            <div className="form-actions">
                <button type="button" className="button" onClick={onCancel}>Avbryt</button>
                <button type="submit" className="button button-primary" disabled={saving}>
                    {saving ? 'Sparar…' : saveLabel}
                </button>
            </div>
        </form>
    )
}
