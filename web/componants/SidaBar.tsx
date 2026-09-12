import { NavLink } from 'react-router'

type SideBarProps = {

}

export function SidaBar({ }: SideBarProps) {

    return (
        <aside>
            <div>Placeholder avatar/ namn</div>
            <nav>
                <NavLink to='overview'>Översikt</NavLink>
                <NavLink to='project'>Projekt</NavLink>
            </nav>
        </aside>
    )
}

