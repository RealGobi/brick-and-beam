import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { makeStep } from '../test/makeStep'
import { NewStepForm } from './NewStepForm'

function mockServerResponse(body: unknown, status: number) {
    return vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(body), { status }))
}

function renderForm() {
    const onCreated = vi.fn()
    const onCancel = vi.fn()
    render(<NewStepForm projectId="p1" onCreated={onCreated} onCancel={onCancel} />)
    return { onCreated, onCancel, user: userEvent.setup() }
}

afterEach(() => {
    vi.restoreAllMocks()
})

describe('NewStepForm', () => {
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

    it('passes the saved step to onCreated', async () => {
        const saved = makeStep({ name: 'Måla' })
        mockServerResponse(saved, 201)
        const { user, onCreated } = renderForm()

        await user.type(screen.getByLabelText('Namn på steget'), 'Måla')
        await user.click(screen.getByRole('button', { name: 'Spara steg' }))

        expect(onCreated).toHaveBeenCalledWith(saved)
    })

    it('shows the error from the server', async () => {
        mockServerResponse({ error: 'Projektet finns inte' }, 404)
        const { user, onCreated } = renderForm()

        await user.type(screen.getByLabelText('Namn på steget'), 'Måla')
        await user.click(screen.getByRole('button', { name: 'Spara steg' }))

        expect(await screen.findByRole('alert')).toHaveTextContent('Projektet finns inte')
        expect(onCreated).not.toHaveBeenCalled()
    })

    it('calls onCancel when Avbryt is clicked', async () => {
        const { user, onCancel } = renderForm()

        await user.click(screen.getByRole('button', { name: 'Avbryt' }))

        expect(onCancel).toHaveBeenCalledOnce()
    })
})
