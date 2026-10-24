-- Optional low-risk auto-approval for trusted, active, verified shops.
-- Sellers cannot set their own approval: the rule runs only after the
-- moderation guard has forced a product into pending review.

create or replace function charwin_store.auto_approve_trusted_low_risk_product()
returns trigger
language plpgsql
security definer
set search_path = charwin_store, pg_temp
as $$
declare
  shop_record charwin_store.shops%rowtype;
  approval_mode text;
begin
  if (auth.uid() is null and coalesce(auth.jwt() ->> 'role', current_setting('request.jwt.claim.role', true)) <> 'service_role')
     or (auth.uid() is not null and charwin_store.is_shop_admin())
     or current_setting('charwin_store.internal_moderation_write', true) = 'on'
     or new.moderation_status is distinct from 'pending'
     or new.moderation_verdict is distinct from 'looks_fine'
     or new.is_hidden
     or new.admin_hidden then
    return new;
  end if;

  select * into shop_record
  from charwin_store.shops
  where id = new.shop_id;
  select auto_approval_mode into approval_mode
  from charwin_store.site_settings
  where id = true;

  if not coalesce(shop_record.is_trusted, false)
     or shop_record.status is distinct from 'active'
     or shop_record.verification_status is distinct from 'approved'
     or approval_mode is distinct from 'trusted_shops_low_risk' then
    return new;
  end if;

  perform set_config('charwin_store.internal_moderation_write', 'on', true);
  update charwin_store.products
  set moderation_status = 'approved',
      is_published = true,
      reviewed_at = now(),
      reviewed_by = null,
      rejection_reason = null
  where id = new.id;
  perform set_config('charwin_store.internal_moderation_write', 'off', true);

  insert into charwin_store.moderation_log (
    shop_id, product_id, actor_user_id, action, reason,
    previous_values, new_values
  ) values (
    new.shop_id, new.id, null, 'product_auto_approved',
    'Trusted shop listing passed the AI pre-check under the configured low-risk rule.',
    jsonb_build_object('moderation_status', 'pending', 'is_published', false),
    jsonb_build_object('moderation_status', 'approved', 'is_published', true)
  );

  return new;
end;
$$;

-- Do not accept a seller-supplied AI verdict. Only the server-side vision
-- endpoint writes a verdict after it has checked the photo and policy list.
create or replace function charwin_store.clear_unverified_seller_ai_verdict()
returns trigger
language plpgsql
security definer
set search_path = charwin_store, pg_temp
as $$
begin
  if auth.uid() is not null and not charwin_store.is_shop_admin() then
    if tg_op = 'INSERT' then
      new.moderation_verdict := null;
      new.moderation_reason := null;
    elsif new.name is distinct from old.name
       or new.description is distinct from old.description
       or new.brand_id is distinct from old.brand_id
       or new.category_id is distinct from old.category_id
       or new.subcategory_id is distinct from old.subcategory_id
       or new.gender is distinct from old.gender
       or new.sleeve_length is distinct from old.sleeve_length
       or new.style is distinct from old.style
       or new.discreet_image is distinct from old.discreet_image then
      new.moderation_verdict := null;
      new.moderation_reason := null;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists products_clear_seller_ai_verdict on charwin_store.products;
drop trigger if exists products_reset_seller_ai_verdict on charwin_store.products;
create trigger products_reset_seller_ai_verdict
before insert or update on charwin_store.products
for each row execute function charwin_store.clear_unverified_seller_ai_verdict();

drop trigger if exists products_auto_approve_trusted_low_risk on charwin_store.products;
create trigger products_auto_approve_trusted_low_risk
after insert or update of moderation_status, moderation_verdict, is_published, is_hidden, admin_hidden
on charwin_store.products
for each row execute function charwin_store.auto_approve_trusted_low_risk_product();

create or replace function charwin_store.clear_product_ai_verdict_after_image_change()
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
  affected_product_id := case when tg_op = 'DELETE' then old.product_id else new.product_id end;
  perform set_config('charwin_store.internal_moderation_write', 'on', true);
  update charwin_store.products
  set moderation_verdict = null, moderation_reason = null
  where id = affected_product_id;
  perform set_config('charwin_store.internal_moderation_write', 'off', true);
  return coalesce(new, old);
end;
$$;

drop trigger if exists product_images_reset_ai_verdict on charwin_store.product_images;
create trigger product_images_reset_ai_verdict
after insert or update or delete on charwin_store.product_images
for each row execute function charwin_store.clear_product_ai_verdict_after_image_change();
