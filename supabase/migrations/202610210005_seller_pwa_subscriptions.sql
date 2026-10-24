-- Seller upload handoff, subscription reminder idempotency, and safe expiry page data.
create table if not exists charwin_store.seller_upload_drafts (
  product_id uuid primary key references charwin_store.products(id) on delete cascade,
  shop_id uuid not null references charwin_store.shops(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  caption text not null default '',
  expires_at timestamptz not null default now() + interval '7 days',
  created_at timestamptz not null default now()
);

create index if not exists seller_upload_drafts_expiry_idx
  on charwin_store.seller_upload_drafts(expires_at);

alter table charwin_store.seller_upload_drafts enable row level security;
grant select, insert, delete on charwin_store.seller_upload_drafts to authenticated;
create policy "sellers read their shared upload drafts" on charwin_store.seller_upload_drafts
  for select to authenticated using (
    user_id = auth.uid() and charwin_store.is_shop_member(shop_id)
  );
create policy "sellers remove their shared upload drafts" on charwin_store.seller_upload_drafts
  for delete to authenticated using (
    user_id = auth.uid() and charwin_store.is_shop_member(shop_id)
  );
create policy "sellers create their shared upload drafts" on charwin_store.seller_upload_drafts
  for insert to authenticated with check (
    user_id = auth.uid() and charwin_store.is_shop_member(shop_id)
  );

-- Server-side flows use the service role only after checking the authenticated
-- owner in the request: seller registration, AI pre-check persistence, and
-- expiry email idempotency.
grant usage on schema charwin_store to service_role;
grant select, insert, delete on charwin_store.shops, charwin_store.shop_members to service_role;
grant update on charwin_store.products to service_role;

create table if not exists charwin_store.shop_expiry_notices (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references charwin_store.shops(id) on delete cascade,
  cycle_end date not null,
  notice_day integer not null,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (shop_id, cycle_end, notice_day)
);

alter table charwin_store.shop_expiry_notices enable row level security;
revoke all on charwin_store.shop_expiry_notices from anon, authenticated;
grant all on charwin_store.shop_expiry_notices to service_role;

alter table charwin_store.site_settings
  alter column expiry_notice_days set default array[14, 7, 1, 0]::integer[];
update charwin_store.site_settings
set expiry_notice_days = array[14, 7, 1, 0]::integer[]
where expiry_notice_days = array[14, 7, 1]::integer[];

-- This view only tells visitors that an otherwise approved and active shop has
-- passed its subscription grace window. It contains no contact or owner data.
create or replace view charwin_store.public_expired_shop_profiles
with (security_barrier = true)
as
select shop.name, shop.slug
from charwin_store.shops shop
cross join lateral (
  select coalesce(max(settings.subscription_grace_days), 0) as grace_days
  from charwin_store.site_settings settings
) config
where shop.status = 'active'
  and shop.verification_status = 'approved'
  and case shop.subscription_status
    when 'trial' then shop.trial_ends_at
    else shop.active_until
  end is not null
  and case shop.subscription_status
    when 'trial' then shop.trial_ends_at
    else shop.active_until
  end + make_interval(days => config.grace_days) <= now();

grant select on charwin_store.public_expired_shop_profiles to anon, authenticated;
