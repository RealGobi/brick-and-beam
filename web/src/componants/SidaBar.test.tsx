import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { SidaBar } from './SidaBar'

// NavLink needs a router, MemoryRouter lets us choose the current URL
function renderAt(path: string, status?: string) {
    render(
        <MemoryRouter initialEntries={[path]}>
            <SidaBar status={status} />
        </MemoryRouter>,
    )
}

describe('SidaBar', () => {
    it('shows links to Översikt and Projekt', () => {
        renderAt('/overview')

        expect(screen.getByRole('link', { name: 'Översikt' })).toHaveAttribute('href', '/overview')
        expect(screen.getByRole('link', { name: 'Projekt' })).toHaveAttribute('href', '/project')
    })

    it('marks the link for the current page as active', () => {
        renderAt('/project')

        expect(screen.getByRole('link', { name: 'Projekt' })).toHaveClass('active')
        expect(screen.getByRole('link', { name: 'Översikt' })).not.toHaveClass('active')
    })

    it('shows the status when one is given', () => {
        renderAt('/overview', 'Online')

        expect(screen.getByText('Online')).toBeInTheDocument()
    })

    it('hides the status when none is given', () => {
        renderAt('/overview')

        expect(screen.queryByText('Online')).not.toBeInTheDocument()
    })
})
