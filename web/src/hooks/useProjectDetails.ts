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
    addStep: (step: Step) => void
    addImages: (stepId: string, images: StepImage[]) => void
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
 * Loads a project and its steps, and keeps them updated as steps and images are added.
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

    const addStep = useCallback((step: Step) => {
        setState((previous) => ({ ...previous, steps: [...previous.steps, step].sort(compareSteps) }))
    }, [])

    const addImages = useCallback((stepId: string, images: StepImage[]) => {
        setState((previous) => ({
            ...previous,
            steps: previous.steps.map((step) =>
                step.id === stepId ? { ...step, images: [...step.images, ...images] } : step,
            ),
        }))
    }, [])

    return { ...state, addStep, addImages }
}
