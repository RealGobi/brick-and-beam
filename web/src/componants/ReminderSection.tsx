import { useEffect, useState } from 'react'
import { announceNotificationsChanged } from '../api/notifications'
import { deleteReminder, fetchReminders, updateReminder, type Reminder } from '../api/reminders'
import { formatDate } from '../utils/formatProject'
import { todayIso } from '../utils/formatProduct'
import { ReminderForm } from './ReminderForm'
import './Reminders.css'

type LoadState = { reminders: Reminder[]; loading: boolean; error: string | null }

// Active reminders first by date, then done ones with the latest done first, like the server
function compareReminders(a: Reminder, b: Reminder): number {
    if ((a.doneAt === null) !== (b.doneAt === null)) return a.doneAt === null ? -1 : 1
    if (a.doneAt === null) return a.dueDate.localeCompare(b.dueDate)
    return (b.doneAt ?? '').localeCompare(a.doneAt ?? '')
}

/** The reminders of a product, with a form for adding one and buttons for marking them done. */
export function ReminderSection({ productId }: { productId: string }) {
    const [state, setState] = useState<LoadState>({ reminders: [], loading: true, error: null })
    const [showForm, setShowForm] = useState(false)
    const [actionError, setActionError] = useState<string | null>(null)

    useEffect(() => {
        // Ignore the result if the page was left before the request finished
        let ignore = false
        fetchReminders(productId)
            .then((reminders) => {
                if (!ignore) setState({ reminders, loading: false, error: null })
            })
            .catch((error: Error) => {
                if (!ignore) setState({ reminders: [], loading: false, error: error.message })
            })
        return () => {
            ignore = true
        }
    }, [productId])

    /** Puts a new or changed reminder in the list (or removes it when null) and updates the bell. */
    function show(reminderId: string, reminder: Reminder | null) {
        setState((previous) => {
            const others = previous.reminders.filter((existing) => existing.id !== reminderId)
            const reminders = reminder ? [...others, reminder].sort(compareReminders) : others
            return { ...previous, reminders }
        })
        announceNotificationsChanged()
    }

    async function run(action: () => Promise<void>, fallbackError: string) {
        setActionError(null)
        try {
            await action()
        } catch (error) {
            setActionError(error instanceof Error ? error.message : fallbackError)
        }
    }

    const toggleDone = (reminder: Reminder) =>
        run(async () => {
            const changed = await updateReminder(reminder.id, { done: reminder.doneAt === null })
            show(reminder.id, changed)
        }, 'Kunde inte ändra påminnelsen')

    const remove = (reminder: Reminder) => {
        if (!window.confirm(`Ta bort påminnelsen "${reminder.title}"?`)) return
        return run(async () => {
            await deleteReminder(reminder.id)
            show(reminder.id, null)
        }, 'Kunde inte ta bort påminnelsen')
    }

    const today = todayIso()

    return (
        <section className="project-steps">
            <div className="section-head">
                <h2>Påminnelser</h2>
                {!showForm && !state.loading && !state.error && (
                    <button type="button" className="button button-primary" onClick={() => setShowForm(true)}>
                        + Ny påminnelse
                    </button>
                )}
            </div>

            {state.loading && <p className="empty">Hämtar påminnelser…</p>}
            {state.error && <p className="form-error" role="alert">Kunde inte hämta påminnelserna. {state.error}</p>}
            {actionError && <p className="form-error" role="alert">{actionError}</p>}

            {showForm && (
                <ReminderForm
                    productId={productId}
                    onSaved={(reminder) => {
                        show(reminder.id, reminder)
                        setShowForm(false)
                    }}
                    onCancel={() => setShowForm(false)}
                />
            )}

            {!state.loading && !state.error && state.reminders.length === 0 && !showForm && (
                <p className="empty">Inga påminnelser. Regelbunden service påminns automatiskt utifrån intervallet.</p>
            )}

            {state.reminders.length > 0 && (
                <ul className="reminder-list">
                    {state.reminders.map((reminder) => {
                        const done = reminder.doneAt !== null
                        const overdue = !done && reminder.dueDate < today
                        return (
                            <li key={reminder.id} className={`reminder${done ? ' is-done' : ''}${overdue ? ' is-overdue' : ''}`}>
                                <div className="reminder-main">
                                    <span className="reminder-title">{reminder.title}</span>
                                    <span className="reminder-date">
                                        {overdue ? 'Försenad, ' : ''}
                                        {formatDate(reminder.dueDate)}
                                    </span>
                                    {reminder.note && <span className="reminder-note">{reminder.note}</span>}
                                </div>
                                <button type="button" className="button" onClick={() => toggleDone(reminder)}>
                                    {done ? 'Ångra' : 'Klar'}
                                </button>
                                <button
                                    type="button"
                                    className="reminder-delete"
                                    aria-label={`Ta bort påminnelsen ${reminder.title}`}
                                    onClick={() => remove(reminder)}
                                >
                                    ×
                                </button>
                            </li>
                        )
                    })}
                </ul>
            )}
        </section>
    )
}
