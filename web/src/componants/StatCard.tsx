import type { ProjectStatus } from '../api/projects'
import './StatCard.css'

type StatCardProps = {
    label: string
    value: number
    /** All projects, used to show how large a share this value is */
    total: number
    tone: ProjectStatus
}

/** One number in the stat panel, with a colored dot and a bar showing its share of the total. */
export function StatCard({ label, value, total, tone }: StatCardProps) {
    const share = total === 0 ? 0 : Math.round((value / total) * 100)

    return (
        <div className={`stat-card stat-card-${tone}`}>
            <div className="stat-card-head">
                <span className="stat-card-dot" aria-hidden="true" />
                <span>{label}</span>
            </div>
            <div className="stat-card-value">{value}</div>
            <div
                className="stat-card-bar"
                role="meter"
                aria-label={`${label}: ${share} % av alla projekt`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={share}
            >
                <span style={{ width: `${share}%` }} />
            </div>
        </div>
    )
}
