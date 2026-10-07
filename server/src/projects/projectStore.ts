import { sql } from "../db";
import { imageUrl } from "../steps/stepStore";

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
  /** The newest image from any of the project's steps, or null when there are no images */
  coverImageUrl: string | null;
  stepCount: number;
  doneStepCount: number;
};

/** The fields a client provides when creating a project. The rest is set by the database. */
export type NewProject = Omit<
  Project,
  "id" | "createdAt" | "updatedAt" | "coverImageUrl" | "stepCount" | "doneStepCount"
>;

type ProjectRow = Omit<Project, "coverImageUrl"> & { coverFileName: string | null };

const projectColumns = sql`
  id, name, description, status, start_date, end_date, budget, created_at, updated_at,
  (
    select i.file_name
    from step_images i
    join project_steps s on s.id = i.step_id
    where s.project_id = projects.id
    order by i.created_at desc
    limit 1
  ) as cover_file_name,
  -- count(*) is a bigint, which postgres.js returns as a string, so cast to int
  (select count(*)::int from project_steps s where s.project_id = projects.id) as step_count,
  (
    select count(*)::int from project_steps s
    where s.project_id = projects.id and s.status = 'done'
  ) as done_step_count
`;

function toProject({ coverFileName, ...project }: ProjectRow): Project {
  return { ...project, coverImageUrl: coverFileName ? imageUrl(coverFileName) : null };
}

/** Returns all projects, newest first. */
export async function listProjects(): Promise<Project[]> {
  const rows = await sql<ProjectRow[]>`
    select ${projectColumns}
    from projects
    order by created_at desc
  `;
  return rows.map(toProject);
}

/** Saves a new project and returns it as stored. */
export async function createProject(newProject: NewProject): Promise<Project> {
  const [row] = await sql<ProjectRow[]>`
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
  return toProject(row);
}

/** True when a project with this id exists. */
export async function projectExists(projectId: string): Promise<boolean> {
  const rows = await sql`select 1 from projects where id = ${projectId}`;
  return rows.length > 0;
}

/** Returns one project, or undefined when it does not exist. */
export async function getProject(projectId: string): Promise<Project | undefined> {
  const [row] = await sql<ProjectRow[]>`
    select ${projectColumns}
    from projects
    where id = ${projectId}
  `;
  return row && toProject(row);
}

/** Replaces the editable fields of a project. Returns undefined when it does not exist. */
export async function updateProject(projectId: string, changes: NewProject): Promise<Project | undefined> {
  const [row] = await sql<ProjectRow[]>`
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
  return row && toProject(row);
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
