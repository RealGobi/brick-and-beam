import { afterEach, describe, expect, it, vi } from 'vitest'
import { makeProject } from '../test/makeProject'
import {
    createProject,
    deleteProject,
    fetchProject,
    fetchProjects,
    updateProject,
    type NewProjectInput,
} from './projects'

const project = makeProject({ status: 'ongoing', startDate: '2026-09-01', budget: 85000 })

const input: NewProjectInput = {
    name: 'Nytt badrum',
    description: '',
    status: 'planned',
    startDate: null,
    endDate: null,
    budget: null,
}

function mockFetchResponse(body: unknown, status = 200) {
    return vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(body), { status }))
}

afterEach(() => {
    vi.restoreAllMocks()
})

describe('fetchProjects', () => {
    it('returns the projects from the server', async () => {
        mockFetchResponse([project])

        const projects = await fetchProjects()

        expect(projects).toEqual([project])
    })

    it('returns an empty list when there are no projects', async () => {
        mockFetchResponse([])

        const projects = await fetchProjects()

        expect(projects).toEqual([])
    })

    it('throws with the server message when the server responds with an error', async () => {
        mockFetchResponse({ error: 'Något gick fel på servern' }, 500)

        await expect(fetchProjects()).rejects.toThrow('Något gick fel på servern')
    })

    it('throws with the status code when the error has no message', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('Bad gateway', { status: 502 }))

        await expect(fetchProjects()).rejects.toThrow('Servern svarade med 502')
    })

    it('throws when the response is not a list', async () => {
        mockFetchResponse({ projects: [] })

        await expect(fetchProjects()).rejects.toThrow('Oväntat svar från servern')
    })

    it('throws when a project has an unknown status', async () => {
        mockFetchResponse([{ ...project, status: 'paused' }])

        await expect(fetchProjects()).rejects.toThrow('Oväntat svar från servern')
    })

    it('accepts a project with a cover image', async () => {
        const withCover = { ...project, coverImageUrl: '/api/uploads/kok.jpg' }
        mockFetchResponse([withCover])

        expect(await fetchProjects()).toEqual([withCover])
    })

    it('throws when the step counts are missing', async () => {
        const withoutCounts: Record<string, unknown> = { ...project }
        delete withoutCounts.stepCount
        mockFetchResponse([withoutCounts])

        await expect(fetchProjects()).rejects.toThrow('Oväntat svar från servern')
    })

    it('throws when a project is missing a field', async () => {
        const withoutBudget: Record<string, unknown> = { ...project }
        delete withoutBudget.budget
        mockFetchResponse([withoutBudget])

        await expect(fetchProjects()).rejects.toThrow('Oväntat svar från servern')
    })
})

describe('fetchProject', () => {
    it('fetches the project with the given id', async () => {
        const fetchMock = mockFetchResponse(project)

        const result = await fetchProject('a1')

        expect(fetchMock).toHaveBeenCalledWith('/api/projects/a1')
        expect(result).toEqual(project)
    })

    it('throws with the server message when the project does not exist', async () => {
        mockFetchResponse({ error: 'Projektet finns inte' }, 404)

        await expect(fetchProject('a1')).rejects.toThrow('Projektet finns inte')
    })
})

describe('createProject', () => {
    it('sends the input as JSON in a POST request', async () => {
        const fetchMock = mockFetchResponse(project, 201)

        await createProject(input)

        expect(fetchMock).toHaveBeenCalledWith('/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input),
        })
    })

    it('returns the saved project', async () => {
        mockFetchResponse(project, 201)

        const saved = await createProject(input)

        expect(saved).toEqual(project)
    })

    it('throws with the validation message from the server', async () => {
        mockFetchResponse({ error: 'name krävs' }, 400)

        await expect(createProject(input)).rejects.toThrow('name krävs')
    })
})

describe('updateProject', () => {
    it('sends only the changed fields with PATCH', async () => {
        const fetchMock = mockFetchResponse(project)

        await updateProject('a1', { budget: 90000 })

        expect(fetchMock).toHaveBeenCalledWith('/api/projects/a1', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ budget: 90000 }),
        })
    })

    it('throws with the validation message from the server', async () => {
        mockFetchResponse({ error: 'endDate får inte vara före startDate' }, 400)

        await expect(updateProject('a1', { endDate: '2020-01-01' })).rejects.toThrow(
            'endDate får inte vara före startDate',
        )
    })
})

describe('deleteProject', () => {
    it('sends a DELETE request and accepts an empty 204 response', async () => {
        const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }))

        await expect(deleteProject('a1')).resolves.toBeUndefined()
        expect(fetchMock).toHaveBeenCalledWith('/api/projects/a1', { method: 'DELETE' })
    })

    it('throws with the server message when the project does not exist', async () => {
        mockFetchResponse({ error: 'Projektet finns inte' }, 404)

        await expect(deleteProject('a1')).rejects.toThrow('Projektet finns inte')
    })
})
