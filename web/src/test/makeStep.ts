import type { Step, StepImage } from '../api/steps'

/** Builds a complete step for tests. Pass only the fields the test cares about. */
export function makeStep(overrides: Partial<Step> = {}): Step {
    const name = overrides.name ?? 'Riva kakel'
    return {
        id: name,
        projectId: 'p1',
        name,
        description: '',
        status: 'ongoing',
        priority: 'normal',
        date: null,
        createdAt: '2026-09-01T12:00:00.000Z',
        updatedAt: '2026-09-01T12:00:00.000Z',
        images: [],
        ...overrides,
    }
}

/** Builds an image as returned by the server. */
export function makeStepImage(fileName: string): StepImage {
    return {
        id: fileName,
        url: `/api/uploads/${fileName}`,
        originalName: fileName,
        createdAt: '2026-09-01T12:00:00.000Z',
    }
}
