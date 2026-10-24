import { errorFromResponse, expectSuccess } from './projects'

/** A reminder on a product, as returned by the API. */
export type Reminder = {
    id: string
    productId: string
    title: string
    /** "YYYY-MM-DD" */
    dueDate: string
    note: string
    /** When it was marked as done, or null while it is still active */
    doneAt: string | null
    createdAt: string
}

export type NewReminderInput = Pick<Reminder, 'title' | 'dueDate' | 'note'>

function isReminder(value: unknown): value is Reminder {
    if (typeof value !== 'object' || value === null) return false

    const reminder = value as Record<string, unknown>
    return (
        ['id', 'productId', 'title', 'dueDate', 'note', 'createdAt'].every((field) => typeof reminder[field] === 'string') &&
        (typeof reminder.doneAt === 'string' || reminder.doneAt === null)
    )
}

/** Reads a JSON response and checks its shape. Throws with the server's message when the request failed. */
async function readResponse<T>(response: Response, isValid: (body: unknown) => body is T): Promise<T> {
    if (!response.ok) throw await errorFromResponse(response)

    const body: unknown = await response.json()
    if (!isValid(body)) throw new Error('Oväntat svar från servern')

    return body
}

const isReminderList = (body: unknown): body is Reminder[] => Array.isArray(body) && body.every(isReminder)

const sendJson = (method: string, url: string, body: unknown) =>
    fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

/** Fetches the reminders of a product: active ones first by date, then done ones. */
export async function fetchReminders(productId: string): Promise<Reminder[]> {
    return readResponse(await fetch(`/api/products/${productId}/reminders`), isReminderList)
}

/** Adds a reminder to a product. */
export async function createReminder(productId: string, input: NewReminderInput): Promise<Reminder> {
    return readResponse(await sendJson('POST', `/api/products/${productId}/reminders`, input), isReminder)
}

/** Changes a reminder, e.g. { done: true } to mark it as done. Fields left out keep their saved value. */
export async function updateReminder(
    reminderId: string,
    changes: Partial<NewReminderInput> & { done?: boolean },
): Promise<Reminder> {
    return readResponse(await sendJson('PATCH', `/api/reminders/${reminderId}`, changes), isReminder)
}

/** Deletes a reminder. */
export async function deleteReminder(reminderId: string): Promise<void> {
    await expectSuccess(await fetch(`/api/reminders/${reminderId}`, { method: 'DELETE' }))
}
