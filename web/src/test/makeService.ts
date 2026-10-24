import type { ServiceEntry } from '../api/services'

/** Builds a complete service for tests. Pass only the fields the test cares about. */
export function makeService(overrides: Partial<ServiceEntry> = {}): ServiceEntry {
    const name = overrides.name ?? 'Filterbyte'
    return {
        id: name,
        productId: 'p1',
        name,
        description: '',
        performedOn: '2026-03-01',
        performedBy: '',
        cost: null,
        createdAt: '2026-03-01T12:00:00.000Z',
        updatedAt: '2026-03-01T12:00:00.000Z',
        images: [],
        ...overrides,
    }
}
