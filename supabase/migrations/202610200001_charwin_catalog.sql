-- Charwin Stores catalog schema. Admin identity is managed by Supabase Auth;
-- only users with app_metadata.role = 'admin' may change catalog records.

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  department text not null default 'clothing'
    check (department in ('clothing', 'underwear')),
  parent_id uuid references public.categories(id) on delete cascade,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subcategories (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  name text not null,
  slug text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (category_id, slug)
);

create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  kind text not null default 'general'
    check (kind in ('general', 'seasonal', 'collection')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  brand_id uuid references public.brands(id) on delete set null,
  category_id uuid not null references public.categories(id) on delete restrict,
  subcategory_id uuid references public.subcategories(id) on delete set null,
  gender text check (gender in ('women', 'men', 'unisex', 'kids')),
  sleeve_length text,
  style text,
  price numeric(10, 2) not null check (price >= 0),
  compare_at_price numeric(10, 2) check (compare_at_price is null or compare_at_price >= price),
  is_published boolean not null default false,
  is_hidden boolean not null default false,
  is_featured boolean not null default false,
  discreet_image boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text,
  source_url text,
  alt_text text not null default '',
  position integer not null default 0,
  is_primary boolean not null default false,
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  created_at timestamptz not null default now(),
  check (storage_path is not null or source_url is not null)
);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  size text not null default 'One size',
  color text not null default 'Default',
  stock integer not null default 0 check (stock >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, size, color)
);

create table if not exists public.product_tags (
  product_id uuid not null references public.products(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (product_id, tag_id)
);

create table if not exists public.site_settings (
  id boolean primary key default true check (id),
  shop_name text not null default 'Charwin Stores',
  whatsapp_number text check (whatsapp_number is null or whatsapp_number ~ '^[0-9]+$'),
  currency char(3) not null default 'GHS',
  featured_season_tag_id uuid references public.tags(id) on delete set null,
  announcement_banner text,
  updated_at timestamptz not null default now()
);

create index if not exists products_category_idx on public.products(category_id);
create index if not exists products_subcategory_idx on public.products(subcategory_id);
create index if not exists products_brand_idx on public.products(brand_id);
create index if not exists products_publication_idx on public.products(is_published, is_hidden, created_at desc);
create index if not exists products_price_idx on public.products(price);
create index if not exists product_images_product_order_idx on public.product_images(product_id, position);
create index if not exists product_variants_product_idx on public.product_variants(product_id);
create index if not exists product_tags_tag_idx on public.product_tags(tag_id, product_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger categories_set_updated_at before update on public.categories
  for each row execute function public.set_updated_at();
create trigger subcategories_set_updated_at before update on public.subcategories
  for each row execute function public.set_updated_at();
create trigger brands_set_updated_at before update on public.brands
  for each row execute function public.set_updated_at();
create trigger tags_set_updated_at before update on public.tags
  for each row execute function public.set_updated_at();
create trigger products_set_updated_at before update on public.products
  for each row execute function public.set_updated_at();
create trigger product_variants_set_updated_at before update on public.product_variants
  for each row execute function public.set_updated_at();
create trigger site_settings_set_updated_at before update on public.site_settings
  for each row execute function public.set_updated_at();

create or replace function public.is_shop_admin()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role' = 'admin', false);
$$;

grant execute on function public.is_shop_admin() to authenticated;

alter table public.categories enable row level security;
alter table public.subcategories enable row level security;
alter table public.brands enable row level security;
alter table public.tags enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_tags enable row level security;
alter table public.site_settings enable row level security;

create policy "active categories are public" on public.categories
  for select to anon, authenticated using (is_active);
create policy "shop admin manages categories" on public.categories
  for all to authenticated using (public.is_shop_admin()) with check (public.is_shop_admin());

create policy "active subcategories are public" on public.subcategories
  for select to anon, authenticated using (
    is_active and exists (
      select 1 from public.categories c where c.id = category_id and c.is_active
    )
  );
create policy "shop admin manages subcategories" on public.subcategories
  for all to authenticated using (public.is_shop_admin()) with check (public.is_shop_admin());

create policy "brands are public" on public.brands
  for select to anon, authenticated using (true);
create policy "shop admin manages brands" on public.brands
  for all to authenticated using (public.is_shop_admin()) with check (public.is_shop_admin());

create policy "tags on public products are public" on public.tags
  for select to anon, authenticated using (
    exists (
      select 1 from public.product_tags pt
      join public.products p on p.id = pt.product_id
      where pt.tag_id = id and p.is_published and not p.is_hidden
    )
  );
create policy "shop admin manages tags" on public.tags
  for all to authenticated using (public.is_shop_admin()) with check (public.is_shop_admin());

create policy "published products are public" on public.products
  for select to anon, authenticated using (is_published and not is_hidden);
create policy "shop admin manages products" on public.products
  for all to authenticated using (public.is_shop_admin()) with check (public.is_shop_admin());

create policy "images of published products are public" on public.product_images
  for select to anon, authenticated using (
    exists (
      select 1 from public.products p
      where p.id = product_id and p.is_published and not p.is_hidden
    )
  );
create policy "shop admin manages product images" on public.product_images
  for all to authenticated using (public.is_shop_admin()) with check (public.is_shop_admin());

create policy "variants of published products are public" on public.product_variants
  for select to anon, authenticated using (
    exists (
      select 1 from public.products p
      where p.id = product_id and p.is_published and not p.is_hidden
    )
  );
create policy "shop admin manages variants" on public.product_variants
  for all to authenticated using (public.is_shop_admin()) with check (public.is_shop_admin());

create policy "tags of published products are public" on public.product_tags
  for select to anon, authenticated using (
    exists (
      select 1 from public.products p
      where p.id = product_id and p.is_published and not p.is_hidden
    )
  );
create policy "shop admin manages product tags" on public.product_tags
  for all to authenticated using (public.is_shop_admin()) with check (public.is_shop_admin());

create policy "shop settings are public" on public.site_settings
  for select to anon, authenticated using (true);
create policy "shop admin manages settings" on public.site_settings
  for all to authenticated using (public.is_shop_admin()) with check (public.is_shop_admin());

grant usage on schema public to anon, authenticated;
grant select on public.categories, public.subcategories, public.brands, public.tags,
  public.products, public.product_images, public.product_variants, public.product_tags,
  public.site_settings to anon, authenticated;
grant insert, update, delete on public.categories, public.subcategories, public.brands,
  public.tags, public.products, public.product_images, public.product_variants,
  public.product_tags, public.site_settings to authenticated;

-- Public product images are readable by shoppers; uploads and changes require an admin claim.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "product images are publicly readable" on storage.objects
  for select to anon, authenticated using (bucket_id = 'product-images');
create policy "shop admin uploads product images" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'product-images' and public.is_shop_admin()
  );
create policy "shop admin updates product images" on storage.objects
  for update to authenticated using (
    bucket_id = 'product-images' and public.is_shop_admin()
  ) with check (bucket_id = 'product-images' and public.is_shop_admin());
create policy "shop admin deletes product images" on storage.objects
  for delete to authenticated using (
    bucket_id = 'product-images' and public.is_shop_admin()
  );
