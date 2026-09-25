import type { ReactNode } from 'react'
import './StatCard.css'

type StatCardProps = {
    label: string
    value: number
    icon: ReactNode
}

export function StatCard({ label, value, icon }: StatCardProps) {

    return (
        <div className="stat-card">
            <div className="stat-card-head">
                <span>{label}</span>
                <span className="stat-card-icon">{icon}</span>
            </div>
            <div className="stat-card-value">{value}</div>
        </div>
    )
}
