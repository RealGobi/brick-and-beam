import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Step } from '../api/steps'
import { makeProject } from '../test/makeProject'
import { makeStep } from '../test/makeStep'
import ProjectDetail from './ProjectDetail'

const project = makeProject({
    id: 'p1',
    name: 'Nytt badrum',
    description: 'Hela badrummet',
    status: 'ongoing',
    startDate: '2026-09-01',
    budget: 85000,
})

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })

/** Answers the project request and the steps request, like the real server. */
function mockServer(steps: Step[]) {
    return vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
        return String(url).endsWith('/steps') ? json(steps) : json(project)
    })
}

function renderPage() {
    render(
        <MemoryRouter initialEntries={['/project/p1']}>
            <Routes>
                <Route path="/project/:projectId" element={<ProjectDetail />} />
            </Routes>
        </MemoryRouter>,
    )
    return userEvent.setup()
}

afterEach(() => {
    vi.restoreAllMocks()
})

describe('ProjectDetail', () => {
    it('loads the project from the id in the address', async () => {
        const fetchMock = mockServer([])

        renderPage()

        expect(await screen.findByRole('heading', { name: 'Nytt badrum' })).toBeInTheDocument()
        expect(fetchMock).toHaveBeenCalledWith('/api/projects/p1')
        expect(fetchMock).toHaveBeenCalledWith('/api/projects/p1/steps')
    })

    it('shows the project details', async () => {
        mockServer([])

        renderPage()

        expect(await screen.findByText('Hela badrummet')).toBeInTheDocument()
        expect(screen.getByText('Pågående')).toBeInTheDocument()
        expect(screen.getByText('Från 1 sep. 2026')).toBeInTheDocument()
        expect(screen.getByText(/85\s000\skr/)).toBeInTheDocument()
    })

    it('shows the steps of the project', async () => {
        mockServer([makeStep({ name: 'Riva kakel' }), makeStep({ name: 'Ny dusch' })])

        renderPage()

        expect(await screen.findByRole('heading', { name: 'Riva kakel' })).toBeInTheDocument()
        expect(screen.getByRole('heading', { name: 'Ny dusch' })).toBeInTheDocument()
    })

    it('shows an empty message when there are no steps', async () => {
        mockServer([])

        renderPage()

        expect(await screen.findByText('Inga steg än.')).toBeInTheDocument()
    })

    it('shows an error and a way back when the project does not exist', async () => {
        // A new response per request, since a response body can only be read once
        vi.spyOn(globalThis, 'fetch').mockImplementation(async () => json({ error: 'Projektet finns inte' }, 404))

        renderPage()

        expect(await screen.findByRole('alert')).toHaveTextContent('Projektet finns inte')
        expect(screen.getByRole('link', { name: '← Alla projekt' })).toHaveAttribute('href', '/project')
    })

    it('places a new step in date order and closes the form', async () => {
        const fetchMock = mockServer([
            makeStep({ name: 'Riva kakel', date: '2026-09-01' }),
            makeStep({ name: 'Ny dusch', date: '2026-09-20' }),
        ])
        const user = renderPage()
        await screen.findByRole('heading', { name: 'Riva kakel' })
        fetchMock.mockResolvedValueOnce(json(makeStep({ name: 'Nya rör', date: '2026-09-10' }), 201))

        await user.click(screen.getByRole('button', { name: 'Nytt steg' }))
        await user.type(screen.getByLabelText('Namn på steget'), 'Nya rör')
        await user.click(screen.getByRole('button', { name: 'Spara steg' }))

        await screen.findByRole('heading', { name: 'Nya rör' })
        const stepNames = screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent)
        expect(stepNames).toEqual(['Riva kakel', 'Nya rör', 'Ny dusch'])
        expect(screen.queryByLabelText('Namn på steget')).not.toBeInTheDocument()
    })
})
