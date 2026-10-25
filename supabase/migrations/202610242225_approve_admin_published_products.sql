-- Re-approve all published, non-hidden products that are still flagged as
-- pending moderation. This catches any listings that were:
--   1. Created before the marketplace migration ran its backfill.
--   2. Uploaded via quick-upload / WhatsApp import and published via the
--      product-list toggle before the toggle was updated to set the status.
--   3. Caught by a race condition during the original marketplace migration.
--
-- Only products whose shops are already active and approved are touched,
-- so seller-submitted listings pending genuine admin review are not affected.
update charwin_store.products p
set
  moderation_status = 'approved',
  reviewed_at        = coalesce(reviewed_at, now())
from charwin_store.shops s
where p.shop_id = s.id
  and p.moderation_status = 'pending'
  and p.is_published = true
  and p.is_hidden    = false
  and p.admin_hidden = false
  and s.status               = 'active'
  and s.verification_status  = 'approved';

-- Notify PostgREST to reload its schema cache so the updated rows are
-- immediately visible to the storefront without a server restart.
notify pgrst, 'reload schema';
