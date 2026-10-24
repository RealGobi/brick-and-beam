import { useState } from 'react'
import { deleteService, deleteServiceImage, uploadServiceImages, type ServiceEntry } from '../api/services'
import type { StepImage } from '../api/steps'
import { formatAmount, formatDate } from '../utils/formatProject'
import { ImageGallery } from './ImageGallery'
import { ServiceForm } from './ServiceForm'
import './StepCard.css'

type ServiceCardProps = {
    service: ServiceEntry
    onSaved: (service: ServiceEntry) => void
    onDeleted: (serviceId: string) => void
    onImagesChange: (serviceId: string, images: StepImage[]) => void
}

/** One documented service with its images, and buttons for editing and deleting it. */
export function ServiceCard({ service, onSaved, onDeleted, onImagesChange }: ServiceCardProps) {
    const [editing, setEditing] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleDelete() {
        if (!window.confirm(`Ta bort servicen "${service.name}"? Dess bilder tas också bort.`)) return

        setDeleting(true)
        setError(null)
        try {
            await deleteService(service.id)
            onDeleted(service.id)
        } catch (deleteError) {
            setError(deleteError instanceof Error ? deleteError.message : 'Kunde inte ta bort servicen')
            setDeleting(false)
        }
    }

    if (editing) {
        return (
            <ServiceForm
                productId={service.productId}
                service={service}
                onSaved={(saved) => {
                    onSaved(saved)
                    setEditing(false)
                }}
                onCancel={() => setEditing(false)}
            />
        )
    }

    // "Ventilationsteknik · 1 200 kr", leaving out what is not known
    const details = [service.performedBy, service.cost === null ? null : formatAmount(service.cost)]
        .filter(Boolean)
        .join(' · ')

    return (
        <article className="step-card step-card-done">
            <header className="step-card-head">
                <h3>{service.name}</h3>
                <time className="step-card-date" dateTime={service.performedOn}>{formatDate(service.performedOn)}</time>
            </header>

            {details && <p className="step-card-date">{details}</p>}
            {service.description && <p className="step-card-description">{service.description}</p>}

            <ImageGallery
                images={service.images}
                upload={(files) => uploadServiceImages(service.id, files)}
                remove={deleteServiceImage}
                onChange={(images) => onImagesChange(service.id, images)}
            />

            {error && <p className="form-error" role="alert">{error}</p>}

            <div className="step-actions">
                <button type="button" className="button" disabled={deleting} onClick={() => setEditing(true)}>
                    Redigera
                </button>
                <button type="button" className="button button-danger" disabled={deleting} onClick={handleDelete}>
                    Ta bort
                </button>
            </div>
        </article>
    )
}
