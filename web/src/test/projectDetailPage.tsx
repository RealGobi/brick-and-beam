import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { vi } from 'vitest'
import type { Expense } from '../api/expenses'
import type { Step } from '../api/steps'
import ProjectDetail from '../views/ProjectDetail'
import { makeProject } from './makeProject'

/** Shared setup for the ProjectDetail tests, which are split over more than one file. */

export const project = makeProject({
    id: 'p1',
    name: 'Nytt badrum',
    description: 'Hela badrummet',
    status: 'ongoing',
    startDate: '2026-09-01',
    budget: 85000,
})

export const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })

/** Answers the project, steps and expenses requests like the real server. */
export function mockServer(steps: Step[], expenses: Expense[] = []) {
    return vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
        const path = String(url)
        if (path.endsWith('/steps')) return json(steps)
        if (path.endsWith('/expenses')) return json(expenses)
        return json(project)
    })
}

export function renderPage() {
    render(
        <MemoryRouter initialEntries={['/project/p1']}>
            <Routes>
                <Route path="/project/:projectId" element={<ProjectDetail />} />
                <Route path="/project" element={<p>Projektlistan</p>} />
            </Routes>
        </MemoryRouter>,
    )
    return userEvent.setup()
}

/** Builds a complete expense for tests. Pass only the fields the test cares about. */
export function makeExpense(overrides: Partial<Expense> = {}): Expense {
    const description = overrides.description ?? 'Kakel'
    return {
        id: description,
        projectId: 'p1',
        stepId: null,
        category: 'other',
        supplier: '',
        description,
        amount: 1000,
        date: null,
        createdAt: '2026-10-01T12:00:00.000Z',
        ...overrides,
    }
}
