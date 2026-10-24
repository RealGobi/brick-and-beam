import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { makeProduct } from '../test/makeProduct'
import { ProductForm } from './ProductForm'

const json = (body: unknown, status: number) => new Response(JSON.stringify(body), { status })
const sentBody = (fetchMock: ReturnType<typeof vi.spyOn>) => JSON.parse(String(fetchMock.mock.calls[0][1]?.body))

afterEach(() => {
    vi.restoreAllMocks()
})

describe('ProductForm: new product', () => {
    function renderForm() {
        const onSaved = vi.fn()
        const onCancel = vi.fn()
        render(<ProductForm onSaved={onSaved} onCancel={onCancel} />)
        return { onSaved, onCancel, user: userEvent.setup() }
    }

    it('sends every field, with dates and interval as values', async () => {
        const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(json(makeProduct(), 201))
        const { user } = renderForm()

        await user.type(screen.getByLabelText('Namn'), 'Värmepump')
        await user.type(screen.getByLabelText('Tillverkare'), 'Nibe')
        await user.type(screen.getByLabelText('Modell'), 'F2120')
        await user.type(screen.getByLabelText('Serienummer'), 'SN-1')
        await user.type(screen.getByLabelText('Placering'), 'Pannrummet')
        await user.type(screen.getByLabelText('Inköpsdatum'), '2024-05-01')
        await user.type(screen.getByLabelText('Garanti till och med'), '2029-05-01')
        await user.type(screen.getByLabelText('Serviceintervall (månader)'), '12')
        await user.click(screen.getByRole('button', { name: 'Spara produkt' }))

        expect(fetchMock.mock.calls[0][0]).toBe('/api/products')
        expect(sentBody(fetchMock)).toEqual({
            name: 'Värmepump',
            description: '',
            manufacturer: 'Nibe',
            model: 'F2120',
            serialNumber: 'SN-1',
            location: 'Pannrummet',
            purchaseDate: '2024-05-01',
            warrantyUntil: '2029-05-01',
            serviceIntervalMonths: 12,
        })
    })

    it('sends empty dates and interval as null', async () => {
        const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(json(makeProduct(), 201))
        const { user } = renderForm()

        await user.type(screen.getByLabelText('Namn'), 'Brandvarnare')
        await user.click(screen.getByRole('button', { name: 'Spara produkt' }))

        expect(sentBody(fetchMock)).toMatchObject({ purchaseDate: null, warrantyUntil: null, serviceIntervalMonths: null })
    })

    it('shows the error from the server', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(json({ error: 'warrantyUntil får inte vara före purchaseDate' }, 400))
        const { user, onSaved } = renderForm()

        await user.type(screen.getByLabelText('Namn'), 'Värmepump')
        await user.click(screen.getByRole('button', { name: 'Spara produkt' }))

        expect(await screen.findByRole('alert')).toHaveTextContent('warrantyUntil får inte vara före purchaseDate')
        expect(onSaved).not.toHaveBeenCalled()
    })

    it('calls onCancel when Avbryt is clicked', async () => {
        const { user, onCancel } = renderForm()

        await user.click(screen.getByRole('button', { name: 'Avbryt' }))

        expect(onCancel).toHaveBeenCalledOnce()
    })
})

describe('ProductForm: editing', () => {
    const existing = makeProduct({ id: 'p1', name: 'Värmepump', location: 'Pannrummet', serviceIntervalMonths: 12 })

    it('starts with the saved values and sends changes with PATCH', async () => {
        const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(json(existing, 200))
        const onSaved = vi.fn()
        render(<ProductForm product={existing} onSaved={onSaved} onCancel={vi.fn()} />)
        const user = userEvent.setup()

        expect(screen.getByLabelText('Placering')).toHaveValue('Pannrummet')
        expect(screen.getByLabelText('Serviceintervall (månader)')).toHaveValue(12)

        await user.clear(screen.getByLabelText('Serviceintervall (månader)'))
        await user.click(screen.getByRole('button', { name: 'Spara ändringar' }))

        const [url, options] = fetchMock.mock.calls[0]
        expect(url).toBe('/api/products/p1')
        expect(options?.method).toBe('PATCH')
        expect(sentBody(fetchMock)).toMatchObject({ serviceIntervalMonths: null })
        expect(onSaved).toHaveBeenCalledWith(existing)
    })
})
