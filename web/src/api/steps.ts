import { errorFromResponse, expectSuccess } from './projects'

export const stepStatuses = ['ongoing', 'done'] as const

export type StepStatus = (typeof stepStatuses)[number]

export type StepImage = {
    id: string
    /** Path the browser can load the image from, e.g. "/api/uploads/abc.jpg" */
    url: string
    originalName: string
    createdAt: string
}

/** A step in a project, as returned by the API. The date is "YYYY-MM-DD" or null. */
export type Step = {
    id: string
    projectId: string
    name: string
    description: string
    status: StepStatus
    date: string | null
    createdAt: string
    updatedAt: string
    images: StepImage[]
}

export type NewStepInput = Pick<Step, 'name' | 'description' | 'status' | 'date'>

/** Image types the server accepts, also used for the file picker. */
export const acceptedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export function isStepStatus(value: unknown): value is StepStatus {
    return stepStatuses.some((status) => status === value)
}

function isStepImage(value: unknown): value is StepImage {
    if (typeof value !== 'object' || value === null) return false

    const image = value as Record<string, unknown>
    return (
        typeof image.id === 'string' &&
        typeof image.url === 'string' &&
        typeof image.originalName === 'string' &&
        typeof image.createdAt === 'string'
    )
}

function isStep(value: unknown): value is Step {
    if (typeof value !== 'object' || value === null) return false

    const step = value as Record<string, unknown>
    return (
        typeof step.id === 'string' &&
        typeof step.projectId === 'string' &&
        typeof step.name === 'string' &&
        typeof step.description === 'string' &&
        isStepStatus(step.status) &&
        (typeof step.date === 'string' || step.date === null) &&
        typeof step.createdAt === 'string' &&
        typeof step.updatedAt === 'string' &&
        Array.isArray(step.images) &&
        step.images.every(isStepImage)
    )
}

/** Reads a JSON response and checks its shape. Throws with the server's message when the request failed. */
async function readResponse<T>(response: Response, isValid: (body: unknown) => body is T): Promise<T> {
    if (!response.ok) throw await errorFromResponse(response)

    const body: unknown = await response.json()
    if (!isValid(body)) throw new Error('Oväntat svar från servern')

    return body
}

const isStepList = (body: unknown): body is Step[] => Array.isArray(body) && body.every(isStep)
const isImageList = (body: unknown): body is StepImage[] => Array.isArray(body) && body.every(isStepImage)

/** Fetches the steps of a project with their images, in date order. */
export async function fetchSteps(projectId: string): Promise<Step[]> {
    return readResponse(await fetch(`/api/projects/${projectId}/steps`), isStepList)
}

/** Creates a step in a project and returns it as saved by the server. */
export async function createStep(projectId: string, input: NewStepInput): Promise<Step> {
    const response = await fetch(`/api/projects/${projectId}/steps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
    })
    return readResponse(response, isStep)
}

/** Uploads images to a step and returns them as saved by the server. */
export async function uploadStepImages(stepId: string, files: File[]): Promise<StepImage[]> {
    const form = new FormData()
    files.forEach((file) => form.append('images', file))

    // No Content-Type header: the browser sets it, including the multipart boundary
    const response = await fetch(`/api/steps/${stepId}/images`, { method: 'POST', body: form })
    return readResponse(response, isImageList)
}

/** Changes some fields of a step. Fields left out keep their saved value. */
export async function updateStep(stepId: string, changes: Partial<NewStepInput>): Promise<Step> {
    const response = await fetch(`/api/steps/${stepId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes),
    })
    return readResponse(response, isStep)
}

/** Deletes a step and its images. */
export async function deleteStep(stepId: string): Promise<void> {
    await expectSuccess(await fetch(`/api/steps/${stepId}`, { method: 'DELETE' }))
}

/** Deletes one image from a step. */
export async function deleteStepImage(imageId: string): Promise<void> {
    await expectSuccess(await fetch(`/api/images/${imageId}`, { method: 'DELETE' }))
}
