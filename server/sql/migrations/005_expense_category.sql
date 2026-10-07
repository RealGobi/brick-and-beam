-- What kind of cost it is, and where it was bought or which company did the work.
-- Existing expenses become "other" with no supplier.
alter table expenses
  add column category text not null default 'other'
    check (category in ('purchase', 'carpenter', 'electrician', 'plumber', 'painter', 'other')),
  add column supplier text not null default '';
