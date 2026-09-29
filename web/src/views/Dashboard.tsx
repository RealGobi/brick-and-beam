import { Link } from 'react-router'
import { StatCard } from '../componants/StatCard'
import type { Project, ProjectStatus } from '../api/projects'
import { useProjects } from '../hooks/useProjects'
import './Dashboard.css'

const countBy = (projects: Project[], status: ProjectStatus) =>
    projects.filter((p) => p.status === status).length

const iconProps = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
}

const CheckIcon = () => (
    <svg {...iconProps}><circle cx="12" cy="12" r="9" /><path d="m8.5 12 2.5 2.5 4.5-5" /></svg>
)

const HammerIcon = () => (
    <svg {...iconProps}><path d="m14 10-9.5 9.5a1.4 1.4 0 0 1-2-2L12 8" /><path d="m11 5 3-2 7 7-2 3-3-1-2 2-4-4 2-2Z" /></svg>
)

const LayersIcon = () => (
    <svg {...iconProps}><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5" /><path d="m3 16 9 5 9-5" /></svg>
)

function Dashboard() {
    const { projects, loading, error } = useProjects()

    return (
        <div className="dashboard">
            <header className="dashboard-hero">
                <span className="eyebrow">Välkommen hem</span>
                <h1>Din renoveringsdagbok.</h1>
                <p className="lead">
                    En lugn plats för att dokumentera vad som förändras, vad som är klart och vad som kommer härnäst.
                </p>
            </header>

            <section className="stat-grid">
                <StatCard label="Färdiga" value={countBy(projects, 'done')} icon={<CheckIcon />} />
                <StatCard label="Pågående" value={countBy(projects, 'ongoing')} icon={<HammerIcon />} />
                <StatCard label="Planerade" value={countBy(projects, 'planned')} icon={<LayersIcon />} />
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
    if (projects.length === 0) return <p className="empty">Inga projekt än.</p>

    return (
        <ul className="project-list">
            {projects.slice(0, 5).map((p) => (
                <li key={p.id}><Link to={`/project/${p.id}`}>{p.name}</Link></li>
            ))}
        </ul>
    )
}

export default Dashboard
