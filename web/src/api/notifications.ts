import { errorFromResponse } from './projects'

export const notificationKinds = ['reminder', 'service', 'warranty'] as const

/** Something that needs attention soon, as returned by GET /api/notifications. */
export type Notification = {
    /** Unique across all kinds */
    key: string
    kind: (typeof notificationKinds)[number]
    productId: string
    productName: string
    title: string
    /** "YYYY-MM-DD" */
    date: string
    overdue: boolean
}

function isNotification(value: unknown): value is Notification {
    if (typeof value !== 'object' || value === null) return false

    const notice = value as Record<string, unknown>
    return (
        ['key', 'productId', 'productName', 'title', 'date'].every((field) => typeof notice[field] === 'string') &&
        notificationKinds.some((kind) => kind === notice.kind) &&
        typeof notice.overdue === 'boolean'
    )
}

/** Fetches everything that needs attention soon, soonest first. */
export async function fetchNotifications(): Promise<Notification[]> {
    const response = await fetch('/api/notifications')
    if (!response.ok) throw await errorFromResponse(response)

    const body: unknown = await response.json()
    if (!Array.isArray(body) || !body.every(isNotification)) throw new Error('Oväntat svar från servern')

    return body
}

// Event sent within the page when something that affects the notifications has changed
export const NOTIFICATIONS_CHANGED = 'brick-and-beam:notifications-changed'

/** Tells every list of notifications on the page to fetch again, e.g. after a reminder was marked as done. */
export function announceNotificationsChanged(): void {
    window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED))
}
