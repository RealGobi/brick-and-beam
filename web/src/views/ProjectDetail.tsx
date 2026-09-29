import { useState } from 'react'
import { Link, useParams } from 'react-router'
import type { Project } from '../api/projects'
import type { Step } from '../api/steps'
import { NewStepForm } from '../componants/NewStepForm'
import { StepCard } from '../componants/StepCard'
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
    const { project, steps, loading, error, addStep, addImages } = useProjectDetails(projectId)
    const [showStepForm, setShowStepForm] = useState(false)

    if (loading) return <p className="empty">Hämtar projektet…</p>
    if (error || !project) {
        return (
            <div className="dashboard">
                <p className="empty" role="alert">Kunde inte hämta projektet. {error}</p>
                <Link to="/project" className="see-all">← Alla projekt</Link>
            </div>
        )
    }

    function handleStepCreated(step: Step) {
        addStep(step)
        setShowStepForm(false)
    }

    return (
        <div className="dashboard">
            <ProjectHeader project={project} />

            <section className="project-steps">
                <div className="section-head">
                    <h2>Steg</h2>
                    {!showStepForm && (
                        <button type="button" className="button button-primary" onClick={() => setShowStepForm(true)}>
                            Nytt steg
                        </button>
                    )}
                </div>

                {showStepForm && (
                    <NewStepForm
                        projectId={project.id}
                        onCreated={handleStepCreated}
                        onCancel={() => setShowStepForm(false)}
                    />
                )}

                {steps.length === 0 && !showStepForm && <p className="empty">Inga steg än.</p>}
                {steps.map((step) => <StepCard key={step.id} step={step} onImagesAdded={addImages} />)}
            </section>
        </div>
    )
}

function ProjectHeader({ project }: { project: Project }) {
    return (
        <header className="dashboard-hero">
            <Link to="/project" className="see-all">← Alla projekt</Link>
            <h1>{project.name}</h1>
            {project.description && <p className="lead project-detail-description">{project.description}</p>}
            <dl className="project-facts">
                <div>
                    <dt>Status</dt>
                    <dd>
                        <span className={`project-status project-status-${project.status}`}>
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
        </header>
    )
}

export default ProjectDetail
