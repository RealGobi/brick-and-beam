-- Things in the house that need service, with their service history and reminders

create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  description text not null default '',
  manufacturer text not null default '',
  model text not null default '',
  serial_number text not null default '',
  -- Where in the house, e.g. "Pannrummet"
  location text not null default '',
  purchase_date date,
  warranty_until date,
  -- Null means no regular service
  service_interval_months integer check (service_interval_months > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_warranty_check check (
    warranty_until is null or purchase_date is null or warranty_until >= purchase_date
  )
);

create trigger products_set_updated_at
  before update on products
  for each row execute function set_updated_at();

-- A service that has been done
create table services (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  description text not null default '',
  performed_on date not null,
  -- The company or person who did it
  performed_by text not null default '',
  -- Whole kronor
  cost integer check (cost >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index services_product_id_idx on services (product_id);

create trigger services_set_updated_at
  before update on services
  for each row execute function set_updated_at();

-- Same idea as step_images: the files live in the uploads folder
create table service_images (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references services (id) on delete cascade,
  file_name text not null unique,
  original_name text not null,
  content_type text not null,
  size_bytes integer not null check (size_bytes > 0),
  created_at timestamptz not null default now()
);

create index service_images_service_id_idx on service_images (service_id);

-- Reminders the user adds by hand. Regular service is computed from the product's interval instead.
create table reminders (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  due_date date not null,
  note text not null default '',
  -- Null while the reminder is still active
  done_at timestamptz,
  -- For the e-mail step that comes later
  email boolean not null default false,
  emailed_at timestamptz,
  created_at timestamptz not null default now()
);

create index reminders_product_id_idx on reminders (product_id);
