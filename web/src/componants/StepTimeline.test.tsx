import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Step } from '../api/steps'
import { makeStep } from '../test/makeStep'
import { StepTimeline } from './StepTimeline'

function renderTimeline(steps: Step[]) {
    const onSelect = vi.fn()
    const { container } = render(<StepTimeline steps={steps} onSelect={onSelect} />)
    return { onSelect, container, user: userEvent.setup() }
}

const steps = [
    makeStep({ id: 's1', name: 'Riva', status: 'done', priority: 'small', date: '2026-09-01' }),
    makeStep({ id: 's2', name: 'Ny el', status: 'done', priority: 'milestone', date: '2026-09-12' }),
    makeStep({ id: 's3', name: 'Kakel', status: 'ongoing', priority: 'normal', date: null }),
]

describe('StepTimeline', () => {
    it('shows one button per step, in the given order, with name and date', () => {
        renderTimeline(steps)

        const buttons = screen.getAllByRole('button')
        expect(buttons).toHaveLength(3)
        expect(buttons[0]).toHaveTextContent('Riva1 sep. 2026')
        expect(buttons[2]).toHaveTextContent('Kakel—')
    })

    it('describes each step fully for screen readers', () => {
        renderTimeline(steps)

        expect(
            screen.getByRole('button', { name: 'Ny el, Klar, Milstolpe, 12 sep. 2026. Gå till steget' }),
        ).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Kakel, Pågående, Normal, Inget datum. Gå till steget' })).toBeInTheDocument()
    })

    it('sizes and colors each dot by priority and status', () => {
        const { container } = renderTimeline(steps)

        const dots = container.querySelectorAll('.step-timeline-dot')
        expect(dots[0]).toHaveClass('is-small', 'is-done')
        expect(dots[1]).toHaveClass('is-milestone', 'is-done')
        expect(dots[2]).toHaveClass('is-normal', 'is-ongoing')
    })

    it('marks the line as reached up to the last done step', () => {
        const { container } = renderTimeline(steps)

        const items = container.querySelectorAll('.step-timeline-item')
        expect(items[0]).toHaveClass('is-reached')
        expect(items[1]).toHaveClass('is-reached')
        expect(items[2]).not.toHaveClass('is-reached')
    })

    it('counts a step after the last done one as reached too when it is done earlier in the list', () => {
        const { container } = renderTimeline([
            makeStep({ id: 'a', status: 'ongoing' }),
            makeStep({ id: 'b', status: 'done' }),
        ])

        // The line is green up to the last done step, so the first one is passed even though it is not done
        expect(container.querySelectorAll('.step-timeline-item.is-reached')).toHaveLength(2)
    })

    it('calls onSelect with the id of the clicked step', async () => {
        const { user, onSelect } = renderTimeline(steps)

        await user.click(screen.getByRole('button', { name: /^Kakel/ }))

        expect(onSelect).toHaveBeenCalledWith('s3')
    })

    it('shows the progress above the line', () => {
        renderTimeline(steps)

        expect(screen.getByText('2 av 3 steg klara')).toBeInTheDocument()
    })

    it('shows only a short text and no line when there are no steps', () => {
        renderTimeline([])

        expect(screen.getByText('Inga steg än')).toBeInTheDocument()
        expect(screen.queryByRole('list')).not.toBeInTheDocument()
    })
})
