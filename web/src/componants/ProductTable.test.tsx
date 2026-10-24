import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Product } from '../api/products'
import { makeProduct } from '../test/makeProduct'
import { ProductTable } from './ProductTable'

function renderTable(products: Product[]) {
    render(
        <MemoryRouter>
            <ProductTable products={products} />
        </MemoryRouter>,
    )
}

// The status depends on today's date, so freeze it
beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 9, 24, 12, 0))
})

afterEach(() => {
    vi.useRealTimers()
})

describe('ProductTable', () => {
    it('shows name, location, last and next service for each product', () => {
        renderTable([
            makeProduct({
                id: 'p1',
                name: 'Värmepump',
                location: 'Pannrummet',
                lastServiceDate: '2025-12-01',
                nextServiceDate: '2026-12-01',
            }),
        ])

        const row = within(screen.getAllByRole('row')[1])
        expect(row.getByRole('link', { name: 'Värmepump' })).toHaveAttribute('href', '/service/p1')
        expect(row.getByText('Pannrummet')).toBeInTheDocument()
        expect(row.getByText('1 dec. 2025')).toBeInTheDocument()
        expect(row.getByText('1 dec. 2026')).toBeInTheDocument()
    })

    it('marks overdue, soon and fine services with a status', () => {
        renderTable([
            makeProduct({ id: 'a', name: 'A', nextServiceDate: '2026-10-01' }),
            makeProduct({ id: 'b', name: 'B', nextServiceDate: '2026-11-10' }),
            makeProduct({ id: 'c', name: 'C', nextServiceDate: '2027-03-01' }),
        ])

        expect(screen.getByText('Försenad')).toHaveClass('service-status-overdue')
        expect(screen.getByText('Snart')).toHaveClass('service-status-soon')
        expect(screen.getByText('OK')).toHaveClass('service-status-ok')
    })

    it('shows dashes for what is not known', () => {
        renderTable([makeProduct({ name: 'Brandvarnare' })])

        // Location, last service, next service and status
        expect(within(screen.getAllByRole('row')[1]).getAllByText('—')).toHaveLength(4)
    })
})
