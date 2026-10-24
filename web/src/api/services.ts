import { errorFromResponse, expectSuccess } from './projects'
import { isStepImage, type StepImage } from './steps'

/** A service that has been done on a product, as returned by the API. */
export type ServiceEntry = {
    id: string
    productId: string
    name: string
    description: string
    /** "YYYY-MM-DD" */
    performedOn: string
    /** The company or person who did it. Empty when not given. */
    performedBy: string
    /** Whole kronor, or null when not given */
    cost: number | null
    createdAt: string
    updatedAt: string
    images: StepImage[]
}

export type NewServiceInput = Pick<ServiceEntry, 'name' | 'description' | 'performedOn' | 'performedBy' | 'cost'>

function isServiceEntry(value: unknown): value is ServiceEntry {
    if (typeof value !== 'object' || value === null) return false

    const service = value as Record<string, unknown>
    const texts = ['id', 'productId', 'name', 'description', 'performedOn', 'performedBy', 'createdAt', 'updatedAt']
    return (
        texts.every((field) => typeof service[field] === 'string') &&
        (typeof service.cost === 'number' || service.cost === null) &&
        Array.isArray(service.images) &&
        service.images.every(isStepImage)
    )
}

/** Reads a JSON response and checks its shape. Throws with the server's message when the request failed. */
async function readResponse<T>(response: Response, isValid: (body: unknown) => body is T): Promise<T> {
    if (!response.ok) throw await errorFromResponse(response)

    const body: unknown = await response.json()
    if (!isValid(body)) throw new Error('Oväntat svar från servern')

    return body
}

const isServiceList = (body: unknown): body is ServiceEntry[] => Array.isArray(body) && body.every(isServiceEntry)
const isImageList = (body: unknown): body is StepImage[] => Array.isArray(body) && body.every(isStepImage)

const sendJson = (method: string, url: string, body: unknown) =>
    fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

/** Fetches the services of a product, newest first. */
export async function fetchServices(productId: string): Promise<ServiceEntry[]> {
    return readResponse(await fetch(`/api/products/${productId}/services`), isServiceList)
}

/** Documents a service on a product and returns it as saved, without images. */
export async function createService(productId: string, input: NewServiceInput): Promise<ServiceEntry> {
    return readResponse(await sendJson('POST', `/api/products/${productId}/services`, input), isServiceEntry)
}

/** Changes some fields of a service. Fields left out keep their saved value. */
export async function updateService(serviceId: string, changes: Partial<NewServiceInput>): Promise<ServiceEntry> {
    return readResponse(await sendJson('PATCH', `/api/services/${serviceId}`, changes), isServiceEntry)
}

/** Deletes a service and its images. */
export async function deleteService(serviceId: string): Promise<void> {
    await expectSuccess(await fetch(`/api/services/${serviceId}`, { method: 'DELETE' }))
}

/** Uploads images to a service and returns them as saved. */
export async function uploadServiceImages(serviceId: string, files: File[]): Promise<StepImage[]> {
    const form = new FormData()
    files.forEach((file) => form.append('images', file))

    // No Content-Type header: the browser sets it, including the multipart boundary
    return readResponse(await fetch(`/api/services/${serviceId}/images`, { method: 'POST', body: form }), isImageList)
}

/** Deletes one image from a service. */
export async function deleteServiceImage(imageId: string): Promise<void> {
    await expectSuccess(await fetch(`/api/service-images/${imageId}`, { method: 'DELETE' }))
}
