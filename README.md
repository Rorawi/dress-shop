# Charwin Stores

Mobile-first Charwin Stores marketplace for clothing and intimates. Customers can browse local sellers, save products from several shops in one browser bag, and send a separate order request to each shop through WhatsApp. Catalog and shop data load from Supabase; local development sample data is loaded by the Supabase seed.

## Stack

- Next.js App Router, TypeScript, React, and Tailwind CSS
- Supabase Postgres, Auth, and Storage for the target catalog and admin flows
- Playfair Display for fashion-led headings, paired with Inter for readable UI text
- Vercel-ready Next.js deployment

## Brand palette

| Token | Hex | Use |
| --- | --- | --- |
| Primary | `#55239A` | Main actions and brand accents |
| Primary dark | `#35115F` | High-contrast emphasis |
| Accent | `#8B5BC7` | Decorative highlights |
| Background | `#FCFBFD` | Page background |
| Surface | `#FFFFFF` | Cards and panels |
| Text | `#17141C` | Main copy |
| Muted text | `#625B68` | Secondary copy |
| Border | `#E6E0EB` | Dividers and controls |
| Success | `#18794E` | Positive status |
| Warning | `#8A4B00` | Caution and expiry status |
| Danger | `#B42318` | Errors and destructive actions |

White text on the primary (`10.03:1`), primary-dark (`15.03:1`), accent (`4.75:1`), success (`5.41:1`), warning (`6.80:1`), and danger (`6.57:1`) tokens meets WCAG AA for normal text. Muted text on white has a `6.53:1` contrast ratio.

## Supabase setup

1. Install the project dependencies with `npm install`.
2. Use your existing Supabase project and copy `.env.example` to `.env.local`.
3. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from the project API settings. Set `NEXT_PUBLIC_SUPABASE_DB_SCHEMA=charwin_store`. Keep `SUPABASE_SERVICE_ROLE_KEY` server-only; never prefix it with `NEXT_PUBLIC_`.
4. Install the Supabase CLI (for an npm-managed install, run `npm install supabase --save-dev` and use `npx supabase`), then link this folder with `npx supabase login` and `npx supabase link --project-ref <project-ref>`.
5. Review the migrations before applying them. The first migration is a no-op kept for compatibility with earlier setup; the second creates the isolated `charwin_store` catalog schema; the third adds the multi-vendor marketplace schema, tenant-aware RLS, private verification storage, and public-safe shop profiles; the fourth adds persistent rate limits for anonymous reports and order attempts; the fifth adds seller-owned shared-image drafts, subscription reminder tracking, and a safe expired-shop view; the sixth adds trusted-shop, low-risk auto-approval. Run `npx supabase db push --dry-run`, then `npx supabase db push` to apply them. This keeps the thread-ledger tables in `public` out of the shop catalog changes.
6. In Supabase Dashboard → Project Settings → API → Exposed schemas, add `charwin_store`. The app uses this schema for shop catalog requests while leaving other data in the existing project untouched.
7. In Supabase Auth, enable email sign-up and email confirmation for seller registration. Create the admin account, then in the SQL Editor grant that account the admin claim by replacing the email below and running:

   ```sql
   update auth.users
   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
   where email = 'your-admin-email@example.com';
   ```

   Sign out and back in after setting the claim. The admin portal is available at `/admin`; sellers register at `/seller/signup` and sign in at `/seller/login`. Customers do not need accounts.
8. For a local development database, run `npx supabase start` and `npx supabase db reset`. That recreates the local database, applies migrations, and loads three sample shops and 15 fictional products from `supabase/seed.sql`. The demo shops intentionally have no WhatsApp or MoMo numbers.
9. To seed a remote development project, use `npx supabase db push --include-seed` only on a non-production project.
10. Start the Next.js app with `npm run dev`, then open `http://localhost:3000`.

## Storefront and WhatsApp orders

