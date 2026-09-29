import { sql } from "../db";

export type ProjectStatus = "planned" | "ongoing" | "done";

export type Project = {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  /** "YYYY-MM-DD", or null when not set */
  startDate: string | null;
  /** "YYYY-MM-DD", or null when not set */
  endDate: string | null;
  /** Whole kronor, or null when not set */
  budget: number | null;
  createdAt: Date;
  updatedAt: Date;
};

/** The fields a client provides when creating a project. The rest is set by the database. */
export type NewProject = Omit<Project, "id" | "createdAt" | "updatedAt">;

const projectColumns = sql`
  id, name, description, status, start_date, end_date, budget, created_at, updated_at
`;

/** Returns all projects, newest first. */
export async function listProjects(): Promise<Project[]> {
  return sql<Project[]>`
    select ${projectColumns}
    from projects
    order by created_at desc
  `;
}

/** Saves a new project and returns it as stored. */
export async function createProject(newProject: NewProject): Promise<Project> {
  const [project] = await sql<Project[]>`
    insert into projects (name, description, status, start_date, end_date, budget)
    values (
      ${newProject.name},
      ${newProject.description},
      ${newProject.status},
      ${newProject.startDate},
      ${newProject.endDate},
      ${newProject.budget}
    )
    returning ${projectColumns}
  `;
  return project;
}

/** True when a project with this id exists. */
export async function projectExists(projectId: string): Promise<boolean> {
  const rows = await sql`select 1 from projects where id = ${projectId}`;
  return rows.length > 0;
}

/** Returns one project, or undefined when it does not exist. */
export async function getProject(projectId: string): Promise<Project | undefined> {
  const [project] = await sql<Project[]>`
    select ${projectColumns}
    from projects
    where id = ${projectId}
  `;
  return project;
}

/** Replaces the editable fields of a project. Returns undefined when it does not exist. */
export async function updateProject(projectId: string, changes: NewProject): Promise<Project | undefined> {
  const [project] = await sql<Project[]>`
    update projects
    set
      name = ${changes.name},
      description = ${changes.description},
      status = ${changes.status},
      start_date = ${changes.startDate},
      end_date = ${changes.endDate},
      budget = ${changes.budget}
    where id = ${projectId}
    returning ${projectColumns}
  `;
  return project;
}

/**
 * Deletes a project. Its steps and image rows go with it (on delete cascade).
 * Returns the image file names so the caller can remove the files,
 * or undefined when the project does not exist.
 */
export async function deleteProject(projectId: string): Promise<string[] | undefined> {
  return sql.begin(async (transaction) => {
    // Lock the project and its steps first: new steps and uploads wait until we're done,
    // so no new image can be missed
    const locked = await transaction`select id from projects where id = ${projectId} for update`;
    if (locked.length === 0) return undefined;
    await transaction`select id from project_steps where project_id = ${projectId} for update`;

    const images = await transaction<{ fileName: string }[]>`
      select i.file_name
      from step_images i
      join project_steps s on s.id = i.step_id
      where s.project_id = ${projectId}
    `;
    await transaction`delete from projects where id = ${projectId}`;

    return images.map((image) => image.fileName);
  });
}
