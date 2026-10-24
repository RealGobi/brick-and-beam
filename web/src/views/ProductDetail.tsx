import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { deleteProduct, fetchProduct, type Product } from '../api/products'
import { ProductForm } from '../componants/ProductForm'
import { ServiceStatusBadge } from '../componants/ProductTable'
import { formatDate } from '../utils/formatProject'
import { formatServiceInterval } from '../utils/formatProduct'
import './Dashboard.css'
import './ProjectDetail.css'

function ProductDetail() {
    // The route always provides the id, the fallback only satisfies the type
    const { productId = '' } = useParams()

    // The router keeps this component mounted when only the id changes, the key gives each product fresh state
    return <ProductPage key={productId} productId={productId} />
}

type LoadState = { product: Product | null; loading: boolean; error: string | null }

function ProductPage({ productId }: { productId: string }) {
    const [state, setState] = useState<LoadState>({ product: null, loading: true, error: null })

    useEffect(() => {
        // Ignore the result if the page was left before the request finished
        let ignore = false
        fetchProduct(productId)
            .then((product) => {
                if (!ignore) setState({ product, loading: false, error: null })
            })
            .catch((error: Error) => {
                if (!ignore) setState({ product: null, loading: false, error: error.message })
            })
        return () => {
            ignore = true
        }
    }, [productId])

    if (state.loading) return <p className="empty">Hämtar produkten…</p>
    if (state.error || !state.product) {
        return (
            <div className="dashboard">
                <p className="empty" role="alert">Kunde inte hämta produkten. {state.error}</p>
                <Link to="/service" className="see-all">← All service</Link>
            </div>
        )
    }

    return (
        <div className="dashboard">
            <ProductHeader
                product={state.product}
                onSaved={(product) => setState({ product, loading: false, error: null })}
            />
        </div>
    )
}

type ProductHeaderProps = {
    product: Product
    onSaved: (product: Product) => void
}

function ProductHeader({ product, onSaved }: ProductHeaderProps) {
    const navigate = useNavigate()
    const [editing, setEditing] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleDelete() {
        if (!window.confirm(`Ta bort "${product.name}"? Servicehistorik och bilder tas också bort.`)) return

        setDeleting(true)
        setError(null)
        try {
            await deleteProduct(product.id)
            navigate('/service')
        } catch (deleteError) {
            setError(deleteError instanceof Error ? deleteError.message : 'Kunde inte ta bort produkten')
            setDeleting(false)
        }
    }

    if (editing) {
        return (
            <ProductForm
                product={product}
                onSaved={(saved) => {
                    onSaved(saved)
                    setEditing(false)
                }}
                onCancel={() => setEditing(false)}
            />
        )
    }

    // Only facts that are filled in are shown
    const facts: [string, string][] = [
        ['Tillverkare', product.manufacturer],
        ['Modell', product.model],
        ['Serienummer', product.serialNumber],
        ['Placering', product.location],
        ['Inköpt', product.purchaseDate ? formatDate(product.purchaseDate) : ''],
        ['Garanti till', product.warrantyUntil ? formatDate(product.warrantyUntil) : ''],
        ['Service', formatServiceInterval(product.serviceIntervalMonths)],
        ['Senaste service', product.lastServiceDate ? formatDate(product.lastServiceDate) : ''],
    ]

    return (
        <header className="dashboard-hero">
            <Link to="/service" className="see-all">← All service</Link>
            <h1>{product.name}</h1>
            {product.description && <p className="lead project-detail-description">{product.description}</p>}

            <dl className="project-facts">
                {product.nextServiceDate && (
                    <div>
                        <dt>Nästa service</dt>
                        <dd>
                            {formatDate(product.nextServiceDate)}{' '}
                            <ServiceStatusBadge nextServiceDate={product.nextServiceDate} />
                        </dd>
                    </div>
                )}
                {facts
                    .filter(([, value]) => value)
                    .map(([label, value]) => (
                        <div key={label}>
                            <dt>{label}</dt>
                            <dd>{value}</dd>
                        </div>
                    ))}
            </dl>

            {error && <p className="form-error" role="alert">{error}</p>}

            <div className="project-actions">
                <button type="button" className="button" disabled={deleting} onClick={() => setEditing(true)}>
                    Redigera
                </button>
                <button type="button" className="button button-danger" disabled={deleting} onClick={handleDelete}>
                    {deleting ? 'Tar bort…' : 'Ta bort produkt'}
                </button>
            </div>
        </header>
    )
}

export default ProductDetail
