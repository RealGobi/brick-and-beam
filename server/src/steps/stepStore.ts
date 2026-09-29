import { sql } from "../db";

export type StepStatus = "ongoing" | "done";

export type StepImage = {
  id: string;
  /** Path the browser can load the image from */
  url: string;
  originalName: string;
  createdAt: Date;
};

export type Step = {
  id: string;
  projectId: string;
  name: string;
  description: string;
  status: StepStatus;
  /** "YYYY-MM-DD", or null when not set */
  date: string | null;
  createdAt: Date;
  updatedAt: Date;
  images: StepImage[];
};

/** The fields a client provides when creating a step. */
export type NewStep = Pick<Step, "name" | "description" | "status" | "date">;

/** An uploaded file that has been saved to disk and should be linked to a step. */
export type NewStepImage = {
  fileName: string;
  originalName: string;
  contentType: string;
  sizeBytes: number;
};

type ImageRow = { id: string; stepId: string; fileName: string; originalName: string; createdAt: Date };

export const imageUrl = (fileName: string) => `/api/uploads/${fileName}`;

const toStepImage = (row: ImageRow): StepImage => ({
  id: row.id,
  url: imageUrl(row.fileName),
  originalName: row.originalName,
  createdAt: row.createdAt,
});

const stepColumns = sql`
  id, project_id, name, description, status, date, created_at, updated_at
`;

/** Returns the steps of a project with their images, in date order. Steps without a date come last. */
export async function listSteps(projectId: string): Promise<Step[]> {
  const steps = await sql<Omit<Step, "images">[]>`
    select ${stepColumns}
    from project_steps
    where project_id = ${projectId}
    order by date nulls last, created_at
  `;
  if (steps.length === 0) return [];

  const images = await sql<ImageRow[]>`
    select id, step_id, file_name, original_name, created_at
    from step_images
    where step_id in ${sql(steps.map((step) => step.id))}
    order by created_at
  `;

  return steps.map((step) => ({
    ...step,
    images: images.filter((image) => image.stepId === step.id).map(toStepImage),
  }));
}

/** Saves a new step for a project and returns it, without images. */
export async function createStep(projectId: string, newStep: NewStep): Promise<Step> {
  const [step] = await sql<Omit<Step, "images">[]>`
    insert into project_steps (project_id, name, description, status, date)
    values (${projectId}, ${newStep.name}, ${newStep.description}, ${newStep.status}, ${newStep.date})
    returning ${stepColumns}
  `;
  return { ...step, images: [] };
}

/** True when a step with this id exists. */
export async function stepExists(stepId: string): Promise<boolean> {
  const rows = await sql`select 1 from project_steps where id = ${stepId}`;
  return rows.length > 0;
}

/** Links saved image files to a step and returns them. */
export async function addStepImages(stepId: string, images: NewStepImage[]): Promise<StepImage[]> {
  const rows = images.map((image) => ({ stepId, ...image }));
  const saved = await sql<ImageRow[]>`
    insert into step_images ${sql(rows, "stepId", "fileName", "originalName", "contentType", "sizeBytes")}
    returning id, step_id, file_name, original_name, created_at
  `;
  return saved.map(toStepImage);
}
