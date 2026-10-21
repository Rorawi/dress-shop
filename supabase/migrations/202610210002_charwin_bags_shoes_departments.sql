alter table charwin_store.categories
  drop constraint if exists categories_department_check;

alter table charwin_store.categories
  add constraint categories_department_check
  check (department in ('clothing', 'underwear', 'bags', 'shoes'));

insert into charwin_store.categories (name, slug, department, sort_order, is_active)
values
  ('Bags', 'bags', 'bags', 2, true),
  ('Shoes', 'shoes', 'shoes', 3, true)
on conflict (slug) do update set
  name = excluded.name,
  department = excluded.department,
  sort_order = excluded.sort_order,
  is_active = true;