- `/` is the home page, `/shop` is the searchable, filterable marketplace, `/s/<shop-slug>` is a public shop storefront, and `/cart` holds the browser-persisted bag.
- Product pages support swipeable image galleries, image zoom, color and size selection, live stock limits, shop details, more from that seller, related recommendations, and product reports.
- Search and filters include category, shop, brand, color, size, sleeve length, price, gender, and tags. Search also matches product, brand, color, tag, and shop names.
- Configure each shop’s own WhatsApp number and order options in the `shops` row. The legacy site-wide WhatsApp setting is only used for general marketplace questions. Ghana local numbers beginning with `0` are converted to international format.
- The order form includes optional name, phone, and delivery location plus the shop’s available payment preferences. Before WhatsApp opens, the server checks current product approval, variant stock, price, shop status, and payment settings, then records one order for that shop. A multi-shop bag has a separate WhatsApp button for every shop.
- If a shop has complete MoMo details, the confirmation screen shows its number, network, and account name. Payment is made directly to the shop; Charwin Stores does not handle payments. The `SUPABASE_SERVICE_ROLE_KEY` is required server-side for order logging and reports.
- Shop and product report forms submit to the reports table and are rate-limited by a persistent database function.
- Underwear imagery starts blurred and is revealed after an “I’m 18+” confirmation stored in that browser.
- No online payment is collected by this storefront. The old `/checkout` URL returns shoppers to `/cart`.

Admin write policies check the Supabase Auth `app_metadata.role` claim for `admin`; seller policies use `shop_members` ownership. Keep the service-role key server-only. Configure Supabase Auth email confirmation and production redirect URLs before opening seller registration.

## Admin portal

- `/admin` is the private dashboard. Sign in with the Supabase Auth account whose `app_metadata.role` is `admin`.
- `/admin/quick-upload` accepts multiple photos or a camera capture. The WhatsApp intake can parse pasted captions into draft details and use AI to suggest a product name, description, colours, department, and fit from the first selected photo. Review suggestions, then set price and stock before publishing.
- `/admin/products` manages existing items, including publish/unpublish, duplicate-as-draft, edit, and delete.
- `/admin/settings` manages the storefront name, WhatsApp number, currency, announcement, categories, ordered shop sections, and seasonal or thrift collection tags.
- `/admin/marketplace` manages shop verification, trust flags, listing decisions, reports, strikes, and manually recorded subscriptions. Automatic low-risk approval is optional and limited to trusted, verified, active shops with a server-side AI “looks fine” result.
- The marketplace overview includes shop, product, logged-order, and open-report counts plus top shops by logged orders and top products by ordered quantity.
- Uploads are resized to 1800px, converted to WebP in the browser, and stored in the `product-images` bucket. Admin sessions and database row-level security protect all writes.

## Environment variables

See `.env.example` for the current variable names. `NEXT_PUBLIC_WHATSAPP_NUMBER` is intentionally blank until the shop owner supplies the international phone number without a leading `+`. The site-settings row also leaves the number unset. `GHS` is the initial currency assumption.

The optional image-tagging and moderation pre-check uses `AI_VISION_PROVIDER=openai`, `AI_VISION_MODEL=gpt-4.1-mini`, and `AI_VISION_API_KEY`. Add the key as a server-only variable in `.env.local` for local development and in the deployment environment for the live site. Do not prefix it with `NEXT_PUBLIC_`. Sellers and admins can request suggestions; AI output never sets price or stock. Products stay in the human review queue unless the admin explicitly enables trusted-shop low-risk auto-approval.

Subscription email reminders and seller moderation notices are optional. Set `RESEND_API_KEY`, `RESEND_FROM_EMAIL` to a verified sender, and a long random `CRON_SECRET`. Schedule a daily authenticated GET or POST to `/api/cron/subscription-reminders`. Without these values, seller expiry status and storefront grace rules still work, but reminder and decision emails are not sent.

## Supabase files

