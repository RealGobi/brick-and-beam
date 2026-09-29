import { afterEach, describe, expect, it, vi } from 'vitest'
import { makeStep, makeStepImage } from '../test/makeStep'
import {
    createStep,
    deleteStep,
    deleteStepImage,
    fetchSteps,
    updateStep,
    uploadStepImages,
    type NewStepInput,
} from './steps'

const step = makeStep({ images: [makeStepImage('a.jpg')] })

const input: NewStepInput = { name: 'Riva kakel', description: '', status: 'ongoing', date: null }

function mockFetchResponse(body: unknown, status = 200) {
    return vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(body), { status }))
}

afterEach(() => {
    vi.restoreAllMocks()
})

describe('fetchSteps', () => {
    it('fetches the steps of the project', async () => {
        const fetchMock = mockFetchResponse([step])

        const steps = await fetchSteps('p1')

        expect(fetchMock).toHaveBeenCalledWith('/api/projects/p1/steps')
        expect(steps).toEqual([step])
    })

    it('throws with the server message when the project does not exist', async () => {
        mockFetchResponse({ error: 'Projektet finns inte' }, 404)

        await expect(fetchSteps('p1')).rejects.toThrow('Projektet finns inte')
    })

    it('throws when a step has an invalid image', async () => {
        mockFetchResponse([{ ...step, images: [{ id: 'x' }] }])

        await expect(fetchSteps('p1')).rejects.toThrow('Oväntat svar från servern')
    })

    it('throws when a step has a project status instead of a step status', async () => {
        mockFetchResponse([{ ...step, status: 'planned' }])

        await expect(fetchSteps('p1')).rejects.toThrow('Oväntat svar från servern')
    })
})

describe('createStep', () => {
    it('sends the input as JSON to the project', async () => {
        const fetchMock = mockFetchResponse(step, 201)

        await createStep('p1', input)

        expect(fetchMock).toHaveBeenCalledWith('/api/projects/p1/steps', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input),
        })
    })

    it('throws with the validation message from the server', async () => {
        mockFetchResponse({ error: 'name krävs' }, 400)

        await expect(createStep('p1', input)).rejects.toThrow('name krävs')
    })
})

describe('uploadStepImages', () => {
    it('sends every file in the images field of a form', async () => {
        const fetchMock = mockFetchResponse([makeStepImage('a.jpg'), makeStepImage('b.png')], 201)
        const files = [new File(['a'], 'a.jpg', { type: 'image/jpeg' }), new File(['b'], 'b.png', { type: 'image/png' })]

        await uploadStepImages('s1', files)

        const [url, options] = fetchMock.mock.calls[0]
        expect(url).toBe('/api/steps/s1/images')
        expect(options?.method).toBe('POST')
        const form = options?.body
        expect(form).toBeInstanceOf(FormData)
        expect((form as FormData).getAll('images').map((file) => (file as File).name)).toEqual(['a.jpg', 'b.png'])
    })

    it('returns the saved images', async () => {
        mockFetchResponse([makeStepImage('a.jpg')], 201)

        const images = await uploadStepImages('s1', [new File(['a'], 'a.jpg', { type: 'image/jpeg' })])

        expect(images).toEqual([makeStepImage('a.jpg')])
    })

    it('throws with the server message when an image is rejected', async () => {
        mockFetchResponse({ error: 'stor.jpg är större än 10 MB' }, 400)

        await expect(uploadStepImages('s1', [])).rejects.toThrow('stor.jpg är större än 10 MB')
    })
})

describe('updateStep', () => {
    it('sends only the changed fields with PATCH and returns the step', async () => {
        const fetchMock = mockFetchResponse(step)

        const result = await updateStep('s1', { status: 'done' })

        expect(fetchMock).toHaveBeenCalledWith('/api/steps/s1', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'done' }),
        })
        expect(result).toEqual(step)
    })
})

describe('deleteStep and deleteStepImage', () => {
    it('sends DELETE to the step and to the image', async () => {
        const fetchMock = vi
            .spyOn(globalThis, 'fetch')
            .mockImplementation(async () => new Response(null, { status: 204 }))

        await deleteStep('s1')
        await deleteStepImage('img-1')

        expect(fetchMock).toHaveBeenCalledWith('/api/steps/s1', { method: 'DELETE' })
        expect(fetchMock).toHaveBeenCalledWith('/api/images/img-1', { method: 'DELETE' })
    })

    it('throws with the server message when the image does not exist', async () => {
        mockFetchResponse({ error: 'Bilden finns inte' }, 404)

        await expect(deleteStepImage('img-1')).rejects.toThrow('Bilden finns inte')
    })
})
