import type { ProjectStatus } from '../api/projects'
import type { ExpenseCategory } from '../api/expenses'
import type { StepPriority, StepStatus } from '../api/steps'

export const statusLabels: Record<ProjectStatus, string> = {
    planned: 'Planerad',
    ongoing: 'Pågående',
    done: 'Färdig',
}

export const stepStatusLabels: Record<StepStatus, string> = {
    ongoing: 'Pågående',
    done: 'Klar',
}

export const stepPriorityLabels: Record<StepPriority, string> = {
    milestone: 'Milstolpe',
    normal: 'Normal',
    small: 'Liten',
}

/** "3 av 5 steg klara", or a short text when there are no steps or all are done */
export function formatStepProgress(done: number, total: number): string {
    if (total === 0) return 'Inga steg än'
    if (done === total) return 'Alla steg klara'
    return `${done} av ${total} steg klara`
}

export const expenseCategoryLabels: Record<ExpenseCategory, string> = {
    purchase: 'Inköp',
    carpenter: 'Snickare',
    electrician: 'Elektriker',
    plumber: 'Rörmokare',
    painter: 'Målare',
    other: 'Övrigt',
}

/** What the supplier field means for a category: a store for purchases, otherwise a company. */
export function supplierLabel(category: ExpenseCategory): string {
    if (category === 'purchase') return 'Inköpsställe'
    if (category === 'other') return 'Inköpsställe eller företag'
    return 'Företag'
}

const dateFormat = new Intl.DateTimeFormat('sv-SE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    // "YYYY-MM-DD" is parsed as UTC midnight, so format in UTC to keep the same day
    timeZone: 'UTC',
})

const amountFormat = new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: 'SEK',
    maximumFractionDigits: 0,
})

/** "2026-09-01" → "1 sep. 2026" */
export function formatDate(isoDate: string): string {
    return dateFormat.format(new Date(isoDate))
}

const monthFormat = new Intl.DateTimeFormat('sv-SE', { month: 'short', timeZone: 'UTC' })
const monthWithYearFormat = new Intl.DateTimeFormat('sv-SE', { month: 'short', year: 'numeric', timeZone: 'UTC' })

/** "2026-10-08" → "okt.", or "okt. 2026" with the year */
export function formatMonth(isoDate: string, withYear = false): string {
    return (withYear ? monthWithYearFormat : monthFormat).format(new Date(isoDate))
}

/** Describes a start and end date that may each be missing. */
export function formatPeriod(startDate: string | null, endDate: string | null): string {
    if (startDate && endDate) return `${formatDate(startDate)} – ${formatDate(endDate)}`
    if (startDate) return `Från ${formatDate(startDate)}`
    if (endDate) return `Till ${formatDate(endDate)}`
    return 'Inget datum'
}

/** 12000 → "12 000 kr" */
export function formatAmount(amount: number): string {
    return amountFormat.format(amount)
}

/** 85000 → "85 000 kr", or "Ingen budget" when it is not set */
export function formatBudget(budget: number | null): string {
    if (budget === null) return 'Ingen budget'
    return formatAmount(budget)
}

// No fixed time zone: a timestamp should show the day it was in the user's own time
const timestampFormat = new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' })

/** "2026-09-29T17:41:34.000Z" → "29 sep. 2026", in the user's local time */
export function formatTimestamp(isoTimestamp: string): string {
    return timestampFormat.format(new Date(isoTimestamp))
}
