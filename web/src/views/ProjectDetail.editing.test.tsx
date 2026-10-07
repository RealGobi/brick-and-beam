import { screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { makeStep } from '../test/makeStep'
import { json, makeExpense, mockServer, project, renderPage } from '../test/projectDetailPage'

// Tests for changing things on the project page. Showing it is tested in ProjectDetail.test.tsx

afterEach(() => {
    vi.restoreAllMocks()
})

describe('ProjectDetail: steps', () => {
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

    it('updates a step in the list when its status changes', async () => {
        const fetchMock = mockServer([makeStep({ id: 's1', name: 'Riva kakel', status: 'ongoing' })])
        const user = renderPage()
        await screen.findByRole('heading', { name: 'Riva kakel' })
        fetchMock.mockResolvedValueOnce(json(makeStep({ id: 's1', name: 'Riva kakel', status: 'done' })))

        await user.click(screen.getByRole('button', { name: 'Markera som klar' }))

        expect(await screen.findByRole('button', { name: 'Markera som pågående' })).toBeInTheDocument()
    })

    it('removes a deleted step from the list', async () => {
        vi.spyOn(window, 'confirm').mockReturnValue(true)
        const fetchMock = mockServer([
            makeStep({ id: 's1', name: 'Riva kakel' }),
            makeStep({ id: 's2', name: 'Ny dusch' }),
        ])
        const user = renderPage()
        await screen.findByRole('heading', { name: 'Riva kakel' })
        fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }))

        await user.click(screen.getAllByRole('button', { name: 'Ta bort' })[0])

        await waitFor(() => expect(screen.queryByRole('heading', { name: 'Riva kakel' })).not.toBeInTheDocument())
        expect(screen.getByRole('heading', { name: 'Ny dusch' })).toBeInTheDocument()
    })

    it('shows a warning and the new step when its images could not be uploaded', async () => {
        const fetchMock = mockServer([])
        const user = renderPage()
        await screen.findByText('Inga steg än.')
        fetchMock
            .mockResolvedValueOnce(json(makeStep({ id: 's1', name: 'Riva kakel' }), 201))
            .mockResolvedValueOnce(json({ error: 'Uppladdningen är för stor' }, 413))

        await user.click(screen.getByRole('button', { name: 'Nytt steg' }))
        await user.type(screen.getByLabelText('Namn på steget'), 'Riva kakel')
        await user.upload(screen.getByLabelText(/^Bilder/), new File(['jpg'], 'fore.jpg', { type: 'image/jpeg' }))
        await user.click(screen.getByRole('button', { name: 'Spara steg' }))

        expect(await screen.findByRole('heading', { name: 'Riva kakel' })).toBeInTheDocument()
        expect(screen.getByRole('alert')).toHaveTextContent('Steget sparades, men bilderna kunde inte laddas upp')
    })
})

describe('ProjectDetail: the project', () => {
    it('saves an edited project and shows the new values', async () => {
        const fetchMock = mockServer([])
        const user = renderPage()
        await screen.findByRole('heading', { name: 'Nytt badrum' })
        fetchMock.mockResolvedValueOnce(json({ ...project, name: 'Badrum uppe' }))

        await user.click(screen.getByRole('button', { name: 'Redigera' }))
        await user.clear(screen.getByLabelText('Namn'))
        await user.type(screen.getByLabelText('Namn'), 'Badrum uppe')
        await user.click(screen.getByRole('button', { name: 'Spara ändringar' }))

        expect(await screen.findByRole('heading', { name: 'Badrum uppe' })).toBeInTheDocument()
    })

    it('goes back to the project list after deleting the project', async () => {
        vi.spyOn(window, 'confirm').mockReturnValue(true)
        const fetchMock = mockServer([])
        const user = renderPage()
        await screen.findByRole('heading', { name: 'Nytt badrum' })
        fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }))

        await user.click(screen.getByRole('button', { name: 'Ta bort projekt' }))

        expect(await screen.findByText('Projektlistan')).toBeInTheDocument()
        expect(fetchMock).toHaveBeenLastCalledWith('/api/projects/p1', { method: 'DELETE' })
    })

    it('stays on the page when deleting the project is cancelled', async () => {
        vi.spyOn(window, 'confirm').mockReturnValue(false)
        mockServer([])
        const user = renderPage()
        await screen.findByRole('heading', { name: 'Nytt badrum' })

        await user.click(screen.getByRole('button', { name: 'Ta bort projekt' }))

        expect(screen.getByRole('heading', { name: 'Nytt badrum' })).toBeInTheDocument()
    })
})

describe('ProjectDetail: expenses', () => {
    it('updates the list and the budget summary after editing an expense', async () => {
        const fetchMock = mockServer([], [makeExpense({ id: 'e1', description: 'Kakel', amount: 5000 })])
        const user = renderPage()
        await screen.findByText('Kakel')
        fetchMock.mockResolvedValueOnce(json(makeExpense({ id: 'e1', description: 'Kakel', amount: 15000 })))

        await user.click(screen.getByRole('button', { name: 'Redigera kostnaden Kakel' }))
        await user.clear(screen.getByLabelText('Belopp (kr)'))
        await user.type(screen.getByLabelText('Belopp (kr)'), '15000')
        await user.click(screen.getByRole('button', { name: 'Spara ändringar' }))

        expect(await screen.findByText(/^70\s000\skr kvar$/)).toBeInTheDocument()
    })

    it('adds a new expense to the list and the budget summary', async () => {
        const fetchMock = mockServer([])
        const user = renderPage()
        await screen.findByText('Inga kostnader än.')
        fetchMock.mockResolvedValueOnce(json(makeExpense({ id: 'e1', description: 'Container', amount: 5000 }), 201))

        await user.click(screen.getByRole('button', { name: '+ Lägg till kostnad' }))
        await user.type(screen.getByLabelText('Vad'), 'Container')
        await user.type(screen.getByLabelText('Belopp (kr)'), '5000')
        await user.click(screen.getByRole('button', { name: 'Spara kostnad' }))

        expect(await screen.findByText('Container')).toBeInTheDocument()
        expect(screen.getByText(/^80\s000\skr kvar$/)).toBeInTheDocument()
    })
})
