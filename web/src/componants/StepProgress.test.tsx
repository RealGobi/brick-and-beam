import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StepProgress } from './StepProgress'

describe('StepProgress', () => {
    it('shows how many steps are done and fills the bar to match', () => {
        render(<StepProgress done={3} total={5} />)

        expect(screen.getByText('3 av 5 steg klara')).toBeInTheDocument()
        expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '60')
    })

    it('says when there are no steps yet and leaves the bar empty', () => {
        render(<StepProgress done={0} total={0} />)

        expect(screen.getByText('Inga steg än')).toBeInTheDocument()
        expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '0')
    })

    it('says when all steps are done and fills the bar', () => {
        render(<StepProgress done={4} total={4} />)

        expect(screen.getByText('Alla steg klara')).toBeInTheDocument()
        expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '100')
    })

    it('shows zero done when no step is finished', () => {
        render(<StepProgress done={0} total={2} />)

        expect(screen.getByText('0 av 2 steg klara')).toBeInTheDocument()
    })
})
