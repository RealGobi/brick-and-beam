import type { Step } from '../api/steps'
import { formatDate, formatStepProgress, stepPriorityLabels, stepStatusLabels } from '../utils/formatProject'
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

/**
 * The steps as dots on a line, spread out evenly. The dot size shows the step's priority,
 * its color the status, and the line is green up to the last done step.
 * Clicking a dot calls onSelect, which jumps to that step.
 */
export function StepTimeline({ steps, onSelect, compact = false, activeStepId = null, label = 'Tidslinje' }: StepTimelineProps) {
    const doneCount = steps.filter((step) => step.status === 'done').length
    const lastDoneIndex = steps.findLastIndex((step) => step.status === 'done')

    return (
        <nav className={`step-timeline${compact ? ' is-compact' : ''}`} aria-label={label}>
            <p className="step-timeline-progress">{formatStepProgress(doneCount, steps.length)}</p>

            {steps.length > 0 && (
                <ol className="step-timeline-list">
                    {steps.map((step, index) => {
                        const date = step.date ? formatDate(step.date) : 'Inget datum'
                        const reached = index <= lastDoneIndex ? ' is-reached' : ''
                        const isActive = step.id === activeStepId

                        return (
                            <li key={step.id} className={`step-timeline-item${reached}${isActive ? ' is-active' : ''}`}>
                                <button
                                    type="button"
                                    className="step-timeline-button"
                                    title={step.name}
                                    aria-current={isActive ? 'step' : undefined}
                                    aria-label={`${step.name}, ${stepStatusLabels[step.status]}, ${stepPriorityLabels[step.priority]}, ${date}. Gå till steget`}
                                    onClick={() => onSelect(step.id)}
                                >
                                    <span
                                        className={`step-timeline-dot is-${step.priority} is-${step.status}`}
                                        aria-hidden="true"
                                    />
                                    <span className="step-timeline-name">{step.name}</span>
                                    <span className="step-timeline-date">{step.date ? formatDate(step.date) : '—'}</span>
                                </button>
                            </li>
                        )
                    })}
                </ol>
            )}
        </nav>
    )
}
