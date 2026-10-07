import { useEffect, useState, type RefObject } from 'react'
import { stepElementId } from '../utils/stepElementId'

// Experiment: a sticky, compact timeline that follows the steps and shows which step is in view.

/**
 * True while the element has scrolled out of view at the top of the screen.
 * Put the element right before a sticky header to learn when the header is stuck.
 */
export function useScrolledPast(sentinel: RefObject<HTMLElement | null>): boolean {
    const [scrolledPast, setScrolledPast] = useState(false)

    useEffect(() => {
        const element = sentinel.current
        // Not available in some test environments, the timeline then simply stays in full size
        if (!element || typeof IntersectionObserver === 'undefined') return

        const observer = new IntersectionObserver(([entry]) => {
            setScrolledPast(!entry.isIntersecting && entry.boundingClientRect.top < 0)
        })
        observer.observe(element)
        return () => observer.disconnect()
    }, [sentinel])

    return scrolledPast
}

/**
 * The id of the step card at the top of the screen, just below the sticky timeline,
 * or null when no step card is there.
 */
export function useStepInView(stepIds: string[]): string | null {
    const [stepInView, setStepInView] = useState<string | null>(null)
    // Joined to a string so the effect only reruns when the steps really change
    const idsKey = stepIds.join(',')

    useEffect(() => {
        if (typeof IntersectionObserver === 'undefined') return

        const ids = idsKey ? idsKey.split(',') : []
        const visible = new Set<string>()

        // Only the band from below the sticky timeline to the middle of the screen counts as "in view"
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    const stepId = entry.target.id.replace(/^step-/, '')
                    if (entry.isIntersecting) visible.add(stepId)
                    else visible.delete(stepId)
                }
                // The first step in page order wins when several are in the band
                setStepInView(ids.find((id) => visible.has(id)) ?? null)
            },
            { rootMargin: '-80px 0px -50% 0px' },
        )

        for (const id of ids) {
            const card = document.getElementById(stepElementId(id))
            if (card) observer.observe(card)
        }
        return () => observer.disconnect()
    }, [idsKey])

    return stepInView
}
