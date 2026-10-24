-- Persistent per-IP throttling for anonymous order and report submissions.
create table if not exists charwin_store.public_action_rate_limits (
  fingerprint text not null,
  action text not null check (action in ('order', 'report')),
  window_start timestamptz not null,
  request_count integer not null default 0 check (request_count >= 0),
  primary key (fingerprint, action, window_start)
);

alter table charwin_store.public_action_rate_limits enable row level security;
revoke all on charwin_store.public_action_rate_limits from anon, authenticated;
grant usage on schema charwin_store to service_role;
grant select on charwin_store.shops, charwin_store.products,
  charwin_store.product_variants, charwin_store.site_settings to service_role;
grant select, insert, update, delete on charwin_store.orders,
  charwin_store.order_items, charwin_store.reports to service_role;
grant usage, select on sequence charwin_store.orders_order_number_seq to service_role;

create or replace function charwin_store.consume_public_action_rate_limit(
  p_fingerprint text,
  p_action text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, charwin_store
as $$
declare
  v_window_start timestamptz;
  v_count integer;
begin
  if p_action not in ('order', 'report') or p_limit < 1 or p_window_seconds < 1 then
    return false;
  end if;
  v_window_start := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );
  insert into charwin_store.public_action_rate_limits(fingerprint, action, window_start, request_count)
  values (p_fingerprint, p_action, v_window_start, 1)
  on conflict (fingerprint, action, window_start)
  do update set request_count = charwin_store.public_action_rate_limits.request_count + 1
  returning request_count into v_count;

  delete from charwin_store.public_action_rate_limits
  where window_start < now() - interval '2 days';
  return v_count <= p_limit;
end;
$$;

revoke all on function charwin_store.consume_public_action_rate_limit(text, text, integer, integer) from public, anon, authenticated;
grant execute on function charwin_store.consume_public_action_rate_limit(text, text, integer, integer) to service_role;
