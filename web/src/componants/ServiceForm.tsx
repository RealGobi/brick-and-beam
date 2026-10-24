import { useState, type FormEvent } from 'react'
import { createService, updateService, uploadServiceImages, type NewServiceInput, type ServiceEntry } from '../api/services'
import { acceptedImageTypes } from '../api/steps'
import { checkImageFiles } from '../utils/checkImageFiles'
import { todayIso } from '../utils/formatProduct'
import './Form.css'

type ServiceFormProps = {
    productId: string
    /** The service to edit. Leave out to document a new service. */
    service?: ServiceEntry
    /** Gets a warning when a new service was saved but its images could not be uploaded. */
    onSaved: (service: ServiceEntry, warning?: string) => void
    onCancel: () => void
}

// Form inputs always hold strings, an empty cost is turned into null when saving
type FormValues = {
    name: string
    description: string
    performedOn: string
    performedBy: string
    cost: string
}

function toFormValues(service: ServiceEntry | undefined): FormValues {
    if (!service) return { name: '', description: '', performedOn: todayIso(), performedBy: '', cost: '' }
    return {
        name: service.name,
        description: service.description,
        performedOn: service.performedOn,
        performedBy: service.performedBy,
        cost: service.cost === null ? '' : String(service.cost),
    }
}

function toServiceInput(values: FormValues): NewServiceInput {
    return {
        name: values.name.trim(),
        description: values.description.trim(),
        performedOn: values.performedOn,
        performedBy: values.performedBy.trim(),
        cost: values.cost === '' ? null : Number(values.cost),
    }
}

/**
 * Form for documenting or editing a service. A new service can get images right away,
 * the images of an existing one are handled on its card.
 */
export function ServiceForm({ productId, service, onSaved, onCancel }: ServiceFormProps) {
    const [values, setValues] = useState(() => toFormValues(service))
    const [files, setFiles] = useState<File[]>([])
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const saveLabel = service ? 'Spara ändringar' : 'Spara service'

    // value and onChange for an input bound to one field
    const bind = (field: keyof FormValues) => ({
        value: values[field],
        onChange: (event: { target: { value: string } }) =>
            setValues((previous) => ({ ...previous, [field]: event.target.value })),
    })

    /** Creates the service, then uploads the images. The service is kept even if the upload fails. */
    async function createWithImages(): Promise<void> {
        const created = await createService(productId, toServiceInput(values))
        if (files.length === 0) {
            onSaved(created)
            return
        }

        try {
            onSaved({ ...created, images: await uploadServiceImages(created.id, files) })
        } catch (uploadError) {
            const reason = uploadError instanceof Error ? uploadError.message : 'okänt fel'
            onSaved(created, `Servicen sparades, men bilderna kunde inte laddas upp (${reason}). Försök igen på servicen.`)
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
            if (service) onSaved(await updateService(service.id, toServiceInput(values)))
            else await createWithImages()
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : 'Kunde inte spara servicen')
            setSaving(false)
        }
    }

    return (
        <form className="project-form" onSubmit={handleSubmit}>
            <div className="field-row">
                <label className="field">
                    <span>Vad gjordes</span>
                    <input required maxLength={200} placeholder="t.ex. Filterbyte" {...bind('name')} />
                </label>
                <label className="field">
                    <span>Datum</span>
                    <input required type="date" {...bind('performedOn')} />
                </label>
            </div>

            <label className="field">
                <span>Beskrivning</span>
                <textarea rows={3} maxLength={5000} {...bind('description')} />
            </label>

            <div className="field-row">
                <label className="field">
                    <span>Utförd av</span>
                    <input maxLength={200} placeholder="t.ex. företag eller Själv" {...bind('performedBy')} />
                </label>
                <label className="field">
                    <span>Kostnad (kr)</span>
                    <input type="number" min={0} step={1} {...bind('cost')} />
                </label>
            </div>

            {!service && (
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
