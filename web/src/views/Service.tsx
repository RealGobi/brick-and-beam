import { useNavigate, useSearchParams } from 'react-router'
import type { Product } from '../api/products'
import { ProductForm } from '../componants/ProductForm'
import { ProductTable } from '../componants/ProductTable'
import { useProducts } from '../hooks/useProducts'
import './Dashboard.css'
import './Projects.css'

// "?nytt" in the address opens the form, so the dashboard can link straight to it
const NEW_PRODUCT_PARAM = 'nytt'

/** All products that need service, with a form for adding more. */
function Service() {
    const { products, loading, error, addProduct } = useProducts()
    const [searchParams, setSearchParams] = useSearchParams()
    const navigate = useNavigate()
    const showForm = searchParams.has(NEW_PRODUCT_PARAM)

    const openForm = () => setSearchParams({ [NEW_PRODUCT_PARAM]: '' })
    const closeForm = () => setSearchParams({}, { replace: true })

    // A new product has no history yet, so go straight to its page to add the first service
    function handleCreated(product: Product) {
        addProduct(product)
        navigate(`/service/${product.id}`)
    }

    return (
        <div className="dashboard">
            <header className="projects-header">
                <div className="dashboard-hero">
                    <span className="eyebrow">Service och underhåll</span>
                    <h1>Huset <em>i skick.</em></h1>
                </div>
                {!showForm && (
                    <button type="button" className="button button-primary" onClick={openForm}>
                        + Ny produkt
                    </button>
                )}
            </header>

            {showForm && <ProductForm onSaved={handleCreated} onCancel={closeForm} />}

            <ProductList products={products} loading={loading} error={error} />
        </div>
    )
}

type ProductListProps = {
    products: Product[]
    loading: boolean
    error: string | null
}

function ProductList({ products, loading, error }: ProductListProps) {
    if (loading) return <p className="empty">Hämtar produkter…</p>
    if (error) return <p className="empty" role="alert">Kunde inte hämta produkterna. {error}</p>
    if (products.length === 0) {
        return <p className="empty">Inga produkter än. Lägg till det som behöver service, t.ex. värmepumpen eller ventilationen.</p>
    }

    return <ProductTable products={products} />
}

export default Service
