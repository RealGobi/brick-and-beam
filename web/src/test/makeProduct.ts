import type { Product } from '../api/products'

/** Builds a complete product for tests. Pass only the fields the test cares about. */
export function makeProduct(overrides: Partial<Product> = {}): Product {
    const name = overrides.name ?? 'Värmepump'
    return {
        id: name,
        name,
        description: '',
        manufacturer: '',
        model: '',
        serialNumber: '',
        location: '',
        purchaseDate: null,
        warrantyUntil: null,
        serviceIntervalMonths: null,
        createdAt: '2026-01-10T12:00:00.000Z',
        updatedAt: '2026-01-10T12:00:00.000Z',
        lastServiceDate: null,
        nextServiceDate: null,
        serviceCount: 0,
        ...overrides,
    }
}
