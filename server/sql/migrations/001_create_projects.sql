create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  status text not null default 'planned' check (status in ('planned', 'ongoing', 'done')),
  created_at timestamptz not null default now()
);
