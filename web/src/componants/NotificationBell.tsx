import { useEffect, useId, useState } from 'react'
import type { Notification } from '../api/notifications'
import { NotificationList } from './NotificationList'
import './NotificationBell.css'

/** A bell in the menu with the number of things to do. Clicking it opens the list. */
export function NotificationBell({ notifications }: { notifications: Notification[] }) {
    const [open, setOpen] = useState(false)
    const panelId = useId()
    const count = notifications.length
    const overdue = notifications.some((notice) => notice.overdue)

    // Escape closes the list, like other menus
    useEffect(() => {
        if (!open) return
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setOpen(false)
        }
        window.addEventListener('keydown', closeOnEscape)
        return () => window.removeEventListener('keydown', closeOnEscape)
    }, [open])

    return (
        <div className="notification-bell">
            <button
                type="button"
                className="notification-bell-button"
                aria-expanded={open}
                aria-controls={panelId}
                aria-label={count === 0 ? 'Påminnelser, inget att göra' : `Påminnelser, ${count} att göra`}
                onClick={() => setOpen((previous) => !previous)}
            >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                    <path d="M6 9a6 6 0 1 1 12 0c0 5 2 6.5 2 6.5H4S6 14 6 9Z" strokeLinejoin="round" />
                    <path d="M10 19a2 2 0 0 0 4 0" strokeLinecap="round" />
                </svg>
                <span>Påminnelser</span>
                {count > 0 && (
                    <span className={`notification-bell-count${overdue ? ' is-overdue' : ''}`} aria-hidden="true">
                        {count}
                    </span>
                )}
            </button>

            {open && (
                <div id={panelId} className="notification-bell-panel">
                    {count === 0 ? (
                        <p className="notification-bell-empty">Inget att göra just nu.</p>
                    ) : (
                        <NotificationList notifications={notifications} onNavigate={() => setOpen(false)} />
                    )}
                </div>
            )}
        </div>
    )
}
