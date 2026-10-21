# Charwin Stores

Mobile-first Charwin Stores storefront for clothing and intimates. Customers can browse the catalog, filter by style and fit, save a bag in their browser, and send an order request directly through WhatsApp. Supabase catalog data is used when configured; local development falls back to the sample catalog.

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
| Danger | `#B42318` | Errors and destructive actions |

White text on the primary (`10.03:1`), primary-dark (`15.03:1`), accent (`4.75:1`), success (`5.41:1`), and danger (`6.57:1`) tokens meets WCAG AA for normal text. Muted text on white has a `6.53:1` contrast ratio.

## Supabase setup

1. Install the project dependencies with `npm install`.
2. Use your existing Supabase project and copy `.env.example` to `.env.local`.
3. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from the project API settings. Set `NEXT_PUBLIC_SUPABASE_DB_SCHEMA=charwin_store`. Keep `SUPABASE_SERVICE_ROLE_KEY` server-only; never prefix it with `NEXT_PUBLIC_`.
4. Install the Supabase CLI (for an npm-managed install, run `npm install supabase --save-dev` and use `npx supabase`), then link this folder with `npx supabase login` and `npx supabase link --project-ref <project-ref>`.
5. Review the migrations before applying them. The first migration is a no-op kept for compatibility with earlier setup; the second creates the isolated `charwin_store` schema used by the current app. Run `npx supabase db push --dry-run`, then `npx supabase db push` to apply it. This keeps the thread-ledger tables in `public` out of the shop catalog changes.
6. In Supabase Dashboard → Project Settings → API → Exposed schemas, add `charwin_store`. The app uses this schema for shop catalog requests while leaving other data in the existing project untouched.
7. In Supabase Auth, create the admin user with sign-ups disabled. Then, in the SQL Editor, grant that one account the admin claim by replacing the email below and running:

   ```sql
   update auth.users
   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
   where email = 'your-admin-email@example.com';
   ```

   Sign out and back in after setting the claim. The portal is available at `/admin`.
8. For a local development database, run `npx supabase start` and `npx supabase db reset`. That recreates the local database, applies migrations, and loads the 12 sample products from `supabase/seed.sql`.
9. To seed a remote development project, use `npx supabase db push --include-seed` only on a non-production project.
10. Start the Next.js app with `npm run dev`, then open `http://localhost:3000`.

## Storefront and WhatsApp orders

- `/` is the home page, `/shop` is the searchable catalog, and `/cart` holds the browser-persisted bag.
- Product pages support image galleries, image zoom, color and size selection, stock limits, and related items.
- Set `NEXT_PUBLIC_WHATSAPP_NUMBER` to an international number using digits only (for example, `233241234567`), or set it in the admin settings. Ghana local numbers beginning with `0` are converted to international format. The settings page includes a test-chat link.
- The order form includes optional name, delivery area, and notes. It opens WhatsApp with the item list and subtotal; delivery and payment are confirmed with the shop.
- Underwear imagery starts blurred and is revealed after an “I’m 18+” confirmation stored in that browser.
- No online payment is collected by this storefront. The old `/checkout` URL returns shoppers to `/cart`.

The admin write policies check the Supabase Auth `app_metadata.role` claim for the value `admin`. Public sign-up should be disabled for the single-admin shop.

## Admin portal

- `/admin` is the private dashboard. Sign in with the Supabase Auth account whose `app_metadata.role` is `admin`.
- `/admin/quick-upload` accepts multiple photos or a camera capture. Each photo becomes its own draft product; edit quick details inline, then open the full editor to choose sizes and stock before publishing.
- `/admin/products` manages existing items, including publish/unpublish, duplicate-as-draft, edit, and delete.
- `/admin/settings` manages the storefront name, WhatsApp number, currency, announcement, categories, ordered shop sections, and seasonal or thrift collection tags.
- Uploads are resized to 1800px, converted to WebP in the browser, and stored in the `product-images` bucket. Admin sessions and database row-level security protect all writes.

## Environment variables

See `.env.example` for the current variable names. `NEXT_PUBLIC_WHATSAPP_NUMBER` is intentionally blank until the shop owner supplies the international phone number without a leading `+`. The site-settings row also leaves the number unset. `GHS` is the initial currency assumption.

The `AI_VISION_PROVIDER` and `AI_VISION_API_KEY` variables are reserved for the configurable image-tagging integration in a later phase.

## Supabase files

- `supabase/migrations/202610200001_charwin_catalog.sql` is an intentional no-op retained for migration-history compatibility; `202610200002_charwin_store_schema.sql` creates the isolated catalog schema, RLS policies, and product image bucket.
- `supabase/seed.sql` adds editable category, brand, and tag examples plus 12 sample products, image URLs, variants, and tags in `charwin_store`.
- `supabase/config.toml` configures local development and seed loading.
- `public/brand/charwin-stores-logo.jpg`, `pwa-192.png`, and `pwa-512.png` contain the provided logo for the header, share preview, and app manifest.

Seed products are examples, not real stock. Replace or remove them before launch. The sample image URLs are for local development; real product image management uses the public Supabase Storage bucket.
