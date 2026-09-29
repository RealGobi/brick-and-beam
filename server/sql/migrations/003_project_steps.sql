create table project_steps (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  description text not null default '',
  status text not null default 'ongoing' check (status in ('ongoing', 'done')),
  date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index project_steps_project_id_idx on project_steps (project_id);

create trigger project_steps_set_updated_at
  before update on project_steps
  for each row execute function set_updated_at();

-- The image files live in the uploads folder, this table only points to them
create table step_images (
  id uuid primary key default gen_random_uuid(),
  step_id uuid not null references project_steps (id) on delete cascade,
  file_name text not null unique,
  original_name text not null,
  content_type text not null,
  size_bytes integer not null check (size_bytes > 0),
  created_at timestamptz not null default now()
);

create index step_images_step_id_idx on step_images (step_id);
