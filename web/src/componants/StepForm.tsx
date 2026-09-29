import { useState, type FormEvent } from 'react'
import { createStep, isStepStatus, updateStep, stepStatuses, type Step, type StepStatus } from '../api/steps'
import { stepStatusLabels } from '../utils/formatProject'
import './Form.css'

type StepFormProps = {
    projectId: string
    /** The step to edit. Leave out to create a new step. */
    step?: Step
    onSaved: (step: Step) => void
    onCancel: () => void
}

type FormValues = {
    name: string
    description: string
    status: StepStatus
    date: string
}

const emptyValues: FormValues = { name: '', description: '', status: 'ongoing', date: '' }

function toFormValues(step: Step): FormValues {
    return { name: step.name, description: step.description, status: step.status, date: step.date ?? '' }
}

/** Form for adding or editing a step. Images are handled on the step card. */
export function StepForm({ projectId, step, onSaved, onCancel }: StepFormProps) {
    const [values, setValues] = useState(step ? toFormValues(step) : emptyValues)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const saveLabel = step ? 'Spara ändringar' : 'Spara steg'

    function update<Field extends keyof FormValues>(field: Field, value: FormValues[Field]) {
        setValues((previous) => ({ ...previous, [field]: value }))
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setSaving(true)
        setError(null)

        try {
            const input = {
                name: values.name.trim(),
                description: values.description.trim(),
                status: values.status,
                date: values.date || null,
            }
            onSaved(step ? await updateStep(step.id, input) : await createStep(projectId, input))
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
                    <span>Datum</span>
                    <input type="date" value={values.date} onChange={(e) => update('date', e.target.value)} />
                </label>
            </div>

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
