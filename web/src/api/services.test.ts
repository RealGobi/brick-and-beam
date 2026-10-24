import { afterEach, describe, expect, it, vi } from 'vitest'
import { makeStepImage } from '../test/makeStep'
import { makeService } from '../test/makeService'
import {
    createService,
    deleteService,
    deleteServiceImage,
    fetchServices,
    updateService,
    uploadServiceImages,
    type NewServiceInput,
} from './services'

const service = makeService({ id: 's1', cost: 1200, images: [makeStepImage('filter.jpg')] })
const input: NewServiceInput = { name: 'Filterbyte', description: '', performedOn: '2026-03-01', performedBy: '', cost: null }

function mockFetchResponse(body: unknown, status = 200) {
    return vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(body), { status }))
}

afterEach(() => {
    vi.restoreAllMocks()
})

describe('fetchServices', () => {
    it('fetches the services of the product', async () => {
        const fetchMock = mockFetchResponse([service])

        expect(await fetchServices('p1')).toEqual([service])
        expect(fetchMock).toHaveBeenCalledWith('/api/products/p1/services')
    })

    it('throws when a service has the cost as text', async () => {
        mockFetchResponse([{ ...service, cost: '1200' }])

        await expect(fetchServices('p1')).rejects.toThrow('Oväntat svar från servern')
    })
})

describe('createService and updateService', () => {
    it('sends a new service to the product with POST', async () => {
        const fetchMock = mockFetchResponse(service, 201)

        await createService('p1', input)

        expect(fetchMock).toHaveBeenCalledWith('/api/products/p1/services', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input),
        })
    })

    it('sends only the changed fields with PATCH', async () => {
        const fetchMock = mockFetchResponse(service)

        await updateService('s1', { cost: null })

        expect(fetchMock).toHaveBeenCalledWith('/api/services/s1', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cost: null }),
        })
    })

    it('throws with the validation message from the server', async () => {
        mockFetchResponse({ error: 'performedOn krävs' }, 400)

        await expect(createService('p1', input)).rejects.toThrow('performedOn krävs')
    })
})

describe('images and deleting', () => {
    it('uploads images in the images field of a form', async () => {
        const fetchMock = mockFetchResponse([makeStepImage('a.jpg')], 201)

        await uploadServiceImages('s1', [new File(['a'], 'a.jpg', { type: 'image/jpeg' })])

        const [url, options] = fetchMock.mock.calls[0]
        expect(url).toBe('/api/services/s1/images')
        const form = options?.body
        expect(form).toBeInstanceOf(FormData)
        expect((form as FormData).getAll('images')).toHaveLength(1)
    })

    it('deletes services and images with DELETE', async () => {
        const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response(null, { status: 204 }))

        await deleteService('s1')
        await deleteServiceImage('img-1')

        expect(fetchMock).toHaveBeenCalledWith('/api/services/s1', { method: 'DELETE' })
        expect(fetchMock).toHaveBeenCalledWith('/api/service-images/img-1', { method: 'DELETE' })
    })
})
