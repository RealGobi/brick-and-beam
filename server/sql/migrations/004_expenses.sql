create table expenses (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  -- Optional link to a step. Deleting the step keeps the expense, since the money is still spent.
  step_id uuid references project_steps (id) on delete set null,
  description text not null check (length(trim(description)) > 0),
  -- Whole kronor, like the project budget
  amount integer not null check (amount > 0),
  date date,
  created_at timestamptz not null default now()
);

create index expenses_project_id_idx on expenses (project_id);
create index expenses_step_id_idx on expenses (step_id);
