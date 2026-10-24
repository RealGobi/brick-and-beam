import { useState, type FormEvent } from 'react'
import { createReminder, type Reminder } from '../api/reminders'
import './Form.css'

type ReminderFormProps = {
    productId: string
    onSaved: (reminder: Reminder) => void
    onCancel: () => void
}

/** Form for adding a reminder with a title, a date and an optional note. */
export function ReminderForm({ productId, onSaved, onCancel }: ReminderFormProps) {
    const [title, setTitle] = useState('')
    const [dueDate, setDueDate] = useState('')
    const [note, setNote] = useState('')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setSaving(true)
        setError(null)

        try {
            onSaved(await createReminder(productId, { title: title.trim(), dueDate, note: note.trim() }))
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : 'Kunde inte spara påminnelsen')
            setSaving(false)
        }
    }

    return (
        <form className="project-form" onSubmit={handleSubmit}>
            <div className="field-row">
                <label className="field">
                    <span>Påminn om</span>
                    <input
                        required
                        maxLength={200}
                        placeholder="t.ex. Byt batteri"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </label>
                <label className="field">
                    <span>Datum</span>
                    <input required type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </label>
            </div>

            <label className="field">
                <span>Anteckning</span>
                <textarea rows={2} maxLength={5000} value={note} onChange={(e) => setNote(e.target.value)} />
            </label>

            {error && <p className="form-error" role="alert">{error}</p>}

            <div className="form-actions">
                <button type="button" className="button" onClick={onCancel}>Avbryt</button>
                <button type="submit" className="button button-primary" disabled={saving}>
                    {saving ? 'Sparar…' : 'Spara påminnelse'}
                </button>
            </div>
        </form>
    )
}
