import { useCallback, useEffect, useState } from 'react'
import { fetchServices, type ServiceEntry } from '../api/services'
import type { StepImage } from '../api/steps'

type ServicesState = {
    services: ServiceEntry[]
    loading: boolean
    error: string | null
}

type UseServicesResult = ServicesState & {
    /** Adds a new service or replaces an existing one with the same id, newest first. */
    saveService: (service: ServiceEntry) => void
    removeService: (serviceId: string) => void
    /** Replaces only the images, so an edit made meanwhile is kept. */
    setServiceImages: (serviceId: string, images: StepImage[]) => void
}

// Same order as the server: newest first
function compareServices(a: ServiceEntry, b: ServiceEntry): number {
    if (a.performedOn !== b.performedOn) return a.performedOn < b.performedOn ? 1 : -1
    return a.createdAt < b.createdAt ? 1 : -1
}

/** Loads the service history of a product and keeps it updated as it changes. */
export function useServices(productId: string): UseServicesResult {
    const [state, setState] = useState<ServicesState>({ services: [], loading: true, error: null })

    useEffect(() => {
        // Ignore the result if the component unmounted before the request finished
        let ignore = false

        fetchServices(productId)
            .then((services) => {
                if (!ignore) setState({ services, loading: false, error: null })
            })
            .catch((error: Error) => {
                if (!ignore) setState({ services: [], loading: false, error: error.message })
            })

        return () => {
            ignore = true
        }
    }, [productId])

    const saveService = useCallback((service: ServiceEntry) => {
        setState((previous) => {
            const others = previous.services.filter((existing) => existing.id !== service.id)
            return { ...previous, services: [...others, service].sort(compareServices) }
        })
    }, [])

    const removeService = useCallback((serviceId: string) => {
        setState((previous) => ({
            ...previous,
            services: previous.services.filter((service) => service.id !== serviceId),
        }))
    }, [])

    const setServiceImages = useCallback((serviceId: string, images: StepImage[]) => {
        setState((previous) => ({
            ...previous,
            services: previous.services.map((service) => (service.id === serviceId ? { ...service, images } : service)),
        }))
    }, [])

    return { ...state, saveService, removeService, setServiceImages }
}
