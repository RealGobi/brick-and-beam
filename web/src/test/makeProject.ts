import type { Project } from '../api/projects'

/** Builds a complete project for tests. Pass only the fields the test cares about. */
export function makeProject(overrides: Partial<Project> = {}): Project {
    const name = overrides.name ?? 'Nytt badrum'
    return {
        id: name,
        name,
        description: '',
        status: 'planned',
        startDate: null,
        endDate: null,
        budget: null,
        createdAt: '2026-09-01T12:00:00.000Z',
        updatedAt: '2026-09-01T12:00:00.000Z',
        coverImageUrl: null,
        stepCount: 0,
        doneStepCount: 0,
        ...overrides,
    }
}
