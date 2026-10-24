# Marketplace admin guide

## Get admin access

Create the administrator account in Supabase Auth. In the Supabase SQL Editor, set `app_metadata.role` to `admin` using the SQL in the README. Sign out and back in, then open `/admin`. Keep the service-role key private and grant admin access only to trusted operators.

## Review seller shops

Open **Marketplace → Seller shops**. Check the seller's contact details and verification profile. If an ID document was provided through the private verification workflow, use its time-limited document link. Approve or reject verification and leave a note when useful. A verified shop must also be active to appear publicly.

Set a shop as trusted only after reviewing its history. Trusted shops can receive automatic approval for listings with a server-verified “looks fine” AI pre-check only when **trusted shops, low risk** is enabled in marketplace policy. All other listings remain in the human review queue.

Use access controls to suspend or ban a shop. Record warnings, suspensions, or bans in the strike form with a reason. These actions and moderation decisions are written to the moderation history.

## Review listings and reports

Open **Product review queue** to see pending listings. Check the full listing, shop, product photos, and any AI pre-check result. Approve suitable products. Rejections require a reason so the seller knows what to fix; the seller receives an email when Resend is configured.

Open **Customer reports** to review shop and product reports. Dismiss or mark a report reviewed, or hide a reported product while you investigate. A hidden listing can be restored after review from the product moderation tools.

## Manage subscriptions and policy

On each shop card, set Trial, Active, or Expired and enter the appropriate end date. Record manually received payments; V1 does not collect subscription or customer payments online. Expiry rules hide products after the configured grace period.

In **Marketplace policy**, edit the prohibited-items list, auto-approval mode, subscription grace period, and reminder days. Reminder emails require `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and `CRON_SECRET`, plus a daily scheduler calling `/api/cron/subscription-reminders` with a bearer token. Admin decision emails use the same Resend sender settings.

## Before launch

Apply all Supabase migrations, expose `charwin_store` in the Data API settings, configure seller email confirmation and production redirect URLs, set the HTTPS site URL, and verify the product, shop-assets, and verification-documents buckets. Configure AI and email secrets in the deployment provider. Review each seller, order, expiry, and share flow on the live domain before inviting shops.
