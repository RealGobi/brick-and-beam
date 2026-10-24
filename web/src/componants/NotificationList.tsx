import { Link } from 'react-router'
import type { Notification } from '../api/notifications'
import { formatDate } from '../utils/formatProject'
import './NotificationList.css'

type NotificationListProps = {
    notifications: Notification[]
    /** Called when a link is followed, e.g. to close a menu */
    onNavigate?: () => void
}

/** Notifications as a list, each linking to its product, overdue ones marked in red. */
export function NotificationList({ notifications, onNavigate }: NotificationListProps) {
    return (
        <ul className="notification-list">
            {notifications.map((notice) => (
                <li key={notice.key} className={`notification notification-${notice.kind}${notice.overdue ? ' is-overdue' : ''}`}>
                    <Link to={`/service/${notice.productId}`} className="notification-link" onClick={onNavigate}>
                        <span className="notification-title">{notice.title}</span>
                        <span className="notification-product">{notice.productName}</span>
                    </Link>
                    <span className="notification-date">
                        {notice.overdue ? 'Försenad, ' : ''}
                        {formatDate(notice.date)}
                    </span>
                </li>
            ))}
        </ul>
    )
}
