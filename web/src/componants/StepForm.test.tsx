import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { makeStep, makeStepImage } from '../test/makeStep'
import { StepForm } from './StepForm'

function mockServerResponse(body: unknown, status: number) {
    return vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(body), { status }))
}

function renderForm() {
    const onSaved = vi.fn()
    const onCancel = vi.fn()
    render(<StepForm projectId="p1" onSaved={onSaved} onCancel={onCancel} />)
    return { onSaved, onCancel, user: userEvent.setup() }
}

afterEach(() => {
    vi.restoreAllMocks()
})

describe('StepForm: new step', () => {
    it('sends the filled-in fields to the project', async () => {
        const fetchMock = mockServerResponse(makeStep(), 201)
        const { user } = renderForm()

        await user.type(screen.getByLabelText('Namn på steget'), 'Riva kakel')
        await user.type(screen.getByLabelText('Beskrivning'), 'Hela väggen')
        await user.selectOptions(screen.getByLabelText('Status'), 'Klar')
        await user.type(screen.getByLabelText('Datum'), '2026-09-05')
        await user.click(screen.getByRole('button', { name: 'Spara steg' }))

        const [url, options] = fetchMock.mock.calls[0]
        expect(url).toBe('/api/projects/p1/steps')
        expect(JSON.parse(String(options?.body))).toEqual({
            name: 'Riva kakel',
            description: 'Hela väggen',
            status: 'done',
            date: '2026-09-05',
        })
    })

    it('starts as ongoing without a date', async () => {
        const fetchMock = mockServerResponse(makeStep(), 201)
        const { user } = renderForm()

        await user.type(screen.getByLabelText('Namn på steget'), 'Måla')
        await user.click(screen.getByRole('button', { name: 'Spara steg' }))

        expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toMatchObject({ status: 'ongoing', date: null })
    })

    it('passes the saved step to onSaved', async () => {
        const saved = makeStep({ name: 'Måla' })
        mockServerResponse(saved, 201)
        const { user, onSaved } = renderForm()

        await user.type(screen.getByLabelText('Namn på steget'), 'Måla')
        await user.click(screen.getByRole('button', { name: 'Spara steg' }))

        expect(onSaved).toHaveBeenCalledWith(saved)
    })

    it('shows the error from the server', async () => {
        mockServerResponse({ error: 'Projektet finns inte' }, 404)
        const { user, onSaved } = renderForm()

        await user.type(screen.getByLabelText('Namn på steget'), 'Måla')
        await user.click(screen.getByRole('button', { name: 'Spara steg' }))

        expect(await screen.findByRole('alert')).toHaveTextContent('Projektet finns inte')
        expect(onSaved).not.toHaveBeenCalled()
    })

    it('calls onCancel when Avbryt is clicked', async () => {
        const { user, onCancel } = renderForm()

        await user.click(screen.getByRole('button', { name: 'Avbryt' }))

        expect(onCancel).toHaveBeenCalledOnce()
    })
})

describe('StepForm: editing', () => {
    const existing = makeStep({ id: 's1', name: 'Riva kakel', description: 'Hela väggen', status: 'done', date: '2026-09-05' })

    function renderEditForm() {
        const onSaved = vi.fn()
        render(<StepForm projectId="p1" step={existing} onSaved={onSaved} onCancel={vi.fn()} />)
        return { onSaved, user: userEvent.setup() }
    }

    it('starts with the saved values filled in', () => {
        renderEditForm()

        expect(screen.getByLabelText('Namn på steget')).toHaveValue('Riva kakel')
        expect(screen.getByLabelText('Beskrivning')).toHaveValue('Hela väggen')
        expect(screen.getByLabelText('Status')).toHaveValue('done')
        expect(screen.getByLabelText('Datum')).toHaveValue('2026-09-05')
    })

    it('sends the changes to the step with PATCH and passes the result on', async () => {
        const updated = { ...existing, name: 'Riva allt kakel' }
        const fetchMock = mockServerResponse(updated, 200)
        const { user, onSaved } = renderEditForm()

        await user.clear(screen.getByLabelText('Namn på steget'))
        await user.type(screen.getByLabelText('Namn på steget'), 'Riva allt kakel')
        await user.click(screen.getByRole('button', { name: 'Spara ändringar' }))

        const [url, options] = fetchMock.mock.calls[0]
        expect(url).toBe('/api/steps/s1')
        expect(options?.method).toBe('PATCH')
        expect(JSON.parse(String(options?.body))).toMatchObject({ name: 'Riva allt kakel' })
        expect(onSaved).toHaveBeenCalledWith(updated)
    })
})

