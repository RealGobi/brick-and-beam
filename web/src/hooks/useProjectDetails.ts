import { useCallback, useEffect, useState } from 'react'
import { fetchProject, type Project } from '../api/projects'
import { fetchSteps, type Step, type StepImage } from '../api/steps'

type ProjectDetailsState = {
    project: Project | null
    steps: Step[]
    loading: boolean
    error: string | null
}

type UseProjectDetailsResult = ProjectDetailsState & {
    setProject: (project: Project) => void
    /** Adds a new step or replaces an existing one with the same id, keeping date order. */
    saveStep: (step: Step) => void
    removeStep: (stepId: string) => void
    /** Replaces only the images, so a status change made meanwhile is kept. */
    setStepImages: (stepId: string, images: StepImage[]) => void
}

const initialState: ProjectDetailsState = { project: null, steps: [], loading: true, error: null }

// Same order as the server: by date, steps without a date last, then by creation time
function compareSteps(a: Step, b: Step): number {
    if (a.date !== b.date) {
        if (a.date === null) return 1
        if (b.date === null) return -1
        return a.date < b.date ? -1 : 1
    }
    return a.createdAt < b.createdAt ? -1 : 1
}

/**
 * Loads a project and its steps, and keeps them updated as they change.
 * Render the component with key={projectId} so the state starts over when the id changes.
 */
export function useProjectDetails(projectId: string): UseProjectDetailsResult {
    const [state, setState] = useState(initialState)

    useEffect(() => {
        // Ignore the result if the component unmounted before the requests finished
        let ignore = false

        Promise.all([fetchProject(projectId), fetchSteps(projectId)])
            .then(([project, steps]) => {
                if (!ignore) setState({ project, steps, loading: false, error: null })
            })
            .catch((error: Error) => {
                if (!ignore) setState({ project: null, steps: [], loading: false, error: error.message })
            })

        return () => {
            ignore = true
        }
    }, [projectId])

    const setProject = useCallback((project: Project) => {
        setState((previous) => ({ ...previous, project }))
    }, [])

    const saveStep = useCallback((step: Step) => {
        setState((previous) => {
            const otherSteps = previous.steps.filter((existing) => existing.id !== step.id)
            return { ...previous, steps: [...otherSteps, step].sort(compareSteps) }
        })
    }, [])

    const removeStep = useCallback((stepId: string) => {
        setState((previous) => ({ ...previous, steps: previous.steps.filter((step) => step.id !== stepId) }))
    }, [])

    const setStepImages = useCallback((stepId: string, images: StepImage[]) => {
        setState((previous) => ({
            ...previous,
            steps: previous.steps.map((step) => (step.id === stepId ? { ...step, images } : step)),
        }))
    }, [])

    return { ...state, setProject, saveStep, removeStep, setStepImages }
}
