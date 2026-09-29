import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { makeProject } from '../test/makeProject'
import { ProjectForm } from './ProjectForm'

function mockServerResponse(body: unknown, status: number) {
    return vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(body), { status }))
}

// The JSON body of the first request sent to fetch
function sentBody(fetchMock: ReturnType<typeof mockServerResponse>): unknown {
    const options = fetchMock.mock.calls[0][1]
    return JSON.parse(String(options?.body))
}

function renderForm() {
    const onSaved = vi.fn()
    const onCancel = vi.fn()
    render(<ProjectForm onSaved={onSaved} onCancel={onCancel} />)
    return { onSaved, onCancel, user: userEvent.setup() }
}

afterEach(() => {
    vi.restoreAllMocks()
})

describe('ProjectForm: new project', () => {
    it('sends every filled-in field to the server', async () => {
        const fetchMock = mockServerResponse(makeProject(), 201)
        const { user } = renderForm()

        await user.type(screen.getByLabelText('Namn'), 'Nytt badrum')
        await user.type(screen.getByLabelText('Beskrivning'), 'Byta kakel')
        await user.selectOptions(screen.getByLabelText('Status'), 'Pågående')
        await user.type(screen.getByLabelText('Budget (kr)'), '85000')
        await user.type(screen.getByLabelText('Startdatum'), '2026-09-01')
        await user.type(screen.getByLabelText('Slutdatum'), '2026-10-15')
        await user.click(screen.getByRole('button', { name: 'Spara projekt' }))

        expect(sentBody(fetchMock)).toEqual({
            name: 'Nytt badrum',
            description: 'Byta kakel',
            status: 'ongoing',
            startDate: '2026-09-01',
            endDate: '2026-10-15',
            budget: 85000,
        })
    })

    it('sends empty optional fields as null', async () => {
        const fetchMock = mockServerResponse(makeProject(), 201)
        const { user } = renderForm()

        await user.type(screen.getByLabelText('Namn'), 'Altan')
        await user.click(screen.getByRole('button', { name: 'Spara projekt' }))

        expect(sentBody(fetchMock)).toEqual({
            name: 'Altan',
            description: '',
            status: 'planned',
            startDate: null,
            endDate: null,
            budget: null,
        })
    })

    it('passes the created project to onSaved', async () => {
        const saved = makeProject({ name: 'Altan' })
        mockServerResponse(saved, 201)
        const { user, onSaved } = renderForm()

        await user.type(screen.getByLabelText('Namn'), 'Altan')
        await user.click(screen.getByRole('button', { name: 'Spara projekt' }))

        expect(onSaved).toHaveBeenCalledWith(saved)
    })

    it('shows the error from the server and keeps the input', async () => {
        mockServerResponse({ error: 'endDate får inte vara före startDate' }, 400)
        const { user, onSaved } = renderForm()

        await user.type(screen.getByLabelText('Namn'), 'Altan')
        await user.click(screen.getByRole('button', { name: 'Spara projekt' }))

        expect(await screen.findByRole('alert')).toHaveTextContent('endDate får inte vara före startDate')
        expect(screen.getByLabelText('Namn')).toHaveValue('Altan')
        expect(onSaved).not.toHaveBeenCalled()
    })

    it('does not send anything when the name is empty', async () => {
        const fetchMock = mockServerResponse(makeProject(), 201)
        const { user } = renderForm()

        await user.click(screen.getByRole('button', { name: 'Spara projekt' }))

        expect(fetchMock).not.toHaveBeenCalled()
    })

    it('calls onCancel when Avbryt is clicked', async () => {
        const { user, onCancel } = renderForm()

        await user.click(screen.getByRole('button', { name: 'Avbryt' }))

        expect(onCancel).toHaveBeenCalledOnce()
    })
})

describe('ProjectForm: editing', () => {
    const existing = makeProject({
        id: 'p1',
        name: 'Nytt badrum',
        description: 'Kakel',
        status: 'ongoing',
        startDate: '2026-09-01',
        endDate: null,
        budget: 85000,
    })

    function renderEditForm() {
        const onSaved = vi.fn()
        render(<ProjectForm project={existing} onSaved={onSaved} onCancel={vi.fn()} />)
        return { onSaved, user: userEvent.setup() }
    }

    it('starts with the saved values filled in', () => {
        renderEditForm()

        expect(screen.getByLabelText('Namn')).toHaveValue('Nytt badrum')
        expect(screen.getByLabelText('Beskrivning')).toHaveValue('Kakel')
        expect(screen.getByLabelText('Status')).toHaveValue('ongoing')
        expect(screen.getByLabelText('Startdatum')).toHaveValue('2026-09-01')
        expect(screen.getByLabelText('Slutdatum')).toHaveValue('')
        expect(screen.getByLabelText('Budget (kr)')).toHaveValue(85000)
    })

    it('sends the changes to the project with PATCH', async () => {
        const fetchMock = mockServerResponse(existing, 200)
        const { user } = renderEditForm()

        await user.clear(screen.getByLabelText('Budget (kr)'))
        await user.click(screen.getByRole('button', { name: 'Spara ändringar' }))

        const [url, options] = fetchMock.mock.calls[0]
        expect(url).toBe('/api/projects/p1')
        expect(options?.method).toBe('PATCH')
        expect(sentBody(fetchMock)).toMatchObject({ name: 'Nytt badrum', budget: null })
    })

    it('passes the updated project to onSaved', async () => {
        const updated = { ...existing, name: 'Badrum' }
        mockServerResponse(updated, 200)
        const { user, onSaved } = renderEditForm()

        await user.click(screen.getByRole('button', { name: 'Spara ändringar' }))

        expect(onSaved).toHaveBeenCalledWith(updated)
    })
})
