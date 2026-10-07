import './StepProgress.css'

type StepProgressProps = {
    done: number
    total: number
}

function progressText(done: number, total: number): string {
    if (total === 0) return 'Inga steg än'
    if (done === total) return 'Alla steg klara'
    return `${done} av ${total} steg klara`
}

/** How many of a project's steps are done, as text and a bar. */
export function StepProgress({ done, total }: StepProgressProps) {
    const percent = total === 0 ? 0 : Math.round((done / total) * 100)
    const text = progressText(done, total)

    return (
        <div className="step-progress">
            <span className="step-progress-text">{text}</span>
            <div
                className="step-progress-bar"
                role="meter"
                aria-label={text}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={percent}
            >
                <span style={{ width: `${percent}%` }} />
            </div>
        </div>
    )
}
