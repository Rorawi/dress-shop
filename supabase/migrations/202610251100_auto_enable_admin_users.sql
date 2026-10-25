-- Auto-enable Charwin store admin access
-- 1. Grant admin role in raw_app_meta_data to all existing users in auth.users
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb;

-- 2. Create trigger to auto-grant admin role to future users created in auth.users
create or replace function public.auto_assign_admin_role()
returns trigger as $$
begin
  if new.raw_app_meta_data is null or not (new.raw_app_meta_data ? 'role') then
    new.raw_app_meta_data := coalesce(new.raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created_assign_admin on auth.users;
create trigger on_auth_user_created_assign_admin
  before insert on auth.users
  for each row execute function public.auto_assign_admin_role();

-- 3. Update is_shop_admin() so RLS accepts app_metadata, user_metadata, or any authenticated non-seller
create or replace function charwin_store.is_shop_admin()
returns boolean
language sql
stable
as $$
  select coalesce(
    auth.jwt() -> 'app_metadata' ->> 'role' = 'admin',
    auth.jwt() -> 'user_metadata' ->> 'role' = 'admin',
    (auth.uid() is not null and not exists (select 1 from charwin_store.shop_members sm where sm.user_id = auth.uid())),
    false
  );
$$;

grant execute on function charwin_store.is_shop_admin() to anon, authenticated, service_role;

-- 4. Reload PostgREST schema cache
notify pgrst, 'reload schema';
