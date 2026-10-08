import { useEffect, useRef } from 'react'
import type { Step } from '../api/steps'
import { formatDate, formatMonth, formatStepProgress, stepPriorityLabels, stepStatusLabels } from '../utils/formatProject'
import './StepTimeline.css'

type StepTimelineProps = {
    /** In the order they should appear, which is date order */
    steps: Step[]
    onSelect: (stepId: string) => void
    /** Only dots and line, without progress, names and dates */
    compact?: boolean
    /** The step currently shown on screen, marked with a ring */
    activeStepId?: string | null
    /** Name of the navigation for screen readers, needed when two timelines are on the page */
    label?: string
}

// From this many steps, only milestones get a name under their dot, so the timeline stays readable
const DENSE_FROM_STEPS = 13

/** For each step, the month to mark above it ("okt."), or null when it is in the same month as the step before. */
function monthMarkers(steps: Step[]): (string | null)[] {
    let previousMonth: string | null = null

    return steps.map((step) => {
        if (!step.date) return null
        const month = step.date.slice(0, 7)
        if (month === previousMonth) return null

        // The year is shown on the first marker and in January, so a long project stays clear
        const withYear = previousMonth === null || month.endsWith('-01')
        previousMonth = month
        return formatMonth(step.date, withYear)
    })
}

// Milestone names closer than this many steps would overlap, so the later one moves down a row
const LABEL_GAP_STEPS = 5

/** For each step, whether its name goes one row lower so it doesn't collide with the milestone before. */
function staggeredLabels(steps: Step[]): boolean[] {
    let previousIndex = -Infinity
    let previousStaggered = false

    return steps.map((step, index) => {
        if (step.priority !== 'milestone') return false
        const staggered = !previousStaggered && index - previousIndex < LABEL_GAP_STEPS
        previousIndex = index
        previousStaggered = staggered
        return staggered
    })
}

/**
 * The steps as dots on a line, spread out evenly. The dot size shows the step's priority,
 * its color the status, and the line is green up to the last done step.
 * Clicking a dot calls onSelect, which jumps to that step.
 * With many steps the timeline turns dense: narrower, names only for milestones, and month markers.
 */
export function StepTimeline({ steps, onSelect, compact = false, activeStepId = null, label = 'Tidslinje' }: StepTimelineProps) {
    const list = useRef<HTMLOListElement>(null)
    const dense = steps.length >= DENSE_FROM_STEPS
    const months = dense && !compact ? monthMarkers(steps) : []
    const staggered = dense && !compact ? staggeredLabels(steps) : []
    const doneCount = steps.filter((step) => step.status === 'done').length
    const lastDoneIndex = steps.findLastIndex((step) => step.status === 'done')

    // Keep the step in view visible when the timeline is wider than the screen
    useEffect(() => {
        const element = list.current
        const activeItem = element?.querySelector<HTMLElement>('.step-timeline-item.is-active')
        if (!element || !activeItem) return

        const left = activeItem.offsetLeft - element.clientWidth / 2 + activeItem.offsetWidth / 2
        const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
        element.scrollTo?.({ left, behavior: reduceMotion ? 'auto' : 'smooth' })
    }, [activeStepId])

    const classes = ['step-timeline', compact && 'is-compact', dense && 'is-dense'].filter(Boolean).join(' ')

    return (
        <nav className={classes} aria-label={label}>
            <p className="step-timeline-progress">{formatStepProgress(doneCount, steps.length)}</p>

            {steps.length > 0 && (
                <ol className="step-timeline-list" ref={list}>
                    {steps.map((step, index) => {
                        const date = step.date ? formatDate(step.date) : 'Inget datum'
                        const reached = index <= lastDoneIndex
                        const isActive = step.id === activeStepId
                        const showText = !dense || step.priority === 'milestone'
                        const itemClasses = [
                            'step-timeline-item',
                            reached && 'is-reached',
                            isActive && 'is-active',
                            staggered[index] && 'is-staggered',
                        ]

                        return (
                            <li key={step.id} className={itemClasses.filter(Boolean).join(' ')}>
                                {months[index] && <span className="step-timeline-month">{months[index]}</span>}
                                <button
                                    type="button"
                                    className="step-timeline-button"
                                    title={`${step.name}, ${date}`}
                                    aria-current={isActive ? 'step' : undefined}
                                    aria-label={`${step.name}, ${stepStatusLabels[step.status]}, ${stepPriorityLabels[step.priority]}, ${date}. Gå till steget`}
                                    onClick={() => onSelect(step.id)}
                                >
                                    <span
                                        className={`step-timeline-dot is-${step.priority} is-${step.status}`}
                                        aria-hidden="true"
                                    />
                                    {showText && <span className="step-timeline-name">{step.name}</span>}
                                    {showText && (
                                        <span className="step-timeline-date">{step.date ? formatDate(step.date) : '—'}</span>
                                    )}
                                </button>
                            </li>
                        )
                    })}
                </ol>
            )}
        </nav>
    )
}
