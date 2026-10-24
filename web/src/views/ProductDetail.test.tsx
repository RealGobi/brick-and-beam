import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ServiceEntry } from '../api/services'
import { makeProduct } from '../test/makeProduct'
import { makeService } from '../test/makeService'
import ProductDetail from './ProductDetail'

const product = makeProduct({
    id: 'p1',
    name: 'Värmepump',
    description: 'Luft/vatten',
    manufacturer: 'Nibe',
    location: 'Pannrummet',
    purchaseDate: '2024-05-01',
    serviceIntervalMonths: 12,
    lastServiceDate: '2025-11-01',
    nextServiceDate: '2026-11-01',
})

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })

/** Answers the product and the services requests like the real server, with a new response each time. */
function mockServer(services: ServiceEntry[] = []) {
    return vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) =>
        String(url).endsWith('/services') ? json(services) : json(product),
    )
}

function renderPage() {
    render(
        <MemoryRouter initialEntries={['/service/p1']}>
            <Routes>
                <Route path="/service/:productId" element={<ProductDetail />} />
                <Route path="/service" element={<p>Servicelistan</p>} />
            </Routes>
        </MemoryRouter>,
    )
    return userEvent.setup()
}

afterEach(() => {
    vi.restoreAllMocks()
})

describe('ProductDetail', () => {
    it('shows the product and the facts that are filled in', async () => {
        const fetchMock = mockServer()

        renderPage()

        expect(await screen.findByRole('heading', { name: 'Värmepump' })).toBeInTheDocument()
        expect(fetchMock).toHaveBeenCalledWith('/api/products/p1')
        expect(screen.getByText('Luft/vatten')).toBeInTheDocument()
        expect(screen.getByText('Nibe')).toBeInTheDocument()
        expect(screen.getByText('Pannrummet')).toBeInTheDocument()
        expect(screen.getByText('Varje år')).toBeInTheDocument()
        expect(screen.getByText('1 nov. 2026')).toBeInTheDocument()
        // Model and serial number are empty, so they are left out
        expect(screen.queryByText('Modell')).not.toBeInTheDocument()
    })

    it('shows an error and a way back when the product does not exist', async () => {
        vi.spyOn(globalThis, 'fetch').mockImplementation(async () => json({ error: 'Produkten finns inte' }, 404))

        renderPage()

        expect((await screen.findAllByRole('alert'))[0]).toHaveTextContent('Produkten finns inte')
        expect(screen.getByRole('link', { name: '← All service' })).toHaveAttribute('href', '/service')
    })

    it('saves an edited product and shows the new values', async () => {
        const fetchMock = mockServer()
        const user = renderPage()
        // The history loads after the product; wait for it, so the next answer goes to the right request
        await screen.findByText('Ingen service dokumenterad än.')
        fetchMock.mockResolvedValueOnce(json({ ...product, location: 'Garaget' }))

        await user.click(screen.getByRole('button', { name: 'Redigera' }))
        await user.clear(screen.getByLabelText('Placering'))
        await user.type(screen.getByLabelText('Placering'), 'Garaget')
        await user.click(screen.getByRole('button', { name: 'Spara ändringar' }))

        expect(await screen.findByText('Garaget')).toBeInTheDocument()
    })

    it('goes back to the list after deleting the product', async () => {
        vi.spyOn(window, 'confirm').mockReturnValue(true)
        const fetchMock = mockServer()
        const user = renderPage()
        // The history loads after the product; wait for it, so the next answer goes to the right request
        await screen.findByText('Ingen service dokumenterad än.')
        fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }))

        await user.click(screen.getByRole('button', { name: 'Ta bort produkt' }))

        expect(await screen.findByText('Servicelistan')).toBeInTheDocument()
        expect(fetchMock).toHaveBeenLastCalledWith('/api/products/p1', { method: 'DELETE' })
    })
})

describe('ProductDetail: service history', () => {
    it('lists the documented services, newest first', async () => {
        mockServer([
            makeService({ id: 's2', name: 'Rengöring', performedOn: '2026-09-15', performedBy: 'Ventilationsteknik', cost: 1500 }),
            makeService({ id: 's1', name: 'Filterbyte', performedOn: '2026-03-01' }),
        ])

        renderPage()

        const names = (await screen.findAllByRole('heading', { level: 3 })).map((heading) => heading.textContent)
        expect(names).toEqual(['Rengöring', 'Filterbyte'])
        expect(screen.getByText(/Ventilationsteknik · 1\s500\skr/)).toBeInTheDocument()
    })

    it('says when no service is documented yet', async () => {
        mockServer([])

        renderPage()

        expect(await screen.findByText('Ingen service dokumenterad än.')).toBeInTheDocument()
    })

    it('adds a new service and refreshes when the next service is due', async () => {
        const fetchMock = mockServer([])
        const user = renderPage()
        await screen.findByText('Ingen service dokumenterad än.')
        fetchMock
            .mockResolvedValueOnce(json(makeService({ id: 's1', name: 'Årsservice', performedOn: '2026-10-20' }), 201))
            .mockResolvedValueOnce(json({ ...product, lastServiceDate: '2026-10-20', nextServiceDate: '2027-10-20' }))

        await user.click(screen.getByRole('button', { name: '+ Ny service' }))
        await user.type(screen.getByLabelText('Vad gjordes'), 'Årsservice')
        await user.clear(screen.getByLabelText('Datum'))
        await user.type(screen.getByLabelText('Datum'), '2026-10-20')
        await user.click(screen.getByRole('button', { name: 'Spara service' }))

        expect(await screen.findByRole('heading', { name: 'Årsservice' })).toBeInTheDocument()
        expect(await screen.findByText('20 okt. 2027')).toBeInTheDocument()
    })
})
