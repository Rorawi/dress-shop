-- Multi-vendor marketplace foundation for Charwin Stores.
-- The earlier catalog migration is retained for existing deployments; this
-- migration extends those tables without discarding their current records.

create table if not exists charwin_store.shops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  bio text not null default '',
  location text not null default '',
  phone text,
  whatsapp_number text check (whatsapp_number is null or whatsapp_number ~ '^[0-9]+$'),
  logo_url text,
  banner_url text,
  instagram_url text,
  snapchat_url text,
  tiktok_url text,
  facebook_url text,
  website_url text,
  momo_number text,
  momo_network text check (momo_network is null or momo_network in ('MTN', 'Telecel', 'AirtelTigo')),
  momo_account_name text,
  accepts_cash_on_delivery boolean not null default true,
  owner_name text,
  owner_phone text,
  verification_document_path text,
  verification_social_url text,
  verification_status text not null default 'pending'
    check (verification_status in ('pending', 'approved', 'rejected')),
  status text not null default 'pending'
    check (status in ('pending', 'active', 'suspended', 'banned')),
  is_featured boolean not null default false,
  is_trusted boolean not null default false,
  subscription_status text not null default 'trial'
    check (subscription_status in ('trial', 'active', 'expired')),
  trial_ends_at timestamptz,
  active_until timestamptz,
  strike_count integer not null default 0 check (strike_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists charwin_store.shop_members (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references charwin_store.shops(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'manager', 'staff')),
  created_at timestamptz not null default now(),
  unique (shop_id, user_id)
);

-- Existing single-shop catalog rows are preserved and assigned to a legacy
-- Charwin shop. Fresh databases skip this shop and are seeded with three demos.
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
  add column if not exists shop_id uuid references charwin_store.shops(id) on delete restrict;

update charwin_store.products p
set shop_id = s.id
from charwin_store.shops s
where p.shop_id is null and s.slug = 'charwin-stores';

-- A product without a shop cannot be safely exposed or ordered. Existing
-- catalog rows are backfilled above; the seed assigns shop_id to new products.
alter table charwin_store.products alter column shop_id set not null;

alter table charwin_store.products
  add column if not exists moderation_status text not null default 'pending'
    check (moderation_status in ('pending', 'approved', 'rejected')),
  add column if not exists moderation_verdict text
    check (moderation_verdict is null or moderation_verdict in ('looks_fine', 'needs_review', 'likely_prohibited')),
  add column if not exists moderation_reason text,
  add column if not exists rejection_reason text,
  add column if not exists admin_hidden boolean not null default false,
  add column if not exists admin_hidden_reason text,
  add column if not exists admin_hidden_at timestamptz,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references auth.users(id) on delete set null;

-- Keep previously published single-shop items visible after the migration.
update charwin_store.products
set moderation_status = case when is_published and not is_hidden then 'approved' else 'pending' end
where moderation_status = 'pending' and is_published and not is_hidden;

alter table charwin_store.site_settings
  add column if not exists auto_approval_mode text not null default 'suggestions_only'
    check (auto_approval_mode in ('suggestions_only', 'trusted_shops_low_risk')),
  add column if not exists prohibited_items text[] not null default array[
    'Counterfeit goods sold as genuine brands',
    'Weapons',
    'Illegal drugs',
    'Stolen goods',
    'Adult explicit content',
    'Hazardous items',
    'Anything illegal in Ghana'
  ]::text[],
  add column if not exists subscription_grace_days integer not null default 7
    check (subscription_grace_days between 0 and 90),
  add column if not exists expiry_notice_days integer[] not null default array[14, 7, 1]::integer[];

insert into charwin_store.site_settings (id, shop_name, currency)
values (true, 'Charwin Stores', 'GHS')
on conflict (id) do nothing;

