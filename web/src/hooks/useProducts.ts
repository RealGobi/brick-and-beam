import { useCallback, useEffect, useState } from 'react'
import { fetchProducts, type Product } from '../api/products'

type ProductsState = {
    products: Product[]
    loading: boolean
    error: string | null
}

type UseProductsResult = ProductsState & {
    /** Shows a newly added product without fetching everything again. */
    addProduct: (product: Product) => void
}

// Same order as the server: soonest service first, products without an interval last, then by name
function compareProducts(a: Product, b: Product): number {
    if (a.nextServiceDate !== b.nextServiceDate) {
        if (a.nextServiceDate === null) return 1
        if (b.nextServiceDate === null) return -1
        return a.nextServiceDate < b.nextServiceDate ? -1 : 1
    }
    return a.name.localeCompare(b.name, 'sv')
}

/** Loads all products once when the component mounts. */
export function useProducts(): UseProductsResult {
    const [state, setState] = useState<ProductsState>({ products: [], loading: true, error: null })

    useEffect(() => {
        // Ignore the result if the component unmounted before the request finished
        let ignore = false

        fetchProducts()
            .then((products) => {
                if (!ignore) setState({ products, loading: false, error: null })
            })
            .catch((error: Error) => {
                if (!ignore) setState({ products: [], loading: false, error: error.message })
            })

        return () => {
            ignore = true
        }
    }, [])

    const addProduct = useCallback((product: Product) => {
        setState((previous) => ({ ...previous, products: [...previous.products, product].sort(compareProducts) }))
    }, [])

    return { ...state, addProduct }
}
