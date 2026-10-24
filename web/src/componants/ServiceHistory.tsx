import { useState } from 'react'
import type { ServiceEntry } from '../api/services'
import { useServices } from '../hooks/useServices'
import { ServiceCard } from './ServiceCard'
import { ServiceForm } from './ServiceForm'

type ServiceHistoryProps = {
    productId: string
    /** Called when services are added, edited or deleted, since that changes the product's next service */
    onChanged: () => void
}

/** The documented services of a product, newest first, with a form for adding one. */
export function ServiceHistory({ productId, onChanged }: ServiceHistoryProps) {
    const { services, loading, error, saveService, removeService, setServiceImages } = useServices(productId)
    const [showForm, setShowForm] = useState(false)
    const [uploadWarning, setUploadWarning] = useState<string | null>(null)

    function handleCreated(service: ServiceEntry, warning?: string) {
        saveService(service)
        setShowForm(false)
        setUploadWarning(warning ?? null)
        onChanged()
    }

    function handleSaved(service: ServiceEntry) {
        saveService(service)
        onChanged()
    }

    function handleDeleted(serviceId: string) {
        removeService(serviceId)
        onChanged()
    }

    return (
        <section className="project-steps">
            <div className="section-head">
                <h2>Servicehistorik</h2>
                {!showForm && !loading && !error && (
                    <button type="button" className="button button-primary" onClick={() => setShowForm(true)}>
                        + Ny service
                    </button>
                )}
            </div>

            {loading && <p className="empty">Hämtar servicehistorik…</p>}
            {error && <p className="form-error" role="alert">Kunde inte hämta servicehistoriken. {error}</p>}
            {uploadWarning && <p className="form-error" role="alert">{uploadWarning}</p>}

            {showForm && <ServiceForm productId={productId} onSaved={handleCreated} onCancel={() => setShowForm(false)} />}

            {!loading && !error && services.length === 0 && !showForm && (
                <p className="empty">Ingen service dokumenterad än.</p>
            )}
            {services.map((service) => (
                <ServiceCard
                    key={service.id}
                    service={service}
                    onSaved={handleSaved}
                    onDeleted={handleDeleted}
                    onImagesChange={setServiceImages}
                />
            ))}
        </section>
    )
}
