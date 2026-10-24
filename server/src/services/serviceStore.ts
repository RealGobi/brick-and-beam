import { sql } from "../db";
import { imageUrl, type NewStepImage, type StepImage } from "../steps/stepStore";

/** A service that has been done on a product, with its images. */
export type ServiceEntry = {
  id: string;
  productId: string;
  name: string;
  description: string;
  /** "YYYY-MM-DD" */
  performedOn: string;
  /** The company or person who did it. Empty when not given. */
  performedBy: string;
  /** Whole kronor, or null when not given */
  cost: number | null;
  createdAt: Date;
  updatedAt: Date;
  images: StepImage[];
};

/** The fields a client provides when documenting a service. */
export type NewServiceEntry = Pick<ServiceEntry, "name" | "description" | "performedOn" | "performedBy" | "cost">;

type ImageRow = { id: string; serviceId: string; fileName: string; originalName: string; createdAt: Date };

const toImage = (row: ImageRow): StepImage => ({
  id: row.id,
  url: imageUrl(row.fileName),
  originalName: row.originalName,
  createdAt: row.createdAt,
});

const serviceColumns = sql`
  id, product_id, name, description, performed_on, performed_by, cost, created_at, updated_at
`;

/** Adds each service's images, oldest first. */
async function withImages(services: Omit<ServiceEntry, "images">[]): Promise<ServiceEntry[]> {
  if (services.length === 0) return [];

  const images = await sql<ImageRow[]>`
    select id, service_id, file_name, original_name, created_at
    from service_images
    where service_id in ${sql(services.map((service) => service.id))}
    order by created_at
  `;

  return services.map((service) => ({
    ...service,
    images: images.filter((image) => image.serviceId === service.id).map(toImage),
  }));
}

/** Returns the services of a product, newest first. */
export async function listServices(productId: string): Promise<ServiceEntry[]> {
  const services = await sql<Omit<ServiceEntry, "images">[]>`
    select ${serviceColumns}
    from services
    where product_id = ${productId}
    order by performed_on desc, created_at desc
  `;
  return withImages(services);
}

/** Returns one service with its images, or undefined when it does not exist. */
export async function getService(serviceId: string): Promise<ServiceEntry | undefined> {
  const services = await sql<Omit<ServiceEntry, "images">[]>`
    select ${serviceColumns} from services where id = ${serviceId}
  `;
  const [service] = await withImages(services);
  return service;
}

/** Saves a new service for a product and returns it, without images. */
export async function createService(productId: string, entry: NewServiceEntry): Promise<ServiceEntry> {
  const [service] = await sql<Omit<ServiceEntry, "images">[]>`
    insert into services ${sql({ productId, ...entry }, "productId", "name", "description", "performedOn", "performedBy", "cost")}
    returning ${serviceColumns}
  `;
  return { ...service, images: [] };
}

/** Replaces the editable fields of a service and returns it with its images. */
export async function updateService(serviceId: string, changes: NewServiceEntry): Promise<ServiceEntry | undefined> {
  const services = await sql<Omit<ServiceEntry, "images">[]>`
    update services
    set ${sql(changes, "name", "description", "performedOn", "performedBy", "cost")}
    where id = ${serviceId}
    returning ${serviceColumns}
  `;
  const [service] = await withImages(services);
  return service;
}

/**
 * Deletes a service and its image rows. Returns the image file names so the caller can
 * remove the files, or undefined when the service does not exist.
 */
export async function deleteService(serviceId: string): Promise<string[] | undefined> {
  return sql.begin(async (transaction) => {
    // Lock the service first: uploads to it wait until we're done, so no new image can be missed
    const locked = await transaction`select id from services where id = ${serviceId} for update`;
    if (locked.length === 0) return undefined;

    const images = await transaction<{ fileName: string }[]>`
      select file_name from service_images where service_id = ${serviceId}
    `;
    await transaction`delete from services where id = ${serviceId}`;

    return images.map((image) => image.fileName);
  });
}

/** True when a service with this id exists. */
export async function serviceExists(serviceId: string): Promise<boolean> {
  const rows = await sql`select 1 from services where id = ${serviceId}`;
  return rows.length > 0;
}

/** Links saved image files to a service and returns them. */
export async function addServiceImages(serviceId: string, images: NewStepImage[]): Promise<StepImage[]> {
  const rows = images.map((image) => ({ serviceId, ...image }));
  const saved = await sql<ImageRow[]>`
    insert into service_images ${sql(rows, "serviceId", "fileName", "originalName", "contentType", "sizeBytes")}
    returning id, service_id, file_name, original_name, created_at
  `;
  return saved.map(toImage);
}

/** Deletes one image row. Returns its file name, or undefined when it does not exist. */
export async function deleteServiceImage(imageId: string): Promise<string | undefined> {
  const [image] = await sql<{ fileName: string }[]>`
    delete from service_images where id = ${imageId} returning file_name
  `;
  return image?.fileName;
}
