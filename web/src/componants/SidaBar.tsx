import { NavLink } from 'react-router'
import './SidaBar.css'

type SideBarProps = {
    status?: string
}

const linkClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'sidebar-link active' : 'sidebar-link'

export function SidaBar({ status }: SideBarProps) {

    return (
        <aside className="sidebar">
            <div className="sidebar-brand">Brick &amp; Beam</div>
            <nav className="sidebar-nav">
                <NavLink to='/overview' className={linkClass}>Översikt</NavLink>
                <NavLink to='/project' className={linkClass}>Projekt</NavLink>
            </nav>
            <div className="sidebar-footer">
                <div>Placeholder avatar/ namn</div>
                {status && <small className="sidebar-status">{status}</small>}
            </div>
        </aside>
    )
}
