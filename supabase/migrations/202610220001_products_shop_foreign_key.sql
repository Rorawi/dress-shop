-- Repair deployments where products.shop_id was missing or predated the
-- marketplace migration. Existing single-shop catalog rows belong to the
-- legacy Charwin shop; preserve any shop assignments that are already set.
insert into charwin_store.shops (
  name, slug, bio, location, verification_status, status,
  subscription_status, active_until
)
select
  'Charwin Stores', 'charwin-stores', 'The original Charwin Stores catalog.',
  'Ghana', 'approved', 'active', 'active', now() + interval '5 years'
where exists (select 1 from charwin_store.products)
on conflict (slug) do nothing;

alter table charwin_store.products
  add column if not exists shop_id uuid;

update charwin_store.products p
set shop_id = s.id
from charwin_store.shops s
where p.shop_id is null
  and s.slug = 'charwin-stores';

alter table charwin_store.products
  alter column shop_id set not null;

-- PostgREST also needs the FK to expose products-to-shops relationships.
do $$
begin
  if not exists (
    select 1
    from pg_constraint fk
    join pg_attribute source_column
      on source_column.attrelid = fk.conrelid
     and source_column.attnum = fk.conkey[1]
    where fk.contype = 'f'
      and fk.conrelid = 'charwin_store.products'::regclass
      and fk.confrelid = 'charwin_store.shops'::regclass
      and cardinality(fk.conkey) = 1
      and source_column.attname = 'shop_id'
  ) then
    alter table charwin_store.products
      add constraint products_shop_id_fkey
      foreign key (shop_id)
      references charwin_store.shops(id)
      on delete restrict;
  end if;
end
$$;

notify pgrst, 'reload schema';
