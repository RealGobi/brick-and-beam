import { screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { makeStep } from '../test/makeStep'
import { json, makeExpense, mockServer, renderPage } from '../test/projectDetailPage'

// Changing things on the page is tested in ProjectDetail.editing.test.tsx

afterEach(() => {
    vi.restoreAllMocks()
})

describe('ProjectDetail', () => {
    it('loads the project, its steps and its expenses from the id in the address', async () => {
        const fetchMock = mockServer([])

        renderPage()

        expect(await screen.findByRole('heading', { name: 'Nytt badrum' })).toBeInTheDocument()
        expect(fetchMock).toHaveBeenCalledWith('/api/projects/p1')
        expect(fetchMock).toHaveBeenCalledWith('/api/projects/p1/steps')
        expect(fetchMock).toHaveBeenCalledWith('/api/projects/p1/expenses')
    })

    it('shows the project details', async () => {
        mockServer([])

        renderPage()

        expect(await screen.findByText('Hela badrummet')).toBeInTheDocument()
        expect(screen.getByText('Pågående')).toBeInTheDocument()
        expect(screen.getByText('Från 1 sep. 2026')).toBeInTheDocument()
        const budgetFact = within(screen.getByText('Budget').parentElement!)
        expect(budgetFact.getByText(/85\s000\skr/)).toBeInTheDocument()
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

        const alerts = await screen.findAllByRole('alert')
        expect(alerts[0]).toHaveTextContent('Projektet finns inte')
        expect(screen.getByRole('link', { name: '← Alla projekt' })).toHaveAttribute('href', '/project')
    })
})

describe('ProjectDetail: progress', () => {
    it('shows how many steps are done', async () => {
        mockServer([
            makeStep({ id: 's1', name: 'Riva kakel', status: 'done' }),
            makeStep({ id: 's2', name: 'Ny dusch', status: 'ongoing' }),
        ])

        renderPage()

        expect(await screen.findByText('1 av 2 steg klara')).toBeInTheDocument()
    })

    it('updates the progress right away when a step is marked as done', async () => {
        const fetchMock = mockServer([
            makeStep({ id: 's1', name: 'Riva kakel', status: 'done' }),
            makeStep({ id: 's2', name: 'Ny dusch', status: 'ongoing' }),
        ])
        const user = renderPage()
        await screen.findByText('1 av 2 steg klara')
        fetchMock.mockResolvedValueOnce(json(makeStep({ id: 's2', name: 'Ny dusch', status: 'done' })))

        await user.click(screen.getByRole('button', { name: 'Markera som klar' }))

        expect(await screen.findByText('Alla steg klara')).toBeInTheDocument()
    })
})

describe('ProjectDetail: timeline', () => {
    // jsdom has no scrollIntoView, so give elements one for these tests and remove it afterwards
    const scrollIntoView = vi.fn()

    beforeEach(() => {
        Element.prototype.scrollIntoView = scrollIntoView
    })

    afterEach(() => {
        delete (Element.prototype as Partial<Element>).scrollIntoView
        scrollIntoView.mockReset()
    })

    it('scrolls to and highlights the step that is clicked in the timeline', async () => {
        mockServer([makeStep({ id: 's1', name: 'Riva kakel' }), makeStep({ id: 's2', name: 'Ny dusch' })])
        const user = renderPage()
        await screen.findByRole('heading', { name: 'Ny dusch' })

        await user.click(screen.getByRole('button', { name: /^Ny dusch, / }))

        expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' })
        expect(scrollIntoView.mock.contexts[0]).toBe(document.getElementById('step-s2'))
        expect(document.getElementById('step-s2')).toHaveClass('is-highlighted')
    })
})

describe('ProjectDetail: expenses', () => {
    it('shows how much of the budget is spent', async () => {
        mockServer([], [makeExpense({ amount: 30000 }), makeExpense({ description: 'Rör', amount: 12000 })])

        renderPage()

        // 85 000 kr budget, 42 000 kr spent
        expect(await screen.findByText(/^43\s000\skr kvar$/)).toBeInTheDocument()
    })

    it('shows the cost of each step on its card', async () => {
        mockServer(
            [makeStep({ id: 's1', name: 'Riva kakel' })],
            [makeExpense({ stepId: 's1', amount: 2500 }), makeExpense({ description: 'Mer', stepId: 's1', amount: 500 })],
        )

        renderPage()

        expect(await screen.findByText(/Kostnad 3\s000\skr/)).toBeInTheDocument()
    })

    it('keeps the expenses of a deleted step, now for the whole project', async () => {
        vi.spyOn(window, 'confirm').mockReturnValue(true)
        const fetchMock = mockServer([makeStep({ id: 's1', name: 'Riva kakel' })], [makeExpense({ stepId: 's1' })])
        const user = renderPage()
        await screen.findByRole('heading', { name: 'Riva kakel' })
        fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }))

        await user.click(screen.getByRole('button', { name: 'Ta bort' }))

        expect(await screen.findByText('Övrigt · Hela projektet')).toBeInTheDocument()
        expect(screen.getByText('Kakel')).toBeInTheDocument()
    })
})
