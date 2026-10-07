import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { makeStep } from '../test/makeStep'
import { stepElementId } from '../utils/stepElementId'
import { StickyStepTimeline } from './StickyStepTimeline'

// jsdom has no IntersectionObserver. This fake records what is observed,
// so a test can report elements as scrolled in or out of view.
type Report = (target: Element, isIntersecting: boolean, top?: number) => void
const observers: { callback: IntersectionObserverCallback; targets: Element[] }[] = []

class FakeIntersectionObserver {
    private entry: { callback: IntersectionObserverCallback; targets: Element[] }

    constructor(callback: IntersectionObserverCallback) {
        this.entry = { callback, targets: [] }
        observers.push(this.entry)
    }
    observe(target: Element) {
        this.entry.targets.push(target)
    }
    disconnect() {
        this.entry.targets = []
    }
}

const report: Report = (target, isIntersecting, top = 0) => {
    for (const observer of observers.filter((candidate) => candidate.targets.includes(target))) {
        const entry = { target, isIntersecting, boundingClientRect: { top } } as unknown as IntersectionObserverEntry
        act(() => observer.callback([entry], {} as IntersectionObserver))
    }
}

const steps = [makeStep({ id: 's1', name: 'Riva' }), makeStep({ id: 's2', name: 'Kakel' })]

function renderWithCards() {
    const { container } = render(
        <div>
            <StickyStepTimeline steps={steps} onSelect={vi.fn()} />
            {steps.map((step) => (
                <article key={step.id} id={stepElementId(step.id)} />
            ))}
        </div>,
    )
    return container
}

beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver)
})

afterEach(() => {
    vi.unstubAllGlobals()
    observers.length = 0
})

describe('StickyStepTimeline', () => {
    it('shows only the full timeline at first', () => {
        renderWithCards()

        expect(screen.getByRole('navigation', { name: 'Tidslinje' })).toBeInTheDocument()
        expect(screen.queryByRole('navigation', { name: 'Tidslinje, kompakt' })).not.toBeInTheDocument()
    })

    it('shows the compact timeline once the full one has scrolled away at the top', () => {
        const container = renderWithCards()

        report(container.querySelector('.sticky-timeline-sentinel')!, false, -200)

        expect(screen.getByRole('navigation', { name: 'Tidslinje, kompakt' })).toHaveClass('is-compact')
    })

    it('keeps the compact timeline hidden when the marker is below the screen, not above it', () => {
        const container = renderWithCards()

        report(container.querySelector('.sticky-timeline-sentinel')!, false, 900)

        expect(screen.queryByRole('navigation', { name: 'Tidslinje, kompakt' })).not.toBeInTheDocument()
    })

    it('rings the first step that is in view', () => {
        renderWithCards()

        report(document.getElementById('step-s2')!, true)
        expect(screen.getByRole('button', { name: /^Kakel/ })).toHaveAttribute('aria-current', 'step')

        report(document.getElementById('step-s1')!, true)
        expect(screen.getByRole('button', { name: /^Riva/ })).toHaveAttribute('aria-current', 'step')
        expect(screen.getByRole('button', { name: /^Kakel/ })).not.toHaveAttribute('aria-current')
    })

    it('rings no step when none is in view', () => {
        renderWithCards()

        report(document.getElementById('step-s1')!, true)
        report(document.getElementById('step-s1')!, false)

        expect(screen.getByRole('button', { name: /^Riva/ })).not.toHaveAttribute('aria-current')
    })

    it('still works as a plain timeline where IntersectionObserver is missing', () => {
        vi.unstubAllGlobals()
        vi.stubGlobal('IntersectionObserver', undefined)

        renderWithCards()

        expect(screen.getAllByRole('button')).toHaveLength(2)
    })
})
