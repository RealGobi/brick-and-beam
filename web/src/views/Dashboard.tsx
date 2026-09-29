import { Link } from 'react-router'
import type { Project, ProjectStatus } from '../api/projects'
import { AddProjectCard, ProjectCard } from '../componants/ProjectCard'
import { StatCard } from '../componants/StatCard'
import { useProjects } from '../hooks/useProjects'
import './Dashboard.css'

const countBy = (projects: Project[], status: ProjectStatus) =>
    projects.filter((p) => p.status === status).length

function Dashboard() {
    const { projects, loading, error } = useProjects()

    return (
        <div className="dashboard">
            <header className="dashboard-hero">
                <span className="eyebrow">Välkommen hem</span>
                <div className="dashboard-hero-row">
                    <div className="dashboard-hero-text">
                        <h1>
                            Din renoverings&shy;<em>dagbok.</em>
                        </h1>
                        <p className="lead">
                            En lugn plats för att dokumentera vad som förändras, vad som är klart och vad som
                            kommer härnäst.
                        </p>
                    </div>
                    <Link to="/project?nytt" className="button button-primary">+ Nytt projekt</Link>
                </div>
            </header>

            <section className="stat-panel" aria-label="Projekt per status">
                <StatCard label="Färdiga" value={countBy(projects, 'done')} total={projects.length} tone="done" />
                <StatCard label="Pågående" value={countBy(projects, 'ongoing')} total={projects.length} tone="ongoing" />
                <StatCard label="Planerade" value={countBy(projects, 'planned')} total={projects.length} tone="planned" />
            </section>

            <section>
                <div className="section-head">
                    <h2>Senaste projekten</h2>
                    <Link to="/project" className="see-all">Visa alla →</Link>
                </div>
                <RecentProjects projects={projects} loading={loading} error={error} />
            </section>
        </div>
    )
}

type RecentProjectsProps = {
    projects: Project[]
    loading: boolean
    error: string | null
}

function RecentProjects({ projects, loading, error }: RecentProjectsProps) {
    if (loading) return <p className="empty">Hämtar projekt…</p>
    if (error) return <p className="empty" role="alert">Kunde inte hämta projekten. {error}</p>

    return (
        <>
            {projects.length === 0 && <p className="empty">Inga projekt än.</p>}
            <ul className="project-cards">
                {projects.slice(0, 5).map((project) => (
                    <li key={project.id}><ProjectCard project={project} /></li>
                ))}
                <li><AddProjectCard /></li>
            </ul>
        </>
    )
}

export default Dashboard
