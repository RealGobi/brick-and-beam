/** How urgent the next service is. "none" means the product has no regular service. */
export type ServiceStatus = 'overdue' | 'soon' | 'ok' | 'none'

// A service within this many days counts as "soon"
export const SOON_DAYS = 30

export const serviceStatusLabels: Record<ServiceStatus, string> = {
    overdue: 'Försenad',
    soon: 'Snart',
    ok: 'OK',
    none: 'Inget intervall',
}

/** Today as "YYYY-MM-DD" in the user's own time zone. */
export function todayIso(now = new Date()): string {
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${now.getFullYear()}-${month}-${day}`
}

/** Adds days to a "YYYY-MM-DD" date. */
function addDays(isoDate: string, days: number): string {
    const date = new Date(`${isoDate}T00:00:00Z`)
    date.setUTCDate(date.getUTCDate() + days)
    return date.toISOString().slice(0, 10)
}

/** Overdue when the date has passed, soon within SOON_DAYS days. ISO dates compare correctly as strings. */
export function serviceStatus(nextServiceDate: string | null, today = todayIso()): ServiceStatus {
    if (nextServiceDate === null) return 'none'
    if (nextServiceDate < today) return 'overdue'
    if (nextServiceDate <= addDays(today, SOON_DAYS)) return 'soon'
    return 'ok'
}

/** Swedish ordinal: 1:a, 2:a, 3:e … 21:a, 22:a, but 11:e and 12:e. */
function ordinal(n: number): string {
    const lastTwo = n % 100
    const last = n % 10
    const usesA = (last === 1 || last === 2) && lastTwo !== 11 && lastTwo !== 12
    return `${n}:${usesA ? 'a' : 'e'}`
}

/** 1 → "Varje månad", 6 → "Var 6:e månad", 12 → "Varje år", 24 → "Vart 2:a år", null → "Ingen regelbunden service" */
export function formatServiceInterval(months: number | null): string {
    if (months === null) return 'Ingen regelbunden service'
    if (months % 12 === 0) {
        const years = months / 12
        return years === 1 ? 'Varje år' : `Vart ${ordinal(years)} år`
    }
    return months === 1 ? 'Varje månad' : `Var ${ordinal(months)} månad`
}
