import { Hono } from "hono";
import { imageUploadLimit, uploadImages } from "../images/imageUpload";
import { deleteImageFiles } from "../images/imageStorage";
import { getProduct } from "../products/productStore";
import { isObject, isUuid } from "../validation";
import {
  addServiceImages,
  createService,
  deleteService,
  deleteServiceImage,
  getService,
  listServices,
  serviceExists,
  updateService,
} from "./serviceStore";
import { validateNewService } from "./validateNewService";

/** Routes for the service history of a product and its images, mounted under /api. */
export const serviceRoutes = new Hono();

const productNotFound = { error: "Produkten finns inte" };
const serviceNotFound = { error: "Servicen finns inte" };

// Checking the format first avoids a database error for ids like "abc"
async function isExistingProduct(productId: string): Promise<boolean> {
  return isUuid(productId) && (await getProduct(productId)) !== undefined;
}

serviceRoutes.get("/products/:productId/services", async (c) => {
  const productId = c.req.param("productId");
  if (!(await isExistingProduct(productId))) return c.json(productNotFound, 404);

  return c.json(await listServices(productId));
});

serviceRoutes.post("/products/:productId/services", async (c) => {
  const productId = c.req.param("productId");
  if (!(await isExistingProduct(productId))) return c.json(productNotFound, 404);

  // c.req.json() throws on malformed JSON, which is the client's fault, not a server error
  const body: unknown = await c.req.json().catch(() => undefined);
  const result = validateNewService(body);
  if (!result.ok) return c.json({ error: result.error }, 400);

  return c.json(await createService(productId, result.value), 201);
});

serviceRoutes.patch("/services/:serviceId", async (c) => {
  const serviceId = c.req.param("serviceId");
  const existing = isUuid(serviceId) ? await getService(serviceId) : undefined;
  if (!existing) return c.json(serviceNotFound, 404);

  const body: unknown = await c.req.json().catch(() => undefined);
  if (!isObject(body)) return c.json({ error: "Body måste vara ett JSON-objekt" }, 400);

  // Fields left out keep their current value, then everything is checked like a new service
  const { name, description, performedOn, performedBy, cost } = existing;
  const result = validateNewService({ name, description, performedOn, performedBy, cost, ...body });
  if (!result.ok) return c.json({ error: result.error }, 400);

  const service = await updateService(serviceId, result.value);
  if (!service) return c.json(serviceNotFound, 404);

  return c.json(service);
});

serviceRoutes.delete("/services/:serviceId", async (c) => {
  const serviceId = c.req.param("serviceId");
  const imageFiles = isUuid(serviceId) ? await deleteService(serviceId) : undefined;
  if (!imageFiles) return c.json(serviceNotFound, 404);

  await deleteImageFiles(imageFiles);
  return c.body(null, 204);
});

serviceRoutes.post("/services/:serviceId/images", imageUploadLimit, async (c) => {
  const serviceId = c.req.param("serviceId");
  if (!isUuid(serviceId) || !(await serviceExists(serviceId))) return c.json(serviceNotFound, 404);

  return uploadImages(c, (savedFiles) => addServiceImages(serviceId, savedFiles));
});

serviceRoutes.delete("/service-images/:imageId", async (c) => {
  const imageId = c.req.param("imageId");
  const fileName = isUuid(imageId) ? await deleteServiceImage(imageId) : undefined;
  if (!fileName) return c.json({ error: "Bilden finns inte" }, 404);

  await deleteImageFiles([fileName]);
  return c.body(null, 204);
});
