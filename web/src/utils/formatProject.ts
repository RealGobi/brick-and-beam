import type { ProjectStatus } from '../api/projects'
import type { StepStatus } from '../api/steps'

export const statusLabels: Record<ProjectStatus, string> = {
    planned: 'Planerad',
    ongoing: 'Pågående',
    done: 'Färdig',
}

export const stepStatusLabels: Record<StepStatus, string> = {
    ongoing: 'Pågående',
    done: 'Klar',
}

const dateFormat = new Intl.DateTimeFormat('sv-SE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    // "YYYY-MM-DD" is parsed as UTC midnight, so format in UTC to keep the same day
    timeZone: 'UTC',
})

const budgetFormat = new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: 'SEK',
    maximumFractionDigits: 0,
})

/** "2026-09-01" → "1 sep. 2026" */
export function formatDate(isoDate: string): string {
    return dateFormat.format(new Date(isoDate))
}

/** Describes a start and end date that may each be missing. */
export function formatPeriod(startDate: string | null, endDate: string | null): string {
    if (startDate && endDate) return `${formatDate(startDate)} – ${formatDate(endDate)}`
    if (startDate) return `Från ${formatDate(startDate)}`
    if (endDate) return `Till ${formatDate(endDate)}`
    return 'Inget datum'
}

/** 85000 → "85 000 kr" */
export function formatBudget(budget: number | null): string {
    if (budget === null) return 'Ingen budget'
    return budgetFormat.format(budget)
}

// No fixed time zone: a timestamp should show the day it was in the user's own time
const timestampFormat = new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' })

/** "2026-09-29T17:41:34.000Z" → "29 sep. 2026", in the user's local time */
export function formatTimestamp(isoTimestamp: string): string {
    return timestampFormat.format(new Date(isoTimestamp))
}
