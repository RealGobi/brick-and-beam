import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Project } from '../api/projects'
import { makeProject } from '../test/makeProject'
import Dashboard from './Dashboard'

function mockProjects(projects: Project[]) {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(projects)))
}

function renderDashboard() {
    render(
        <MemoryRouter>
            <Dashboard />
        </MemoryRouter>,
    )
}

// Each StatCard shows its label and value in the same card. Search only the stat panel,
// since project cards below show the same words as status badges.
function statValue(label: string) {
    const panel = within(screen.getByRole('region', { name: 'Projekt per status' }))
    const card = panel.getByText(label).closest('.stat-card')
    if (!(card instanceof HTMLElement)) throw new Error(`No stat card for ${label}`)
    return within(card)
}

afterEach(() => {
    vi.restoreAllMocks()
})

describe('Dashboard', () => {
    it('shows a loading message while projects are fetched', () => {
        vi.spyOn(globalThis, 'fetch').mockReturnValue(new Promise(() => {}))

        renderDashboard()

        expect(screen.getByText('Hämtar projekt…')).toBeInTheDocument()
    })

    it('shows the latest projects', async () => {
        mockProjects([
            makeProject({ name: 'Nytt badrum', status: 'ongoing' }),
            makeProject({ name: 'Altan', status: 'planned' }),
        ])

        renderDashboard()

        expect(await screen.findByText('Nytt badrum')).toBeInTheDocument()
        expect(screen.getByText('Altan')).toBeInTheDocument()
    })

    it('counts projects per status', async () => {
        mockProjects([
            makeProject({ name: 'Kök', status: 'done' }),
            makeProject({ name: 'Badrum', status: 'ongoing' }),
            makeProject({ name: 'Tak', status: 'ongoing' }),
        ])

        renderDashboard()
        await screen.findByText('Kök')

        expect(statValue('Färdiga').getByText('1')).toBeInTheDocument()
        expect(statValue('Pågående').getByText('2')).toBeInTheDocument()
        expect(statValue('Planerade').getByText('0')).toBeInTheDocument()
    })

    it('shows at most five projects', async () => {
        mockProjects(['A', 'B', 'C', 'D', 'E', 'F'].map((name) => makeProject({ name })))

        renderDashboard()

        expect(await screen.findAllByRole('heading', { level: 3 })).toHaveLength(5)
        expect(screen.queryByText('F')).not.toBeInTheDocument()
    })

    it('links each project card to its project page', async () => {
        mockProjects([makeProject({ id: 'p1', name: 'Altan' })])

        renderDashboard()

        expect(await screen.findByRole('link', { name: /Altan/ })).toHaveAttribute('href', '/project/p1')
    })

    it('shows the share of projects per status in the bars', async () => {
        mockProjects([
            makeProject({ name: 'Kök', status: 'done' }),
            makeProject({ name: 'Tak', status: 'planned' }),
            makeProject({ name: 'Altan', status: 'planned' }),
            makeProject({ name: 'Garage', status: 'planned' }),
        ])

        renderDashboard()
        await screen.findByText('Kök')

        expect(statValue('Färdiga').getByRole('meter')).toHaveAttribute('aria-valuenow', '25')
        expect(statValue('Planerade').getByRole('meter')).toHaveAttribute('aria-valuenow', '75')
    })

    it('shows an empty message and a way to add a project when there are none', async () => {
        mockProjects([])

        renderDashboard()

        expect(await screen.findByText('Inga projekt än.')).toBeInTheDocument()
        expect(screen.getByRole('link', { name: '+ Lägg till projekt' })).toHaveAttribute('href', '/project?nytt')
    })

    it('links the Nytt projekt button to the project form', async () => {
        mockProjects([])

        renderDashboard()

        expect(screen.getByRole('link', { name: '+ Nytt projekt' })).toHaveAttribute('href', '/project?nytt')
    })

    it('shows an error when the projects cannot be fetched', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 500 }))

        renderDashboard()

        expect(await screen.findByRole('alert')).toHaveTextContent('Kunde inte hämta projekten')
    })
})
