import { useState, type FormEvent } from 'react'
import {
    createProject,
    isProjectStatus,
    projectStatuses,
    type NewProjectInput,
    type Project,
    type ProjectStatus,
} from '../api/projects'
import { statusLabels } from '../utils/formatProject'
import './Form.css'

type NewProjectFormProps = {
    onCreated: (project: Project) => void
    onCancel: () => void
}

// Form inputs always hold strings, empty fields are turned into null when saving
type FormValues = {
    name: string
    description: string
    status: ProjectStatus
    startDate: string
    endDate: string
    budget: string
}

const emptyValues: FormValues = {
    name: '',
    description: '',
    status: 'planned',
    startDate: '',
    endDate: '',
    budget: '',
}

function toNewProjectInput(values: FormValues): NewProjectInput {
    return {
        name: values.name.trim(),
        description: values.description.trim(),
        status: values.status,
        startDate: values.startDate || null,
        endDate: values.endDate || null,
        budget: values.budget === '' ? null : Number(values.budget),
    }
}

/** Form for creating a project. Validation messages come from the server. */
export function NewProjectForm({ onCreated, onCancel }: NewProjectFormProps) {
    const [values, setValues] = useState(emptyValues)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    function update<Field extends keyof FormValues>(field: Field, value: FormValues[Field]) {
        setValues((previous) => ({ ...previous, [field]: value }))
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setSaving(true)
        setError(null)

        try {
            onCreated(await createProject(toNewProjectInput(values)))
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : 'Kunde inte spara projektet')
            setSaving(false)
        }
    }

    return (
        <form className="project-form" onSubmit={handleSubmit}>
            <label className="field">
                <span>Namn</span>
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
                            if (isProjectStatus(e.target.value)) update('status', e.target.value)
                        }}
                    >
                        {projectStatuses.map((status) => (
                            <option key={status} value={status}>{statusLabels[status]}</option>
                        ))}
                    </select>
                </label>

                <label className="field">
                    <span>Budget (kr)</span>
                    <input
                        type="number"
                        min={0}
                        step={1}
                        value={values.budget}
                        onChange={(e) => update('budget', e.target.value)}
                    />
                </label>
            </div>

            <div className="field-row">
                <label className="field">
                    <span>Startdatum</span>
                    <input type="date" value={values.startDate} onChange={(e) => update('startDate', e.target.value)} />
                </label>

                <label className="field">
                    <span>Slutdatum</span>
                    <input
                        type="date"
                        min={values.startDate || undefined}
                        value={values.endDate}
                        onChange={(e) => update('endDate', e.target.value)}
                    />
                </label>
            </div>

            {error && <p className="form-error" role="alert">{error}</p>}

            <div className="form-actions">
                <button type="button" className="button" onClick={onCancel}>Avbryt</button>
                <button type="submit" className="button button-primary" disabled={saving}>
                    {saving ? 'Sparar…' : 'Spara projekt'}
                </button>
            </div>
        </form>
    )
}
