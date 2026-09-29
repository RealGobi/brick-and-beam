import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { deleteProject, type Project } from '../api/projects'
import type { Step } from '../api/steps'
import { ProjectForm } from '../componants/ProjectForm'
import { StepCard } from '../componants/StepCard'
import { StepForm } from '../componants/StepForm'
import { useProjectDetails } from '../hooks/useProjectDetails'
import { formatBudget, formatPeriod, statusLabels } from '../utils/formatProject'
import './Dashboard.css'
import './Projects.css'
import './ProjectDetail.css'

function ProjectDetail() {
    // The route always provides the id, the fallback only satisfies the type
    const { projectId = '' } = useParams()

    // The router keeps this component mounted when only the id changes, the key gives each project fresh state
    return <ProjectPage key={projectId} projectId={projectId} />
}

function ProjectPage({ projectId }: { projectId: string }) {
    const { project, steps, loading, error, setProject, saveStep, removeStep, setStepImages } =
        useProjectDetails(projectId)
    const [showStepForm, setShowStepForm] = useState(false)
    const [uploadWarning, setUploadWarning] = useState<string | null>(null)

    if (loading) return <p className="empty">Hämtar projektet…</p>
    if (error || !project) {
        return (
            <div className="dashboard">
                <p className="empty" role="alert">Kunde inte hämta projektet. {error}</p>
                <Link to="/project" className="see-all">← Alla projekt</Link>
            </div>
        )
    }

    function handleStepCreated(step: Step, warning?: string) {
        saveStep(step)
        setShowStepForm(false)
        setUploadWarning(warning ?? null)
    }

    return (
        <div className="dashboard">
            <ProjectHeader project={project} onSaved={setProject} />

            <section className="project-steps">
                <div className="section-head">
                    <h2>Steg</h2>
                    {!showStepForm && (
                        <button type="button" className="button button-primary" onClick={() => setShowStepForm(true)}>
                            Nytt steg
                        </button>
                    )}
                </div>

                {uploadWarning && <p className="form-error" role="alert">{uploadWarning}</p>}

                {showStepForm && (
                    <StepForm
                        projectId={project.id}
                        onSaved={handleStepCreated}
                        onCancel={() => setShowStepForm(false)}
                    />
                )}

                {steps.length === 0 && !showStepForm && <p className="empty">Inga steg än.</p>}
                {steps.map((step) => (
                    <StepCard
                        key={step.id}
                        step={step}
                        onSaved={saveStep}
                        onDeleted={removeStep}
                        onImagesChange={setStepImages}
                    />
                ))}
            </section>
        </div>
    )
}

type ProjectHeaderProps = {
    project: Project
    onSaved: (project: Project) => void
}

function ProjectHeader({ project, onSaved }: ProjectHeaderProps) {
    const navigate = useNavigate()
    const [editing, setEditing] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleDelete() {
        if (!window.confirm(`Ta bort projektet "${project.name}"? Alla steg och bilder tas också bort.`)) return

        setDeleting(true)
        setError(null)
        try {
            await deleteProject(project.id)
            navigate('/project')
        } catch (deleteError) {
            setError(deleteError instanceof Error ? deleteError.message : 'Kunde inte ta bort projektet')
            setDeleting(false)
        }
    }

    if (editing) {
        return (
            <ProjectForm
                project={project}
                onSaved={(saved) => {
                    onSaved(saved)
                    setEditing(false)
                }}
                onCancel={() => setEditing(false)}
            />
        )
    }

    return (
        <header className="dashboard-hero">
            <Link to="/project" className="see-all">← Alla projekt</Link>
            <h1>{project.name}</h1>
            {project.description && <p className="lead project-detail-description">{project.description}</p>}
            <dl className="project-facts">
                <div>
                    <dt>Status</dt>
                    <dd>
                        <span className={`status-badge status-${project.status}`}>
                            {statusLabels[project.status]}
                        </span>
                    </dd>
                </div>
                <div>
                    <dt>Period</dt>
                    <dd>{formatPeriod(project.startDate, project.endDate)}</dd>
                </div>
                <div>
                    <dt>Budget</dt>
                    <dd>{formatBudget(project.budget)}</dd>
                </div>
            </dl>

            {error && <p className="form-error" role="alert">{error}</p>}

            <div className="project-actions">
                <button type="button" className="button" disabled={deleting} onClick={() => setEditing(true)}>
                    Redigera
                </button>
                <button type="button" className="button button-danger" disabled={deleting} onClick={handleDelete}>
                    {deleting ? 'Tar bort…' : 'Ta bort projekt'}
                </button>
            </div>
        </header>
    )
}

export default ProjectDetail
