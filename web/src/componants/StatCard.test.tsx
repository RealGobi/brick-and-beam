import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatCard } from './StatCard'

describe('StatCard', () => {
    it('shows the label and value', () => {
        render(<StatCard label="Aktiva projekt" value={12} icon={null} />)

        expect(screen.getByText('Aktiva projekt')).toBeInTheDocument()
        expect(screen.getByText('12')).toBeInTheDocument()
    })

    it('shows 0 when the value is zero', () => {
        render(<StatCard label="Aktiva projekt" value={0} icon={null} />)

        expect(screen.getByText('0')).toBeInTheDocument()
    })

    it('renders the icon', () => {
        render(<StatCard label="Aktiva projekt" value={1} icon={<svg data-testid="icon" />} />)

        expect(screen.getByTestId('icon')).toBeInTheDocument()
    })
})
