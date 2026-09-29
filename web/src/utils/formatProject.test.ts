import { describe, expect, it } from 'vitest'
import { formatBudget, formatDate, formatPeriod } from './formatProject'

// Intl uses non-breaking spaces between the parts, so compare with normal spaces
const normalizeSpaces = (text: string) => text.replace(/\s/g, ' ')

describe('formatDate', () => {
    it('formats a date in Swedish', () => {
        expect(formatDate('2026-09-01')).toBe('1 sep. 2026')
    })

    it('keeps the same day for the first and last day of the year', () => {
        expect(formatDate('2026-01-01')).toBe('1 jan. 2026')
        expect(formatDate('2026-12-31')).toBe('31 dec. 2026')
    })
})

describe('formatPeriod', () => {
    it('shows both dates when start and end are set', () => {
        expect(formatPeriod('2026-09-01', '2026-10-15')).toBe('1 sep. 2026 – 15 okt. 2026')
    })

    it('shows only the start date when there is no end date', () => {
        expect(formatPeriod('2026-09-01', null)).toBe('Från 1 sep. 2026')
    })

    it('shows only the end date when there is no start date', () => {
        expect(formatPeriod(null, '2026-10-15')).toBe('Till 15 okt. 2026')
    })

    it('says there is no date when both are missing', () => {
        expect(formatPeriod(null, null)).toBe('Inget datum')
    })
})

describe('formatBudget', () => {
    it('formats whole kronor with a thousands separator', () => {
        expect(normalizeSpaces(formatBudget(85000))).toBe('85 000 kr')
    })

    it('shows zero as 0 kr', () => {
        expect(normalizeSpaces(formatBudget(0))).toBe('0 kr')
    })

    it('says there is no budget when it is missing', () => {
        expect(formatBudget(null)).toBe('Ingen budget')
    })
})
