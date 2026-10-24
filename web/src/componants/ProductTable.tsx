import { Link } from 'react-router'
import type { Product } from '../api/products'
import { formatDate } from '../utils/formatProject'
import { serviceStatus, serviceStatusLabels } from '../utils/formatProduct'
import './ProductTable.css'

/** The service status as a colored badge: red when overdue, gold when soon, green when fine. */
export function ServiceStatusBadge({ nextServiceDate }: { nextServiceDate: string | null }) {
    const status = serviceStatus(nextServiceDate)
    if (status === 'none') return <span className="product-table-muted">—</span>

    return <span className={`status-badge service-status-${status}`}>{serviceStatusLabels[status]}</span>
}

const dateOrDash = (date: string | null) => (date ? formatDate(date) : '—')

/** Products in a table. The name links to the product page, and the link covers the whole row. */
export function ProductTable({ products }: { products: Product[] }) {
    return (
        <table className="product-table">
            <thead>
                <tr>
                    <th scope="col">Namn</th>
                    <th scope="col" className="product-table-optional">Placering</th>
                    <th scope="col" className="product-table-optional">Senaste service</th>
                    <th scope="col">Nästa service</th>
                    <th scope="col">Status</th>
                </tr>
            </thead>
            <tbody>
                {products.map((product) => (
                    <tr key={product.id}>
                        <td>
                            <Link to={`/service/${product.id}`} className="product-table-link">
                                {product.name}
                            </Link>
                        </td>
                        <td className="product-table-optional">{product.location || '—'}</td>
                        <td className="product-table-optional">{dateOrDash(product.lastServiceDate)}</td>
                        <td>{dateOrDash(product.nextServiceDate)}</td>
                        <td>
                            <ServiceStatusBadge nextServiceDate={product.nextServiceDate} />
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}
