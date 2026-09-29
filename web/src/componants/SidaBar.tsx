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
            <div className="sidebar-brand">
                Brick <span className="sidebar-brand-amp">&amp;</span> Beam
            </div>
            <nav className="sidebar-nav">
                <NavLink to='/overview' className={linkClass}>Översikt</NavLink>
                <NavLink to='/project' className={linkClass}>Projekt</NavLink>
            </nav>
            <div className="sidebar-footer">
                <span className="sidebar-avatar" aria-hidden="true">AN</span>
                <div className="sidebar-user">
                    <div className="sidebar-user-name">Placeholder namn</div>
                    {status && <small className="sidebar-status">{status}</small>}
                </div>
            </div>
        </aside>
    )
}
