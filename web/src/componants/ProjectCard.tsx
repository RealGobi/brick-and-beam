import { Link } from 'react-router'
import type { Project } from '../api/projects'
import { formatTimestamp, statusLabels } from '../utils/formatProject'
import './ProjectCard.css'

/**
 * A project as a card with its newest image (or a striped placeholder), name, creation date and status.
 * The whole card is a link.
 */
export function ProjectCard({ project }: { project: Project }) {
    return (
        <Link to={`/project/${project.id}`} className="project-card">
            <div className="project-card-cover">
                {project.coverImageUrl && <img src={project.coverImageUrl} alt="" loading="lazy" />}
            </div>
            <div className="project-card-body">
                <div className="project-card-text">
                    <h3>{project.name}</h3>
                    <time dateTime={project.createdAt}>{formatTimestamp(project.createdAt)}</time>
                </div>
                <span className={`status-badge status-${project.status}`}>{statusLabels[project.status]}</span>
            </div>
        </Link>
    )
}

/** Dashed card that leads to creating a new project. */
export function AddProjectCard() {
    return (
        <Link to="/project?nytt" className="project-card project-card-add">
            + Lägg till projekt
        </Link>
    )
}