create table if not exists charwin_store.orders (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references charwin_store.shops(id) on delete restrict,
  order_number bigint generated by default as identity,
  customer_name text,
  customer_phone text,
  delivery_location text,
  payment_preference text not null check (payment_preference in ('mobile_money', 'cash_on_delivery', 'discuss_in_chat')),
  status text not null default 'new'
    check (status in ('new', 'confirmed', 'paid', 'delivered', 'cancelled')),
  currency char(3) not null default 'GHS',
  total numeric(10, 2) not null default 0 check (total >= 0),
  seller_notes text,
  idempotency_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shop_id, idempotency_key)
);

create table if not exists charwin_store.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references charwin_store.orders(id) on delete cascade,
  shop_id uuid not null references charwin_store.shops(id) on delete restrict,
  product_id uuid references charwin_store.products(id) on delete set null,
  variant_id uuid references charwin_store.product_variants(id) on delete set null,
  product_name text not null,
  product_url text,
  size text,
  color text,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  line_total numeric(10, 2) not null check (line_total >= 0),
  created_at timestamptz not null default now()
);

create table if not exists charwin_store.reports (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references charwin_store.shops(id) on delete cascade,
  product_id uuid references charwin_store.products(id) on delete set null,
  subject_type text not null check (subject_type in ('shop', 'product')),
  reason text not null,
  message text,
  reporter_name text,
  reporter_contact text,
  status text not null default 'new' check (status in ('new', 'reviewed', 'actioned', 'dismissed')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  check ((subject_type = 'shop' and product_id is null) or (subject_type = 'product' and product_id is not null))
);

create table if not exists charwin_store.strikes (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references charwin_store.shops(id) on delete cascade,
  product_id uuid references charwin_store.products(id) on delete set null,
  action text not null check (action in ('warning', 'suspension', 'ban')),
  reason text not null,
  note text,
  issued_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists charwin_store.moderation_log (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references charwin_store.shops(id) on delete cascade,
  product_id uuid references charwin_store.products(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  reason text,
  note text,
  previous_values jsonb,
  new_values jsonb,
  created_at timestamptz not null default now()
);

create index if not exists shops_public_status_idx
  on charwin_store.shops(status, verification_status, subscription_status);
create index if not exists shop_members_user_idx on charwin_store.shop_members(user_id, shop_id);
create index if not exists products_shop_created_idx on charwin_store.products(shop_id, created_at desc);
create index if not exists products_shop_status_idx on charwin_store.products(shop_id, moderation_status, is_hidden);
create index if not exists orders_shop_created_idx on charwin_store.orders(shop_id, created_at desc);
create index if not exists order_items_order_idx on charwin_store.order_items(order_id);
create index if not exists reports_status_created_idx on charwin_store.reports(status, created_at desc);
create index if not exists strikes_shop_created_idx on charwin_store.strikes(shop_id, created_at desc);
create index if not exists moderation_log_shop_created_idx on charwin_store.moderation_log(shop_id, created_at desc);

create or replace function charwin_store.set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists shops_set_updated_at on charwin_store.shops;
create trigger shops_set_updated_at before update on charwin_store.shops
  for each row execute function charwin_store.set_updated_at();
drop trigger if exists orders_set_updated_at on charwin_store.orders;
create trigger orders_set_updated_at before update on charwin_store.orders
  for each row execute function charwin_store.set_updated_at();

create or replace function charwin_store.is_shop_admin()
returns boolean
language sql
stable
set search_path = pg_catalog
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role' = 'admin', false);
$$;

create or replace function charwin_store.is_shop_member(
  target_shop_id uuid,
  allowed_roles text[] default null
)
returns boolean
language sql
stable
security definer
set search_path = charwin_store, pg_temp
as $$
  select auth.uid() is not null and exists (
    select 1
    from charwin_store.shop_members sm
    where sm.shop_id = target_shop_id
      and sm.user_id = auth.uid()
      and (allowed_roles is null or sm.role = any(allowed_roles))
  );
$$;

create or replace function charwin_store.is_shop_public(target_shop_id uuid)
returns boolean
language sql
stable
security definer
set search_path = charwin_store, pg_temp
as $$
  select exists (
    select 1
    from charwin_store.shops shop
    cross join lateral (
      select coalesce(max(settings.subscription_grace_days), 0) as grace_days
      from charwin_store.site_settings settings
    ) config
    where shop.id = target_shop_id
      and shop.status = 'active'
      and shop.verification_status = 'approved'
      and case shop.subscription_status
        when 'trial' then shop.trial_ends_at
        else shop.active_until
      end is not null
      and case shop.subscription_status
        when 'trial' then shop.trial_ends_at
        else shop.active_until
      end + make_interval(days => config.grace_days) > now()
  );
$$;

create or replace function charwin_store.can_manage_product_image_object(object_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = charwin_store, pg_temp
as $$
declare
  path_shop_id uuid;
  path_product_id uuid;
begin
  if charwin_store.is_shop_admin() then
    return true;
  end if;

  if split_part(object_name, '/', 1) !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
     or split_part(object_name, '/', 2) !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return false;
  end if;

  path_shop_id := split_part(object_name, '/', 1)::uuid;
  path_product_id := split_part(object_name, '/', 2)::uuid;

  return charwin_store.is_shop_member(path_shop_id)
    and exists (
      select 1 from charwin_store.products product
      where product.id = path_product_id and product.shop_id = path_shop_id
    );
end;
$$;

create or replace function charwin_store.is_product_public(target_product_id uuid)
returns boolean
language sql
stable
security definer
set search_path = charwin_store, pg_temp
as $$
  select exists (
    select 1
    from charwin_store.products product
    where product.id = target_product_id
      and product.moderation_status = 'approved'
      and product.is_published
      and not product.is_hidden
      and not product.admin_hidden
      and charwin_store.is_shop_public(product.shop_id)
  );
$$;

grant execute on function charwin_store.is_shop_admin() to anon, authenticated;
grant execute on function charwin_store.is_shop_member(uuid, text[]) to authenticated;
grant execute on function charwin_store.is_shop_public(uuid) to anon, authenticated;
grant execute on function charwin_store.is_product_public(uuid) to anon, authenticated;
grant execute on function charwin_store.can_manage_product_image_object(text) to authenticated;

-- Sellers cannot grant themselves approval or move listings between shops.
-- Changes to listing content or images return an approved listing to review.
create or replace function charwin_store.guard_product_moderation()
returns trigger
language plpgsql
security definer
set search_path = charwin_store, pg_temp
as $$
begin
  if auth.uid() is null
     or charwin_store.is_shop_admin()
     or current_setting('charwin_store.internal_moderation_write', true) = 'on' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.moderation_status := 'pending';
    new.is_published := false;
    new.reviewed_at := null;
    new.reviewed_by := null;
    new.rejection_reason := null;
    new.admin_hidden := false;
    new.admin_hidden_reason := null;
    new.admin_hidden_at := null;
    return new;
  end if;

  if new.shop_id is distinct from old.shop_id then
    raise exception 'A product cannot be moved to another shop';
  end if;

  new.moderation_status := old.moderation_status;
  new.is_published := old.is_published;
  new.moderation_verdict := old.moderation_verdict;
  new.moderation_reason := old.moderation_reason;
  new.rejection_reason := old.rejection_reason;
  new.reviewed_at := old.reviewed_at;
  new.reviewed_by := old.reviewed_by;
  new.admin_hidden := old.admin_hidden;
  new.admin_hidden_reason := old.admin_hidden_reason;
  new.admin_hidden_at := old.admin_hidden_at;
  new.is_featured := old.is_featured;

  if new.name is distinct from old.name
     or new.description is distinct from old.description
     or new.brand_id is distinct from old.brand_id
     or new.category_id is distinct from old.category_id
     or new.subcategory_id is distinct from old.subcategory_id
     or new.gender is distinct from old.gender
     or new.sleeve_length is distinct from old.sleeve_length
     or new.style is distinct from old.style
     or new.discreet_image is distinct from old.discreet_image then
    new.moderation_status := 'pending';
    new.is_published := false;
    new.reviewed_at := null;
    new.reviewed_by := null;
    new.rejection_reason := null;
  end if;

  return new;
end;
$$;

drop trigger if exists products_guard_moderation on charwin_store.products;
create trigger products_guard_moderation before insert or update on charwin_store.products
  for each row execute function charwin_store.guard_product_moderation();

create or replace function charwin_store.mark_product_pending_after_image_change()
returns trigger
language plpgsql
security definer
set search_path = charwin_store, pg_temp
as $$
declare
  affected_product_id uuid;
begin
  if auth.uid() is null or charwin_store.is_shop_admin() then
    return coalesce(new, old);
  end if;

  if tg_op in ('UPDATE', 'DELETE') then
    affected_product_id := old.product_id;
    perform set_config('charwin_store.internal_moderation_write', 'on', true);
    update charwin_store.products
      set moderation_status = 'pending', is_published = false,
          reviewed_at = null, reviewed_by = null, rejection_reason = null
      where id = affected_product_id and moderation_status = 'approved';
  end if;

  if tg_op in ('INSERT', 'UPDATE') then
    affected_product_id := new.product_id;
    perform set_config('charwin_store.internal_moderation_write', 'on', true);
    update charwin_store.products
      set moderation_status = 'pending', is_published = false,
          reviewed_at = null, reviewed_by = null, rejection_reason = null
      where id = affected_product_id and moderation_status = 'approved';
  end if;

  perform set_config('charwin_store.internal_moderation_write', 'off', true);
  return coalesce(new, old);
end;
$$;

drop trigger if exists product_images_require_review on charwin_store.product_images;
create trigger product_images_require_review after insert or update or delete on charwin_store.product_images
  for each row execute function charwin_store.mark_product_pending_after_image_change();

create or replace function charwin_store.guard_shop_seller_fields()
returns trigger
language plpgsql
security definer
set search_path = charwin_store, pg_temp
as $$
begin
  if auth.uid() is null or charwin_store.is_shop_admin() then
    return new;
  end if;

  new.id := old.id;
  new.verification_status := old.verification_status;
  new.status := old.status;
  new.is_featured := old.is_featured;
  new.is_trusted := old.is_trusted;
  new.subscription_status := old.subscription_status;
  new.trial_ends_at := old.trial_ends_at;
  new.active_until := old.active_until;
  new.strike_count := old.strike_count;
  new.created_at := old.created_at;
  return new;
end;
$$;

drop trigger if exists shops_guard_seller_fields on charwin_store.shops;
create trigger shops_guard_seller_fields before update on charwin_store.shops
  for each row execute function charwin_store.guard_shop_seller_fields();

create or replace function charwin_store.guard_seller_order_fields()
returns trigger
language plpgsql
security definer
set search_path = charwin_store, pg_temp
as $$
begin
  if auth.uid() is null or charwin_store.is_shop_admin() then
    return new;
  end if;

  new.id := old.id;
  new.shop_id := old.shop_id;
  new.order_number := old.order_number;
  new.customer_name := old.customer_name;
  new.customer_phone := old.customer_phone;
  new.delivery_location := old.delivery_location;
  new.payment_preference := old.payment_preference;
  new.currency := old.currency;
  new.total := old.total;
  new.idempotency_key := old.idempotency_key;
  new.created_at := old.created_at;
  return new;
end;
$$;

drop trigger if exists orders_guard_seller_fields on charwin_store.orders;
create trigger orders_guard_seller_fields before update on charwin_store.orders
  for each row execute function charwin_store.guard_seller_order_fields();

alter table charwin_store.shops enable row level security;
alter table charwin_store.shop_members enable row level security;
alter table charwin_store.orders enable row level security;
alter table charwin_store.order_items enable row level security;
alter table charwin_store.reports enable row level security;
alter table charwin_store.strikes enable row level security;
alter table charwin_store.moderation_log enable row level security;

-- Replace the original single-shop public rules with rules that also check
-- verification, subscription status, and the associated shop for each item.
drop policy if exists "published products are public" on charwin_store.products;
drop policy if exists "active products from active shops are public" on charwin_store.products;
create policy "active products from active shops are public" on charwin_store.products
  for select to anon, authenticated
  using (
    moderation_status = 'approved' and is_published and not is_hidden and not admin_hidden
    and charwin_store.is_shop_public(shop_id)
  );

drop policy if exists "images of published products are public" on charwin_store.product_images;
drop policy if exists "images of public products are public" on charwin_store.product_images;
create policy "images of public products are public" on charwin_store.product_images
  for select to anon, authenticated using (charwin_store.is_product_public(product_id));

drop policy if exists "variants of published products are public" on charwin_store.product_variants;
drop policy if exists "variants of public products are public" on charwin_store.product_variants;
create policy "variants of public products are public" on charwin_store.product_variants
  for select to anon, authenticated using (charwin_store.is_product_public(product_id));

drop policy if exists "tags on public products are public" on charwin_store.tags;
drop policy if exists "tags on visible products are public" on charwin_store.tags;
create policy "tags on visible products are public" on charwin_store.tags
  for select to anon, authenticated using (
    exists (
      select 1 from charwin_store.product_tags link
      where link.tag_id = id and charwin_store.is_product_public(link.product_id)
    )
  );

drop policy if exists "tags of published products are public" on charwin_store.product_tags;
drop policy if exists "tags of public products are public" on charwin_store.product_tags;
create policy "tags of public products are public" on charwin_store.product_tags
  for select to anon, authenticated using (charwin_store.is_product_public(product_id));

create policy "shop members read their private shop record" on charwin_store.shops
  for select to authenticated using (charwin_store.is_shop_admin() or charwin_store.is_shop_member(id));
create policy "shop owners and managers update their profile" on charwin_store.shops
  for update to authenticated using (charwin_store.is_shop_member(id, array['owner', 'manager']))
  with check (charwin_store.is_shop_member(id, array['owner', 'manager']));
create policy "shop admins manage shops" on charwin_store.shops
  for all to authenticated using (charwin_store.is_shop_admin()) with check (charwin_store.is_shop_admin());

create policy "shop members read their membership list" on charwin_store.shop_members
  for select to authenticated using (charwin_store.is_shop_admin() or charwin_store.is_shop_member(shop_id));
create policy "shop admins manage memberships" on charwin_store.shop_members
  for all to authenticated using (charwin_store.is_shop_admin()) with check (charwin_store.is_shop_admin());

create policy "shop members read their products" on charwin_store.products
  for select to authenticated using (charwin_store.is_shop_member(shop_id));
create policy "shop members add pending products" on charwin_store.products
  for insert to authenticated with check (
    charwin_store.is_shop_member(shop_id) and moderation_status = 'pending' and not is_published
  );
create policy "shop members update their products" on charwin_store.products
  for update to authenticated using (charwin_store.is_shop_member(shop_id))
  with check (charwin_store.is_shop_member(shop_id));
create policy "shop members delete their products" on charwin_store.products
  for delete to authenticated using (charwin_store.is_shop_member(shop_id));

create policy "shop members read their product images" on charwin_store.product_images
  for select to authenticated using (
    exists (
      select 1 from charwin_store.products product
      where product.id = product_id and charwin_store.is_shop_member(product.shop_id)
    )
  );
create policy "shop members manage their product images" on charwin_store.product_images
  for all to authenticated using (
    exists (
      select 1 from charwin_store.products product
      where product.id = product_id and charwin_store.is_shop_member(product.shop_id)
    )
  ) with check (
    exists (
      select 1 from charwin_store.products product
      where product.id = product_id and charwin_store.is_shop_member(product.shop_id)
    )
  );

create policy "shop members read their variants" on charwin_store.product_variants
  for select to authenticated using (
    exists (
      select 1 from charwin_store.products product
      where product.id = product_id and charwin_store.is_shop_member(product.shop_id)
    )
  );
create policy "shop members manage their variants" on charwin_store.product_variants
  for all to authenticated using (
    exists (
      select 1 from charwin_store.products product
      where product.id = product_id and charwin_store.is_shop_member(product.shop_id)
    )
  ) with check (
    exists (
      select 1 from charwin_store.products product
      where product.id = product_id and charwin_store.is_shop_member(product.shop_id)
    )
  );

create policy "shop members manage tags for their products" on charwin_store.product_tags
  for all to authenticated using (
    exists (
      select 1 from charwin_store.products product
      where product.id = product_id and charwin_store.is_shop_member(product.shop_id)
    )
  ) with check (
    exists (
      select 1 from charwin_store.products product
      where product.id = product_id and charwin_store.is_shop_member(product.shop_id)
    )
  );

create policy "shop members read their orders" on charwin_store.orders
  for select to authenticated using (charwin_store.is_shop_admin() or charwin_store.is_shop_member(shop_id));
create policy "shop members update their orders" on charwin_store.orders
  for update to authenticated using (charwin_store.is_shop_member(shop_id))
  with check (charwin_store.is_shop_member(shop_id));
create policy "shop members read their order items" on charwin_store.order_items
  for select to authenticated using (charwin_store.is_shop_admin() or charwin_store.is_shop_member(shop_id));
create policy "shop admins manage orders" on charwin_store.orders
  for all to authenticated using (charwin_store.is_shop_admin()) with check (charwin_store.is_shop_admin());
create policy "shop admins manage order items" on charwin_store.order_items
  for all to authenticated using (charwin_store.is_shop_admin()) with check (charwin_store.is_shop_admin());

create policy "shop members read reports for their shop" on charwin_store.reports
  for select to authenticated using (charwin_store.is_shop_admin() or charwin_store.is_shop_member(shop_id));
create policy "shop admins manage reports" on charwin_store.reports
  for all to authenticated using (charwin_store.is_shop_admin()) with check (charwin_store.is_shop_admin());

create policy "shop members read their strikes" on charwin_store.strikes
  for select to authenticated using (charwin_store.is_shop_admin() or charwin_store.is_shop_member(shop_id));
create policy "shop admins manage strikes" on charwin_store.strikes
  for all to authenticated using (charwin_store.is_shop_admin()) with check (charwin_store.is_shop_admin());

create policy "shop members read moderation history" on charwin_store.moderation_log
  for select to authenticated using (charwin_store.is_shop_admin() or charwin_store.is_shop_member(shop_id));
create policy "shop admins write moderation history" on charwin_store.moderation_log
  for all to authenticated using (charwin_store.is_shop_admin()) with check (charwin_store.is_shop_admin());

-- Seller actions will be mediated by membership checks; server actions using
-- the Supabase service role can still create anonymous order/report attempts.
grant usage on schema charwin_store to anon, authenticated;
grant select on charwin_store.shops, charwin_store.shop_members,
  charwin_store.orders, charwin_store.order_items, charwin_store.reports,
  charwin_store.strikes, charwin_store.moderation_log to authenticated;
grant insert, update, delete on charwin_store.shops, charwin_store.shop_members,
  charwin_store.products, charwin_store.product_images,
  charwin_store.product_variants, charwin_store.product_tags,
  charwin_store.orders, charwin_store.order_items, charwin_store.reports,
  charwin_store.strikes, charwin_store.moderation_log to authenticated;

-- Public storefront reads use this narrow view. Verification files, owner
-- details, moderation state, and subscription controls are intentionally absent.
create or replace view charwin_store.public_shop_profiles
with (security_barrier = true)
as
select
  shop.id,
  shop.name,
  shop.slug,
  shop.bio,
  shop.location,
  shop.whatsapp_number,
  shop.logo_url,
  shop.banner_url,
  shop.instagram_url,
  shop.snapchat_url,
  shop.tiktok_url,
  shop.facebook_url,
  shop.website_url,
  (shop.momo_number is not null and shop.momo_network is not null and shop.momo_account_name is not null) as accepts_mobile_money,
  shop.accepts_cash_on_delivery,
  shop.is_featured
from charwin_store.shops shop
where charwin_store.is_shop_public(shop.id);

grant select on charwin_store.public_shop_profiles to anon, authenticated;

-- Seller identity documents stay in a private bucket and are namespaced by
-- shop UUID. Public shop logos and banners use a separate public bucket.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('shop-assets', 'shop-assets', true, 8388608, array['image/jpeg', 'image/png', 'image/webp']),
  ('verification-documents', 'verification-documents', false, 10485760,
    array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "shop members read their shop assets" on storage.objects;
create policy "shop members read their shop assets" on storage.objects
  for select to authenticated using (
    bucket_id = 'shop-assets'
    and (
      charwin_store.is_shop_admin()
      or charwin_store.is_shop_member((storage.foldername(name))[1]::uuid)
    )
  );
drop policy if exists "shop members upload shop assets" on storage.objects;
create policy "shop members upload shop assets" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'shop-assets'
    and charwin_store.is_shop_member((storage.foldername(name))[1]::uuid, array['owner', 'manager'])
  );
drop policy if exists "shop members update shop assets" on storage.objects;
create policy "shop members update shop assets" on storage.objects
  for update to authenticated using (
    bucket_id = 'shop-assets'
    and charwin_store.is_shop_member((storage.foldername(name))[1]::uuid, array['owner', 'manager'])
  ) with check (
    bucket_id = 'shop-assets'
    and charwin_store.is_shop_member((storage.foldername(name))[1]::uuid, array['owner', 'manager'])
  );
drop policy if exists "shop members delete shop assets" on storage.objects;
create policy "shop members delete shop assets" on storage.objects
  for delete to authenticated using (
    bucket_id = 'shop-assets'
    and charwin_store.is_shop_member((storage.foldername(name))[1]::uuid, array['owner', 'manager'])
  );

drop policy if exists "shop members read verification documents" on storage.objects;
create policy "shop members read verification documents" on storage.objects
  for select to authenticated using (
    bucket_id = 'verification-documents'
    and (
      charwin_store.is_shop_admin()
      or charwin_store.is_shop_member((storage.foldername(name))[1]::uuid)
    )
  );
drop policy if exists "shop members upload verification documents" on storage.objects;
create policy "shop members upload verification documents" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'verification-documents'
    and charwin_store.is_shop_member((storage.foldername(name))[1]::uuid, array['owner', 'manager'])
  );
drop policy if exists "shop members update verification documents" on storage.objects;
create policy "shop members update verification documents" on storage.objects
  for update to authenticated using (
    bucket_id = 'verification-documents'
    and charwin_store.is_shop_member((storage.foldername(name))[1]::uuid, array['owner', 'manager'])
  ) with check (
    bucket_id = 'verification-documents'
    and charwin_store.is_shop_member((storage.foldername(name))[1]::uuid, array['owner', 'manager'])
  );
drop policy if exists "shop members delete verification documents" on storage.objects;
create policy "shop members delete verification documents" on storage.objects
  for delete to authenticated using (
    bucket_id = 'verification-documents'
    and charwin_store.is_shop_member((storage.foldername(name))[1]::uuid, array['owner', 'manager'])
  );

drop policy if exists "charwin store admin uploads product images" on storage.objects;
create policy "shop members upload their product images" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'product-images'
    and charwin_store.can_manage_product_image_object(name)
  );
drop policy if exists "charwin store admin updates product images" on storage.objects;
create policy "shop members update their product images" on storage.objects
  for update to authenticated using (
    bucket_id = 'product-images'
    and charwin_store.can_manage_product_image_object(name)
  ) with check (
    bucket_id = 'product-images'
    and charwin_store.can_manage_product_image_object(name)
  );
drop policy if exists "charwin store admin deletes product images" on storage.objects;
create policy "shop members delete their product images" on storage.objects
  for delete to authenticated using (
    bucket_id = 'product-images'
    and charwin_store.can_manage_product_image_object(name)
  );

-- Make newly created marketplace tables, columns, and relationships visible
-- to the Supabase Data API immediately after this migration runs.
notify pgrst, 'reload schema';
