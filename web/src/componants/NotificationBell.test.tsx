import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import type { Notification } from '../api/notifications'
import { NotificationBell } from './NotificationBell'

function makeNotice(overrides: Partial<Notification> = {}): Notification {
    return {
        key: 'service-p1',
        kind: 'service',
        productId: 'p1',
        productName: 'Värmepump',
        title: 'Dags för service',
        date: '2026-11-01',
        overdue: false,
        ...overrides,
    }
}

function renderBell(notifications: Notification[]) {
    render(
        <MemoryRouter>
            <NotificationBell notifications={notifications} />
        </MemoryRouter>,
    )
    return userEvent.setup()
}

describe('NotificationBell', () => {
    it('shows how many things there are to do', () => {
        renderBell([makeNotice(), makeNotice({ key: 'warranty-p1', kind: 'warranty' })])

        expect(screen.getByRole('button', { name: 'Påminnelser, 2 att göra' })).toBeInTheDocument()
        expect(screen.getByText('2')).not.toHaveClass('is-overdue')
    })

    it('colors the count red when something is overdue', () => {
        renderBell([makeNotice({ overdue: true })])

        expect(screen.getByText('1')).toHaveClass('is-overdue')
    })

    it('opens the list on click, with links to the products', async () => {
        const user = renderBell([makeNotice()])

        await user.click(screen.getByRole('button', { name: /Påminnelser/ }))

        expect(screen.getByRole('button', { name: /Påminnelser/ })).toHaveAttribute('aria-expanded', 'true')
        expect(screen.getByRole('link', { name: /Dags för service/ })).toHaveAttribute('href', '/service/p1')
    })

    it('closes the list when a link is followed or Escape is pressed', async () => {
        const user = renderBell([makeNotice()])

        await user.click(screen.getByRole('button', { name: /Påminnelser/ }))
        await user.click(screen.getByRole('link', { name: /Dags för service/ }))
        expect(screen.queryByRole('link', { name: /Dags för service/ })).not.toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: /Påminnelser/ }))
        await user.keyboard('{Escape}')
        expect(screen.queryByRole('link', { name: /Dags för service/ })).not.toBeInTheDocument()
    })

    it('says there is nothing to do when the list is empty', async () => {
        const user = renderBell([])

        await user.click(screen.getByRole('button', { name: 'Påminnelser, inget att göra' }))

        expect(screen.getByText('Inget att göra just nu.')).toBeInTheDocument()
    })
})
