import { sql } from "../db";

export type Product = {
  id: string;
  name: string;
  description: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  /** Where in the house, e.g. "Pannrummet" */
  location: string;
  /** "YYYY-MM-DD", or null when not set */
  purchaseDate: string | null;
  /** "YYYY-MM-DD", or null when not set */
  warrantyUntil: string | null;
  /** Null when the product has no regular service */
  serviceIntervalMonths: number | null;
  createdAt: Date;
  updatedAt: Date;
  /** The date of the newest service, or null when none is documented */
  lastServiceDate: string | null;
  /**
   * When the next regular service is due: the last service (or the purchase, or when the
   * product was added) plus the interval. Null when there is no interval.
   */
  nextServiceDate: string | null;
  serviceCount: number;
};

/** The fields a client provides when adding a product. The rest is set or computed by the database. */
export type NewProduct = Omit<
  Product,
  "id" | "createdAt" | "updatedAt" | "lastServiceDate" | "nextServiceDate" | "serviceCount"
>;

const productColumns = sql`
  p.id, p.name, p.description, p.manufacturer, p.model, p.serial_number, p.location,
  p.purchase_date, p.warranty_until, p.service_interval_months, p.created_at, p.updated_at,
  history.last_service_date, history.service_count,
  case
    when p.service_interval_months is null then null
    else (
      coalesce(history.last_service_date, p.purchase_date, p.created_at::date)
      + make_interval(months => p.service_interval_months)
    )::date
  end as next_service_date
`;

// Each product with a summary of its services. count(*) is a bigint, so it is cast like elsewhere.
const productsWithHistory = sql`
  products p
  left join lateral (
    select max(performed_on) as last_service_date, count(*)::int as service_count
    from services
    where product_id = p.id
  ) history on true
`;

/** Returns all products, the one that needs service soonest first. Products without an interval come last. */
export async function listProducts(): Promise<Product[]> {
  return sql<Product[]>`
    select ${productColumns}
    from ${productsWithHistory}
    order by next_service_date nulls last, p.name
  `;
}

/** Returns one product, or undefined when it does not exist. */
export async function getProduct(productId: string): Promise<Product | undefined> {
  const [product] = await sql<Product[]>`
    select ${productColumns}
    from ${productsWithHistory}
    where p.id = ${productId}
  `;
  return product;
}

/** Saves a new product and returns it with its computed fields. */
export async function createProduct(newProduct: NewProduct): Promise<Product> {
  const [{ id }] = await sql<{ id: string }[]>`
    insert into products ${sql(
      newProduct,
      "name",
      "description",
      "manufacturer",
      "model",
      "serialNumber",
      "location",
      "purchaseDate",
      "warrantyUntil",
      "serviceIntervalMonths",
    )}
    returning id
  `;
  // Read it back, since the computed fields need the join with the services
  const product = await getProduct(id);
  if (!product) throw new Error("The new product could not be read back");
  return product;
}

/** Replaces the editable fields of a product. Returns undefined when it does not exist. */
export async function updateProduct(productId: string, changes: NewProduct): Promise<Product | undefined> {
  const updated = await sql`
    update products
    set ${sql(
      changes,
      "name",
      "description",
      "manufacturer",
      "model",
      "serialNumber",
      "location",
      "purchaseDate",
      "warrantyUntil",
      "serviceIntervalMonths",
    )}
    where id = ${productId}
    returning id
  `;
  if (updated.length === 0) return undefined;
  return getProduct(productId);
}

/**
 * Deletes a product. Its services, images and reminders go with it (on delete cascade).
 * Returns the image file names so the caller can remove the files,
 * or undefined when the product does not exist.
 */
export async function deleteProduct(productId: string): Promise<string[] | undefined> {
  return sql.begin(async (transaction) => {
    // Lock the product and its services first: uploads wait until we're done, so no new image can be missed
    const locked = await transaction`select id from products where id = ${productId} for update`;
    if (locked.length === 0) return undefined;
    await transaction`select id from services where product_id = ${productId} for update`;

    const images = await transaction<{ fileName: string }[]>`
      select i.file_name
      from service_images i
      join services s on s.id = i.service_id
      where s.product_id = ${productId}
    `;
    await transaction`delete from products where id = ${productId}`;

    return images.map((image) => image.fileName);
  });
}
