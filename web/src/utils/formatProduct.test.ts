import { describe, expect, it } from 'vitest'
import { formatServiceInterval, serviceStatus, todayIso } from './formatProduct'

describe('serviceStatus', () => {
    const today = '2026-10-24'

    it('is overdue when the date has passed', () => {
        expect(serviceStatus('2026-10-23', today)).toBe('overdue')
    })

    it('is soon from today up to 30 days ahead', () => {
        expect(serviceStatus('2026-10-24', today)).toBe('soon')
        expect(serviceStatus('2026-11-23', today)).toBe('soon')
    })

    it('is ok more than 30 days ahead', () => {
        expect(serviceStatus('2026-11-24', today)).toBe('ok')
    })

    it('is none without a next service date', () => {
        expect(serviceStatus(null, today)).toBe('none')
    })
})

describe('formatServiceInterval', () => {
    it('describes months and whole years in Swedish', () => {
        expect(formatServiceInterval(1)).toBe('Varje månad')
        expect(formatServiceInterval(2)).toBe('Var 2:a månad')
        expect(formatServiceInterval(6)).toBe('Var 6:e månad')
        expect(formatServiceInterval(12)).toBe('Varje år')
        expect(formatServiceInterval(24)).toBe('Vart 2:a år')
        expect(formatServiceInterval(36)).toBe('Vart 3:e år')
    })

    it('uses :e for 11 and 12, which end in 1 and 2', () => {
        expect(formatServiceInterval(11)).toBe('Var 11:e månad')
        expect(formatServiceInterval(21)).toBe('Var 21:a månad')
    })

    it('says when there is no regular service', () => {
        expect(formatServiceInterval(null)).toBe('Ingen regelbunden service')
    })
})

describe('todayIso', () => {
    it('gives the local date as YYYY-MM-DD', () => {
        expect(todayIso(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05')
    })
})
