import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { makeProduct } from '../test/makeProduct'
import Service from './Service'

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })

function renderPage(path = '/service') {
    render(
        <MemoryRouter initialEntries={[path]}>
            <Routes>
                <Route path="/service" element={<Service />} />
                <Route path="/service/:productId" element={<p>Produktsidan</p>} />
            </Routes>
        </MemoryRouter>,
    )
    return userEvent.setup()
}

afterEach(() => {
    vi.restoreAllMocks()
})

describe('Service', () => {
    it('lists all products in a table', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(json([makeProduct({ name: 'Värmepump' }), makeProduct({ name: 'FTX' })]))

        renderPage()

        expect(await screen.findByRole('link', { name: 'Värmepump' })).toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'FTX' })).toBeInTheDocument()
    })

    it('shows a hint when there are no products', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(json([]))

        renderPage()

        expect(await screen.findByText(/Inga produkter än/)).toBeInTheDocument()
    })

    it('shows an error when the products cannot be fetched', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(json({}, 500))

        renderPage()

        expect(await screen.findByRole('alert')).toHaveTextContent('Kunde inte hämta produkterna')
    })

    it('opens the form right away when the address asks for a new product', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(json([]))

        renderPage('/service?nytt')

        expect(screen.getByLabelText('Namn')).toBeInTheDocument()
    })

    it('goes to the page of a newly added product', async () => {
        vi.spyOn(globalThis, 'fetch')
            .mockResolvedValueOnce(json([]))
            .mockResolvedValueOnce(json(makeProduct({ id: 'p1', name: 'Värmepump' }), 201))
        const user = renderPage()
        await screen.findByText(/Inga produkter än/)

        await user.click(screen.getByRole('button', { name: '+ Ny produkt' }))
        await user.type(screen.getByLabelText('Namn'), 'Värmepump')
        await user.click(screen.getByRole('button', { name: 'Spara produkt' }))

        expect(await screen.findByText('Produktsidan')).toBeInTheDocument()
    })
})
