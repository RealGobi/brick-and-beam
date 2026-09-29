import { Link, useSearchParams } from 'react-router'
import type { Project } from '../api/projects'
import { ProjectForm } from '../componants/ProjectForm'
import { useProjects } from '../hooks/useProjects'
import { formatBudget, formatPeriod, statusLabels } from '../utils/formatProject'
import './Dashboard.css'
import './Projects.css'

// "?nytt" in the address opens the form, so other pages can link straight to it
const NEW_PROJECT_PARAM = 'nytt'

function Projects() {
    const { projects, loading, error, addProject } = useProjects()
    const [searchParams, setSearchParams] = useSearchParams()
    const showForm = searchParams.has(NEW_PROJECT_PARAM)

    const openForm = () => setSearchParams({ [NEW_PROJECT_PARAM]: '' })
    const closeForm = () => setSearchParams({}, { replace: true })

    function handleCreated(project: Project) {
        addProject(project)
        closeForm()
    }

    return (
        <div className="dashboard">
            <header className="projects-header">
                <div className="dashboard-hero">
                    <span className="eyebrow">Alla projekt</span>
                    <h1>Dina <em>projekt.</em></h1>
                </div>
                {!showForm && (
                    <button type="button" className="button button-primary" onClick={openForm}>
                        + Nytt projekt
                    </button>
                )}
            </header>

            {showForm && <ProjectForm onSaved={handleCreated} onCancel={closeForm} />}

            <ProjectList projects={projects} loading={loading} error={error} />
        </div>
    )
}

type ProjectListProps = {
    projects: Project[]
    loading: boolean
    error: string | null
}

function ProjectList({ projects, loading, error }: ProjectListProps) {
    if (loading) return <p className="empty">Hämtar projekt…</p>
    if (error) return <p className="empty" role="alert">Kunde inte hämta projekten. {error}</p>
    if (projects.length === 0) return <p className="empty">Inga projekt än.</p>

    return (
        <ul className="project-rows">
            {projects.map((project) => <ProjectRow key={project.id} project={project} />)}
        </ul>
    )
}

function ProjectRow({ project }: { project: Project }) {
    return (
        <li className="project-row">
            <div className="project-row-main">
                <Link to={`/project/${project.id}`} className="project-row-name">{project.name}</Link>
                {project.description && <span className="project-row-description">{project.description}</span>}
            </div>
            <span className={`status-badge status-${project.status}`}>{statusLabels[project.status]}</span>
            <span className="project-row-meta">{formatPeriod(project.startDate, project.endDate)}</span>
            <span className="project-row-meta">{formatBudget(project.budget)}</span>
        </li>
    )
}

export default Projects
