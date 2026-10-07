import { useRef } from 'react'
import type { Step } from '../api/steps'
import { useScrolledPast, useStepInView } from '../hooks/useStickyTimeline'
import { StepTimeline } from './StepTimeline'
import './StickyStepTimeline.css'

type StickyStepTimelineProps = {
    steps: Step[]
    onSelect: (stepId: string) => void
}

/**
 * Experiment: the full timeline scrolls away as usual, and once it is gone a compact copy
 * sticks to the top of the screen while scrolling through the steps. Both ring the step in view.
 * Place it as the first child of the element that holds the steps, so the compact copy
 * stops sticking where the steps end. To remove the experiment, use StepTimeline directly again.
 */
export function StickyStepTimeline({ steps, onSelect }: StickyStepTimelineProps) {
    const sentinel = useRef<HTMLDivElement>(null)
    const fullTimelineGone = useScrolledPast(sentinel)
    const stepInView = useStepInView(steps.map((step) => step.id))

    return (
        <>
            <StepTimeline steps={steps} onSelect={onSelect} activeStepId={stepInView} />

            {/* Invisible marker below the full timeline: once it has scrolled away, show the compact one */}
            <div ref={sentinel} className="sticky-timeline-sentinel" aria-hidden="true" />

            {/* Zero height, so showing the compact bar inside never moves the content below */}
            <div className="sticky-timeline">
                {fullTimelineGone && steps.length > 0 && (
                    <div className="sticky-timeline-bar">
                        <StepTimeline
                            steps={steps}
                            onSelect={onSelect}
                            compact
                            activeStepId={stepInView}
                            label="Tidslinje, kompakt"
                        />
                    </div>
                )}
            </div>
        </>
    )
}