- `supabase/migrations/202610200001_charwin_catalog.sql` is an intentional no-op retained for migration-history compatibility; `202610200002_charwin_store_schema.sql` creates the isolated catalog schema, RLS policies, and product image bucket.
- `supabase/migrations/202610210003_marketplace_schema.sql` adds shops and shop memberships, moderation states, order logging, reports, strikes, moderation history, expiry settings, and shop-scoped RLS. Existing products are preserved and attached to the legacy Charwin shop.
- `supabase/migrations/202610210004_public_action_rate_limits.sql` adds persistent rate limiting for customer order attempts and reports.
- `supabase/migrations/202610210005_seller_pwa_subscriptions.sql` adds seller-owned Android share drafts, deduplicated expiry notices, and a narrow public view for expired shops. Apply all migrations in order before enabling seller signup.
- `supabase/migrations/202610210006_trusted_shop_auto_approval.sql` implements the optional trusted-shop low-risk auto-approval rule and rejects seller-supplied AI verdicts.
- Public catalog reads require an approved product and an approved, active, in-term shop. Sellers see and manage only shops where they are members. The `public_shop_profiles` view omits owner details, verification documents, private MoMo credentials, moderation controls, and subscription controls.
- Seller verification documents use the private `verification-documents` storage bucket. Shop logos and banners use `shop-assets`; product image paths use `shop-uuid/product-uuid/filename` in `product-images` so seller uploads are checked against shop membership.
- `supabase/seed.sql` adds editable category, brand, and tag examples plus three fictional shops and 15 sample products, images, variants, and tags in `charwin_store`.
- `supabase/config.toml` configures local development and seed loading.
- `public/brand/charwin-stores-logo.jpg`, `pwa-192.png`, and `pwa-512.png` contain the provided logo for the header, share preview, and app manifest.

Seed products are examples, not real stock. Replace or remove them before launch. Sample image URLs are for local development; real product image management uses Supabase Storage.

## Seller studio and marketplace administration

- Sellers register at `/seller/signup` and must provide an established profile link for verification. Shops start pending and remain private until verified. The seller studio includes product drafts, multi-photo upload, order tracking, shop logo and banner uploads, payment settings, and the public shop URL and QR code.
- Sellers can add up to eight photos of one item to a product draft. AI suggests a title, description, category, subcategory, colours, sleeve length, gender, and prohibited-items pre-check. Sellers choose a known brand, price, sizes, stock, and tags. Editing material listing content or photos sends an approved listing back to review; price and stock edits keep approval.
- Install Charwin Stores on Android and use the system Share action to send up to eight images to the seller studio. Shared photos become seller-owned drafts. PWA installation and Android sharing require HTTPS and an active seller login. iPhone sellers use Choose photos or Take photo in Quick Upload.
- Admin marketplace pages are under `/admin/marketplace`: `/shops` for verification, access, strikes, and subscriptions; `/review` for listing decisions; `/reports` for customer reports; and `/settings` for prohibited-items guidance and grace/reminder policy.
- Step-by-step handouts are in [the seller guide](docs/SELLER_GUIDE.md) and [the admin guide](docs/ADMIN_GUIDE.md).
- Approved shops past their subscription grace period show a temporary-unavailability page. `/sitemap.xml` lists public products and shops; `/robots.txt` excludes admin, seller, API, cart, and checkout routes.

For production, set the public site URL to the HTTPS domain, expose `charwin_store` in Supabase Data API settings, configure Supabase Auth confirmation and redirect URLs, apply all migrations, and verify that Storage has the `product-images`, `shop-assets`, and private `verification-documents` buckets. Add the server-only service-role, AI, Resend, and cron secrets to the deployment provider. The Android share target is available after PWA installation. The QR image is rendered by QR Server and encodes only the public shop URL.

## Production deployment

1. Provision a Supabase project and set its exposed schema to include `charwin_store`. Configure email confirmation and production redirect URLs in Auth; use a production SMTP provider for seller sign-up email.
2. Add the required public URL and publishable key plus `SUPABASE_SERVICE_ROLE_KEY` to the deploy environment. Set `NEXT_PUBLIC_SITE_URL` to the final HTTPS domain. Add the optional AI and Resend variables only when those integrations are enabled.
3. Apply all reviewed migrations with the Supabase CLI. Create or enable the admin Auth account and apply the admin `app_metadata.role` claim. Confirm `/admin` opens for the admin and `/seller/signup` creates a pending shop.
4. Connect the repository to the Next.js hosting provider or deploy with its CLI. Build with `npm run build`, attach the custom domain, and confirm HTTPS is active. Set environment variables for every deployment environment that needs them.
5. Configure a daily scheduler to call `GET /api/cron/subscription-reminders` with `Authorization: Bearer <CRON_SECRET>`. Test with a verified sender email and a shop whose expiry date is in one of the configured reminder windows.
6. Review seller onboarding, shop verification, product moderation, order status changes, report actions, renewal expiry, QR destinations, and the Android install/share flow on the deployed domain before inviting sellers.

The app only caches static assets for offline startup; catalog, orders, and seller actions require a network connection. AI pre-checks, renewal emails, and QR images depend on their configured external providers.
