import { errorFromResponse, expectSuccess } from './projects'

/** A product that may need service, as returned by the API. Dates are "YYYY-MM-DD" or null. */
export type Product = {
    id: string
    name: string
    description: string
    manufacturer: string
    model: string
    serialNumber: string
    /** Where in the house, e.g. "Pannrummet" */
    location: string
    purchaseDate: string | null
    warrantyUntil: string | null
    /** Null when the product has no regular service */
    serviceIntervalMonths: number | null
    createdAt: string
    updatedAt: string
    lastServiceDate: string | null
    /** Computed by the server from the last service and the interval */
    nextServiceDate: string | null
    serviceCount: number
}

export type NewProductInput = Omit<
    Product,
    'id' | 'createdAt' | 'updatedAt' | 'lastServiceDate' | 'nextServiceDate' | 'serviceCount'
>

const isStringOrNull = (value: unknown) => typeof value === 'string' || value === null

export function isProduct(value: unknown): value is Product {
    if (typeof value !== 'object' || value === null) return false

    const product = value as Record<string, unknown>
    const texts = ['id', 'name', 'description', 'manufacturer', 'model', 'serialNumber', 'location', 'createdAt', 'updatedAt']
    const dates = ['purchaseDate', 'warrantyUntil', 'lastServiceDate', 'nextServiceDate']
    return (
        texts.every((field) => typeof product[field] === 'string') &&
        dates.every((field) => isStringOrNull(product[field])) &&
        (typeof product.serviceIntervalMonths === 'number' || product.serviceIntervalMonths === null) &&
        typeof product.serviceCount === 'number'
    )
}

/** Reads a JSON response and checks its shape. Throws with the server's message when the request failed. */
async function readResponse<T>(response: Response, isValid: (body: unknown) => body is T): Promise<T> {
    if (!response.ok) throw await errorFromResponse(response)

    const body: unknown = await response.json()
    if (!isValid(body)) throw new Error('Oväntat svar från servern')

    return body
}

const isProductList = (body: unknown): body is Product[] => Array.isArray(body) && body.every(isProduct)

const sendJson = (method: string, url: string, body: unknown) =>
    fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

/** Fetches all products, the one that needs service soonest first. */
export async function fetchProducts(): Promise<Product[]> {
    return readResponse(await fetch('/api/products'), isProductList)
}

/** Fetches one product. Throws "Produkten finns inte" when the id is unknown. */
export async function fetchProduct(productId: string): Promise<Product> {
    return readResponse(await fetch(`/api/products/${productId}`), isProduct)
}

/** Adds a product and returns it as saved by the server. */
export async function createProduct(input: NewProductInput): Promise<Product> {
    return readResponse(await sendJson('POST', '/api/products', input), isProduct)
}

/** Changes some fields of a product. Fields left out keep their saved value. */
export async function updateProduct(productId: string, changes: Partial<NewProductInput>): Promise<Product> {
    return readResponse(await sendJson('PATCH', `/api/products/${productId}`, changes), isProduct)
}

/** Deletes a product with its services, images and reminders. */
export async function deleteProduct(productId: string): Promise<void> {
    await expectSuccess(await fetch(`/api/products/${productId}`, { method: 'DELETE' }))
}
