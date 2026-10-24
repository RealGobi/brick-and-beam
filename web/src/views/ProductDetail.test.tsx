import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { makeProduct } from '../test/makeProduct'
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
        const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(json(product))

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
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(json({ error: 'Produkten finns inte' }, 404))

        renderPage()

        expect(await screen.findByRole('alert')).toHaveTextContent('Produkten finns inte')
        expect(screen.getByRole('link', { name: '← All service' })).toHaveAttribute('href', '/service')
    })

    it('saves an edited product and shows the new values', async () => {
        const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(json(product))
        const user = renderPage()
        await screen.findByRole('heading', { name: 'Värmepump' })
        fetchMock.mockResolvedValueOnce(json({ ...product, location: 'Garaget' }))

        await user.click(screen.getByRole('button', { name: 'Redigera' }))
        await user.clear(screen.getByLabelText('Placering'))
        await user.type(screen.getByLabelText('Placering'), 'Garaget')
        await user.click(screen.getByRole('button', { name: 'Spara ändringar' }))

        expect(await screen.findByText('Garaget')).toBeInTheDocument()
    })

    it('goes back to the list after deleting the product', async () => {
        vi.spyOn(window, 'confirm').mockReturnValue(true)
        const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(json(product))
        const user = renderPage()
        await screen.findByRole('heading', { name: 'Värmepump' })
        fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }))

        await user.click(screen.getByRole('button', { name: 'Ta bort produkt' }))

        expect(await screen.findByText('Servicelistan')).toBeInTheDocument()
        expect(fetchMock).toHaveBeenLastCalledWith('/api/products/p1', { method: 'DELETE' })
    })
})
