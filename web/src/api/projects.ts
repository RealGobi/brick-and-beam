export const projectStatuses = ['planned', 'ongoing', 'done'] as const

export type ProjectStatus = (typeof projectStatuses)[number]

/** A project as returned by the API. Timestamps arrive as ISO strings, dates as "YYYY-MM-DD". */
export type Project = {
    id: string
    name: string
    description: string
    status: ProjectStatus
    startDate: string | null
    endDate: string | null
    /** Whole kronor */
    budget: number | null
    createdAt: string
    updatedAt: string
    /** The newest image from the project's steps, or null when there are none */
    coverImageUrl: string | null
    stepCount: number
    doneStepCount: number
    /** Sum of all expenses in whole kronor */
    spentAmount: number
}

/** What the client sends to create a project. */
export type NewProjectInput = Omit<
    Project,
    'id' | 'createdAt' | 'updatedAt' | 'coverImageUrl' | 'stepCount' | 'doneStepCount' | 'spentAmount'
>

export function isProjectStatus(value: unknown): value is ProjectStatus {
    return projectStatuses.some((status) => status === value)
}

const isStringOrNull = (value: unknown) => typeof value === 'string' || value === null

export function isProject(value: unknown): value is Project {
    if (typeof value !== 'object' || value === null) return false

    const project = value as Record<string, unknown>
    return (
        typeof project.id === 'string' &&
        typeof project.name === 'string' &&
        typeof project.description === 'string' &&
        isProjectStatus(project.status) &&
        isStringOrNull(project.startDate) &&
        isStringOrNull(project.endDate) &&
        (typeof project.budget === 'number' || project.budget === null) &&
        typeof project.createdAt === 'string' &&
        typeof project.updatedAt === 'string' &&
        isStringOrNull(project.coverImageUrl) &&
        typeof project.stepCount === 'number' &&
        typeof project.doneStepCount === 'number' &&
        typeof project.spentAmount === 'number'
    )
}

/** Uses the server's error message when there is one, e.g. "name krävs". */
export async function errorFromResponse(response: Response): Promise<Error> {
    const body: unknown = await response.json().catch(() => null)
    if (typeof body === 'object' && body !== null && 'error' in body && typeof body.error === 'string') {
        return new Error(body.error)
    }
    return new Error(`Servern svarade med ${response.status}`)
}

/** Checks a response that has no body, like 204 after a delete. */
export async function expectSuccess(response: Response): Promise<void> {
    if (!response.ok) throw await errorFromResponse(response)
}

/** Fetches all projects, newest first. Throws if the request fails or the data has an unexpected shape. */
export async function fetchProjects(): Promise<Project[]> {
    const response = await fetch('/api/projects')
    if (!response.ok) throw await errorFromResponse(response)

    const body: unknown = await response.json()
    if (!Array.isArray(body) || !body.every(isProject)) {
        throw new Error('Oväntat svar från servern')
    }

    return body
}

/** Fetches one project. Throws "Projektet finns inte" when the id is unknown. */
export async function fetchProject(projectId: string): Promise<Project> {
    const response = await fetch(`/api/projects/${projectId}`)
    if (!response.ok) throw await errorFromResponse(response)

    const body: unknown = await response.json()
    if (!isProject(body)) throw new Error('Oväntat svar från servern')

    return body
}

/** Creates a project and returns it as saved by the server. Throws with the server's message on invalid input. */
export async function createProject(input: NewProjectInput): Promise<Project> {
    const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
    })
    if (!response.ok) throw await errorFromResponse(response)

    const body: unknown = await response.json()
    if (!isProject(body)) throw new Error('Oväntat svar från servern')

    return body
}

/** Changes some fields of a project. Fields left out keep their saved value. */
export async function updateProject(projectId: string, changes: Partial<NewProjectInput>): Promise<Project> {
    const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes),
    })
    if (!response.ok) throw await errorFromResponse(response)

    const body: unknown = await response.json()
    if (!isProject(body)) throw new Error('Oväntat svar från servern')

    return body
}

/** Deletes a project with all its steps and images. */
export async function deleteProject(projectId: string): Promise<void> {
    await expectSuccess(await fetch(`/api/projects/${projectId}`, { method: 'DELETE' }))
}