describe('StepForm: images for a new step', () => {
    const json = (body: unknown, status: number) => new Response(JSON.stringify(body), { status })
    const photo = (name = 'fore.jpg') => new File(['jpg'], name, { type: 'image/jpeg' })

    it('creates the step and then uploads the chosen images to it', async () => {
        const created = makeStep({ id: 's1', name: 'Riva kakel' })
        const uploaded = [makeStepImage('fore.jpg'), makeStepImage('efter.jpg')]
        const fetchMock = vi
            .spyOn(globalThis, 'fetch')
            .mockResolvedValueOnce(json(created, 201))
            .mockResolvedValueOnce(json(uploaded, 201))
        const { user, onSaved } = renderForm()

        await user.type(screen.getByLabelText('Namn på steget'), 'Riva kakel')
        await user.upload(screen.getByLabelText(/^Bilder/), [photo('fore.jpg'), photo('efter.jpg')])
        await user.click(screen.getByRole('button', { name: 'Spara steg' }))

        expect(fetchMock.mock.calls.map(([url]) => url)).toEqual(['/api/projects/p1/steps', '/api/steps/s1/images'])
        expect(onSaved).toHaveBeenCalledWith({ ...created, images: uploaded })
    })

    it('does not upload anything when no images are chosen', async () => {
        const fetchMock = mockServerResponse(makeStep(), 201)
        const { user } = renderForm()

        await user.type(screen.getByLabelText('Namn på steget'), 'Måla')
        await user.click(screen.getByRole('button', { name: 'Spara steg' }))

        expect(fetchMock).toHaveBeenCalledOnce()
    })

    it('keeps the created step and passes a warning when the upload fails', async () => {
        const created = makeStep({ id: 's1' })
        vi.spyOn(globalThis, 'fetch')
            .mockResolvedValueOnce(json(created, 201))
            .mockResolvedValueOnce(json({ error: 'Uppladdningen är för stor' }, 413))
        const { user, onSaved } = renderForm()

        await user.type(screen.getByLabelText('Namn på steget'), 'Riva kakel')
        await user.upload(screen.getByLabelText(/^Bilder/), photo())
        await user.click(screen.getByRole('button', { name: 'Spara steg' }))

        expect(onSaved).toHaveBeenCalledWith(created, expect.stringContaining('Uppladdningen är för stor'))
    })

    it('stops before saving anything when a chosen file is not a supported image', async () => {
        const fetchMock = vi.spyOn(globalThis, 'fetch')
        render(<StepForm projectId="p1" onSaved={vi.fn()} onCancel={vi.fn()} />)
        // Skip the file picker's own type filter, like a browser that lets any file through
        const user = userEvent.setup({ applyAccept: false })

        await user.type(screen.getByLabelText('Namn på steget'), 'Riva kakel')
        await user.upload(screen.getByLabelText(/^Bilder/), new File(['%PDF'], 'ritning.pdf', { type: 'application/pdf' }))
        await user.click(screen.getByRole('button', { name: 'Spara steg' }))

        expect(screen.getByRole('alert')).toHaveTextContent('ritning.pdf är inte en bild som stöds')
        expect(fetchMock).not.toHaveBeenCalled()
    })

    it('has no image field when editing, since the card handles those images', () => {
        render(<StepForm projectId="p1" step={makeStep()} onSaved={vi.fn()} onCancel={vi.fn()} />)

        expect(screen.queryByLabelText(/^Bilder/)).not.toBeInTheDocument()
    })
})
