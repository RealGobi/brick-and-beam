import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatCard } from './StatCard'

describe('StatCard', () => {
    it('shows the label and value', () => {
        render(<StatCard label="Pågående" value={3} total={4} tone="ongoing" />)

        expect(screen.getByText('Pågående')).toBeInTheDocument()
        expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('shows the share of all projects in the bar', () => {
        render(<StatCard label="Pågående" value={1} total={4} tone="ongoing" />)

        expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '25')
    })

    it('shows an empty bar when there are no projects at all', () => {
        render(<StatCard label="Färdiga" value={0} total={0} tone="done" />)

        expect(screen.getByText('0')).toBeInTheDocument()
        expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '0')
    })

    it('shows a full bar when every project has this status', () => {
        render(<StatCard label="Planerade" value={2} total={2} tone="planned" />)

        expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '100')
    })
})
