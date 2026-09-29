alter table projects
  add column description text not null default '',
  add column start_date date,
  add column end_date date,
  add column budget integer check (budget >= 0),
  add column updated_at timestamptz not null default now(),
  add constraint projects_dates_check check (end_date is null or start_date is null or end_date >= start_date);

-- Keeps updated_at current on every update, so application code can't forget it
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace trigger projects_set_updated_at
  before update on projects
  for each row execute function set_updated_at();
