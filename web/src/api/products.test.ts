import { afterEach, describe, expect, it, vi } from 'vitest'
import { makeProduct } from '../test/makeProduct'
import { createProduct, deleteProduct, fetchProduct, fetchProducts, updateProduct, type NewProductInput } from './products'

const product = makeProduct({ id: 'p1', serviceIntervalMonths: 12, nextServiceDate: '2027-01-10' })

const input: NewProductInput = {
    name: 'Värmepump',
    description: '',
    manufacturer: 'Nibe',
    model: '',
    serialNumber: '',
    location: '',
    purchaseDate: null,
    warrantyUntil: null,
    serviceIntervalMonths: 12,
}

function mockFetchResponse(body: unknown, status = 200) {
    return vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(body), { status }))
}

afterEach(() => {
    vi.restoreAllMocks()
})

describe('fetchProducts and fetchProduct', () => {
    it('fetches all products', async () => {
        const fetchMock = mockFetchResponse([product])

        expect(await fetchProducts()).toEqual([product])
        expect(fetchMock).toHaveBeenCalledWith('/api/products')
    })

    it('fetches one product', async () => {
        const fetchMock = mockFetchResponse(product)

        expect(await fetchProduct('p1')).toEqual(product)
        expect(fetchMock).toHaveBeenCalledWith('/api/products/p1')
    })

    it('throws when the service count is missing', async () => {
        const withoutCount: Record<string, unknown> = { ...product }
        delete withoutCount.serviceCount
        mockFetchResponse([withoutCount])

        await expect(fetchProducts()).rejects.toThrow('Oväntat svar från servern')
    })

    it('throws with the server message when the product does not exist', async () => {
        mockFetchResponse({ error: 'Produkten finns inte' }, 404)

        await expect(fetchProduct('p1')).rejects.toThrow('Produkten finns inte')
    })
})

describe('createProduct, updateProduct and deleteProduct', () => {
    it('sends a new product as JSON with POST', async () => {
        const fetchMock = mockFetchResponse(product, 201)

        await createProduct(input)

        expect(fetchMock).toHaveBeenCalledWith('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input),
        })
    })

    it('sends only the changed fields with PATCH', async () => {
        const fetchMock = mockFetchResponse(product)

        await updateProduct('p1', { location: 'Garaget' })

        expect(fetchMock).toHaveBeenCalledWith('/api/products/p1', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ location: 'Garaget' }),
        })
    })

    it('throws with the validation message from the server', async () => {
        mockFetchResponse({ error: 'name krävs' }, 400)

        await expect(createProduct(input)).rejects.toThrow('name krävs')
    })

    it('deletes with DELETE and accepts an empty 204 response', async () => {
        const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }))

        await expect(deleteProduct('p1')).resolves.toBeUndefined()
        expect(fetchMock).toHaveBeenCalledWith('/api/products/p1', { method: 'DELETE' })
    })
})
