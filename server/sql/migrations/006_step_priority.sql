-- How important a step is. Shown as the size of its dot in the timeline.
-- Existing steps become "normal".
alter table project_steps
  add column priority text not null default 'normal'
    check (priority in ('milestone', 'normal', 'small'));
