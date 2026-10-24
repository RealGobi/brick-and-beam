import { useEffect, useState } from 'react'
import { NOTIFICATIONS_CHANGED, fetchNotifications, type Notification } from '../api/notifications'

// Fetch again now and then, so dates that pass while the app is open show up
const REFRESH_MS = 5 * 60 * 1000

/**
 * The current notifications. Fetched when mounted, every five minutes and whenever
 * something on the page announces a change. Stays empty if the server can't be reached.
 */
export function useNotifications(): Notification[] {
    const [notifications, setNotifications] = useState<Notification[]>([])

    useEffect(() => {
        // Ignore answers that arrive after the component is gone
        let active = true

        function refresh() {
            fetchNotifications()
                .then((fetched) => {
                    if (active) setNotifications(fetched)
                })
                // A missing bell count is better than an error message in the menu
                .catch(() => {})
        }

        refresh()
        const timer = setInterval(refresh, REFRESH_MS)
        window.addEventListener(NOTIFICATIONS_CHANGED, refresh)

        return () => {
            active = false
            clearInterval(timer)
            window.removeEventListener(NOTIFICATIONS_CHANGED, refresh)
        }
    }, [])

    return notifications
}
