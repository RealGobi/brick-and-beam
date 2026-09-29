import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { makeStep } from '../test/makeStep'
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
