import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { makeProject } from '../test/makeProject'
import { AddProjectCard, ProjectCard } from './ProjectCard'

describe('ProjectCard', () => {
    it('shows the name, creation date and status', () => {
        render(
            <MemoryRouter>
                <ProjectCard project={makeProject({ name: 'Altan', status: 'ongoing', createdAt: '2026-09-29T12:00:00.000Z' })} />
            </MemoryRouter>,
        )

        expect(screen.getByRole('heading', { name: 'Altan' })).toBeInTheDocument()
        expect(screen.getByText('29 sep. 2026')).toBeInTheDocument()
        expect(screen.getByText('Pågående')).toHaveClass('status-ongoing')
    })

    it('links to the project page', () => {
        render(
            <MemoryRouter>
                <ProjectCard project={makeProject({ id: 'p1', name: 'Altan' })} />
            </MemoryRouter>,
        )

        expect(screen.getByRole('link')).toHaveAttribute('href', '/project/p1')
    })
})

describe('ProjectCard: cover image', () => {
    function renderCard(coverImageUrl: string | null) {
        const { container } = render(
            <MemoryRouter>
                <ProjectCard project={makeProject({ coverImageUrl })} />
            </MemoryRouter>,
        )
        return container
    }

    it('shows the cover image when the project has one', () => {
        const container = renderCard('/api/uploads/kok.jpg')

        expect(container.querySelector('.project-card-cover img')).toHaveAttribute('src', '/api/uploads/kok.jpg')
    })

    it('shows only the striped placeholder when the project has no images', () => {
        const container = renderCard(null)

        expect(container.querySelector('.project-card-cover img')).toBeNull()
    })
})

describe('AddProjectCard', () => {
    it('links to the new project form', () => {
        render(
            <MemoryRouter>
                <AddProjectCard />
            </MemoryRouter>,
        )

        expect(screen.getByRole('link', { name: '+ Lägg till projekt' })).toHaveAttribute('href', '/project?nytt')
    })
})
