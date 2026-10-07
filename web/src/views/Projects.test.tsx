import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Project } from '../api/projects'
import { makeProject } from '../test/makeProject'
import Projects from './Projects'

function mockProjects(projects: Project[]) {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(projects)))
}

// Project names are links and the form is opened through the address, both need a router
function renderProjects(path = '/project') {
    render(
        <MemoryRouter initialEntries={[path]}>
            <Projects />
        </MemoryRouter>,
    )
}

afterEach(() => {
    vi.restoreAllMocks()
})

describe('Projects', () => {
    it('shows a loading message while projects are fetched', () => {
        vi.spyOn(globalThis, 'fetch').mockReturnValue(new Promise(() => {}))

        renderProjects()

        expect(screen.getByText('Hämtar projekt…')).toBeInTheDocument()
    })

    it('shows every project, not only the first five', async () => {
        mockProjects(['A', 'B', 'C', 'D', 'E', 'F'].map((name) => makeProject({ name })))

        renderProjects()

        expect(await screen.findAllByRole('listitem')).toHaveLength(6)
    })

    it('shows the details of a project', async () => {
        mockProjects([
            makeProject({
                id: 'p1',
                name: 'Nytt badrum',
                description: 'Byta kakel',
                status: 'ongoing',
                startDate: '2026-09-01',
                endDate: '2026-10-15',
                budget: 85000,
            }),
        ])

        renderProjects()
        const row = within(await screen.findByRole('listitem'))

        expect(row.getByRole('link', { name: 'Nytt badrum' })).toHaveAttribute('href', '/project/p1')
        expect(row.getByText('Byta kakel')).toBeInTheDocument()
        expect(row.getByText('Pågående')).toBeInTheDocument()
        expect(row.getByText('1 sep. 2026 – 15 okt. 2026')).toBeInTheDocument()
        expect(row.getByText(/85\s000\skr/)).toBeInTheDocument()
    })

    it('shows placeholders when dates and budget are missing', async () => {
        mockProjects([makeProject()])

        renderProjects()

        expect(await screen.findByText('Inget datum')).toBeInTheDocument()
        expect(screen.getByText('Ingen budget')).toBeInTheDocument()
    })

    it('shows an empty message when there are no projects', async () => {
        mockProjects([])

        renderProjects()

        expect(await screen.findByText('Inga projekt än.')).toBeInTheDocument()
    })

    it('shows an error when the projects cannot be fetched', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 500 }))

        renderProjects()

        expect(await screen.findByRole('alert')).toHaveTextContent('Kunde inte hämta projekten')
    })

    it('opens the form when Nytt projekt is clicked', async () => {
        mockProjects([])
        const user = userEvent.setup()
        renderProjects()

        await user.click(screen.getByRole('button', { name: '+ Nytt projekt' }))

        expect(screen.getByLabelText('Namn')).toBeInTheDocument()
    })

    it('opens the form right away when the address asks for a new project', async () => {
        mockProjects([])

        renderProjects('/project?nytt')

        expect(screen.getByLabelText('Namn')).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: '+ Nytt projekt' })).not.toBeInTheDocument()
    })

    it('closes the form opened from the address when Avbryt is clicked', async () => {
        mockProjects([])
        const user = userEvent.setup()
        renderProjects('/project?nytt')

        await user.click(screen.getByRole('button', { name: 'Avbryt' }))

        await waitFor(() => expect(screen.queryByLabelText('Namn')).not.toBeInTheDocument())
    })

    it('adds a created project to the top of the list and closes the form', async () => {
        const created = makeProject({ name: 'Altan' })
        vi.spyOn(globalThis, 'fetch')
            .mockResolvedValueOnce(new Response(JSON.stringify([makeProject({ name: 'Kök' })])))
            .mockResolvedValueOnce(new Response(JSON.stringify(created), { status: 201 }))
        const user = userEvent.setup()
        renderProjects()
        await screen.findByText('Kök')

        await user.click(screen.getByRole('button', { name: '+ Nytt projekt' }))
        await user.type(screen.getByLabelText('Namn'), 'Altan')
        await user.click(screen.getByRole('button', { name: 'Spara projekt' }))

        const rows = await screen.findAllByRole('listitem')
        expect(rows[0]).toHaveTextContent('Altan')
        expect(rows[1]).toHaveTextContent('Kök')
        // The form closes through a change of the address, which can land a moment after the list updates
        await waitFor(() => expect(screen.queryByLabelText('Namn')).not.toBeInTheDocument())
    })
})
