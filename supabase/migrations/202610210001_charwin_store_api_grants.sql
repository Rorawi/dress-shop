-- Ensure the Data API roles can use the dedicated Charwin catalog schema.
-- Row-level security remains enabled and continues to control row access.
grant usage on schema charwin_store to anon, authenticated, service_role;

grant select on all tables in schema charwin_store to anon, authenticated;
grant insert, update, delete on all tables in schema charwin_store to authenticated;
grant all privileges on all tables in schema charwin_store to service_role;

grant execute on function charwin_store.is_shop_admin() to authenticated, service_role;
