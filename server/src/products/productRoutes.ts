import { Hono } from "hono";
import { deleteImageFiles } from "../images/imageStorage";
import { isObject, isUuid } from "../validation";
import {
  createProduct,
  deleteProduct,
  getProduct,
  listProducts,
  updateProduct,
  type NewProduct,
  type Product,
} from "./productStore";
import { validateNewProduct } from "./validateNewProduct";

/** Routes for /api/products. */
export const productRoutes = new Hono();

const productNotFound = { error: "Produkten finns inte" };

// Checking the format first avoids a database error for ids like "abc"
async function findProduct(productId: string): Promise<Product | undefined> {
  return isUuid(productId) ? getProduct(productId) : undefined;
}

function editableFields(product: Product): NewProduct {
  const { name, description, manufacturer, model, serialNumber, location } = product;
  const { purchaseDate, warrantyUntil, serviceIntervalMonths } = product;
  return { name, description, manufacturer, model, serialNumber, location, purchaseDate, warrantyUntil, serviceIntervalMonths };
}

productRoutes.get("/", async (c) => c.json(await listProducts()));

productRoutes.get("/:productId", async (c) => {
  const product = await findProduct(c.req.param("productId"));
  if (!product) return c.json(productNotFound, 404);

  return c.json(product);
});

productRoutes.post("/", async (c) => {
  // c.req.json() throws on malformed JSON, which is the client's fault, not a server error
  const body: unknown = await c.req.json().catch(() => undefined);
  const result = validateNewProduct(body);
  if (!result.ok) return c.json({ error: result.error }, 400);

  return c.json(await createProduct(result.value), 201);
});

productRoutes.patch("/:productId", async (c) => {
  const existing = await findProduct(c.req.param("productId"));
  if (!existing) return c.json(productNotFound, 404);

  const body: unknown = await c.req.json().catch(() => undefined);
  if (!isObject(body)) return c.json({ error: "Body måste vara ett JSON-objekt" }, 400);

  // Fields left out keep their current value, then everything is checked like a new product
  const result = validateNewProduct({ ...editableFields(existing), ...body });
  if (!result.ok) return c.json({ error: result.error }, 400);

  const product = await updateProduct(existing.id, result.value);
  if (!product) return c.json(productNotFound, 404);

  return c.json(product);
});

productRoutes.delete("/:productId", async (c) => {
  const productId = c.req.param("productId");
  const imageFiles = isUuid(productId) ? await deleteProduct(productId) : undefined;
  if (!imageFiles) return c.json(productNotFound, 404);

  await deleteImageFiles(imageFiles);
  return c.body(null, 204);
});
