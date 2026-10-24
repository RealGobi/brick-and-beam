import { useId, useState, type FormEvent } from 'react'
import { createProduct, updateProduct, type NewProductInput, type Product } from '../api/products'
import './Form.css'

type ProductFormProps = {
    /** The product to edit. Leave out to add a new product. */
    product?: Product
    onSaved: (product: Product) => void
    onCancel: () => void
}

// Form inputs always hold strings, empty dates and interval are turned into null when saving
type FormValues = {
    name: string
    description: string
    manufacturer: string
    model: string
    serialNumber: string
    location: string
    purchaseDate: string
    warrantyUntil: string
    serviceIntervalMonths: string
}

const emptyValues: FormValues = {
    name: '',
    description: '',
    manufacturer: '',
    model: '',
    serialNumber: '',
    location: '',
    purchaseDate: '',
    warrantyUntil: '',
    serviceIntervalMonths: '',
}

function toFormValues(product: Product): FormValues {
    return {
        name: product.name,
        description: product.description,
        manufacturer: product.manufacturer,
        model: product.model,
        serialNumber: product.serialNumber,
        location: product.location,
        purchaseDate: product.purchaseDate ?? '',
        warrantyUntil: product.warrantyUntil ?? '',
        serviceIntervalMonths: product.serviceIntervalMonths === null ? '' : String(product.serviceIntervalMonths),
    }
}

function toProductInput(values: FormValues): NewProductInput {
    return {
        name: values.name.trim(),
        description: values.description.trim(),
        manufacturer: values.manufacturer.trim(),
        model: values.model.trim(),
        serialNumber: values.serialNumber.trim(),
        location: values.location.trim(),
        purchaseDate: values.purchaseDate || null,
        warrantyUntil: values.warrantyUntil || null,
        serviceIntervalMonths: values.serviceIntervalMonths === '' ? null : Number(values.serviceIntervalMonths),
    }
}

/** Form for adding or editing a product. Validation messages come from the server. */
export function ProductForm({ product, onSaved, onCancel }: ProductFormProps) {
    const [values, setValues] = useState(product ? toFormValues(product) : emptyValues)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const saveLabel = product ? 'Spara ändringar' : 'Spara produkt'
    // Unique ids, so the hint can be linked to its input even if the form is on the page twice
    const formId = useId()

    // value and onChange for an input bound to one field
    const bind = (field: keyof FormValues) => ({
        value: values[field],
        onChange: (event: { target: { value: string } }) =>
            setValues((previous) => ({ ...previous, [field]: event.target.value })),
    })

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setSaving(true)
        setError(null)

        try {
            const input = toProductInput(values)
            onSaved(product ? await updateProduct(product.id, input) : await createProduct(input))
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : 'Kunde inte spara produkten')
            setSaving(false)
        }
    }

    return (
        <form className="project-form" onSubmit={handleSubmit}>
            <label className="field">
                <span>Namn</span>
                <input required maxLength={200} placeholder="t.ex. Värmepump" {...bind('name')} />
            </label>

            <label className="field">
                <span>Beskrivning</span>
                <textarea rows={3} maxLength={5000} {...bind('description')} />
            </label>

            <div className="field-row">
                <label className="field">
                    <span>Tillverkare</span>
                    <input maxLength={200} {...bind('manufacturer')} />
                </label>
                <label className="field">
                    <span>Modell</span>
                    <input maxLength={200} {...bind('model')} />
                </label>
            </div>

            <div className="field-row">
                <label className="field">
                    <span>Serienummer</span>
                    <input maxLength={200} {...bind('serialNumber')} />
                </label>
                <label className="field">
                    <span>Placering</span>
                    <input maxLength={200} placeholder="t.ex. Pannrummet" {...bind('location')} />
                </label>
            </div>

            <div className="field-row">
                <label className="field">
                    <span>Inköpsdatum</span>
                    <input type="date" {...bind('purchaseDate')} />
                </label>
                <label className="field">
                    <span>Garanti till och med</span>
                    <input type="date" min={values.purchaseDate || undefined} {...bind('warrantyUntil')} />
                </label>
            </div>

            <div className="field">
                <label htmlFor={`${formId}-interval`}>Serviceintervall (månader)</label>
                <input
                    id={`${formId}-interval`}
                    type="number"
                    min={1}
                    max={600}
                    step={1}
                    aria-describedby={`${formId}-interval-hint`}
                    {...bind('serviceIntervalMonths')}
                />
                <small id={`${formId}-interval-hint`} className="field-hint">
                    Lämna tomt om produkten inte har regelbunden service.
                </small>
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
