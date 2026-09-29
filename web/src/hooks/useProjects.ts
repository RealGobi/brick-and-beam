import { useCallback, useEffect, useState } from 'react'
import { fetchProjects, type Project } from '../api/projects'

type ProjectsState = {
    projects: Project[]
    loading: boolean
    error: string | null
}

type UseProjectsResult = ProjectsState & {
    /** Shows a newly created project first in the list, without fetching everything again. */
    addProject: (project: Project) => void
}

/** Loads all projects once when the component mounts. */
export function useProjects(): UseProjectsResult {
    const [state, setState] = useState<ProjectsState>({ projects: [], loading: true, error: null })

    useEffect(() => {
        // Ignore the result if the component unmounted before the request finished
        let ignore = false

        fetchProjects()
            .then((projects) => {
                if (!ignore) setState({ projects, loading: false, error: null })
            })
            .catch((error: Error) => {
                if (!ignore) setState({ projects: [], loading: false, error: error.message })
            })

        return () => {
            ignore = true
        }
    }, [])

    const addProject = useCallback((project: Project) => {
        setState((previous) => ({ ...previous, projects: [project, ...previous.projects] }))
    }, [])

    return { ...state, addProject }
}
