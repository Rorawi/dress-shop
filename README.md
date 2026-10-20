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
2. Create a Supabase project and copy `.env.example` to `.env.local`.
3. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from the Supabase project API settings. Keep `SUPABASE_SERVICE_ROLE_KEY` server-only; never prefix it with `NEXT_PUBLIC_`.
4. Install the Supabase CLI (for an npm-managed install, run `npm install supabase --save-dev` and use `npx supabase`), then link this folder with `npx supabase login` and `npx supabase link --project-ref <project-ref>`.
5. Review the migration before applying it. Run `npx supabase db push --dry-run`, then `npx supabase db push` to apply the schema to the linked project.
6. For a local development database, run `npx supabase start` and `npx supabase db reset`. That recreates the local database, applies migrations, and loads the 12 sample products from `supabase/seed.sql`.
7. To seed a remote development project, use `npx supabase db push --include-seed` only on a non-production project.
8. Start the Next.js app with `npm run dev`, then open `http://localhost:3000`.

## Storefront and WhatsApp orders

- `/` is the home page, `/shop` is the searchable catalog, and `/cart` holds the browser-persisted bag.
- Product pages support image galleries, image zoom, color and size selection, stock limits, and related items.
- Set `NEXT_PUBLIC_WHATSAPP_NUMBER` to an international number using digits only (for example, country code followed by the number). You can also set it in the `site_settings` row. When no number is configured, WhatsApp order buttons stay disabled and explain that setup is pending.
- The order form includes optional name, delivery area, and notes. It opens WhatsApp with the item list and subtotal; delivery and payment are confirmed with the shop.
- Underwear imagery starts blurred and is revealed after an “I’m 18+” confirmation stored in that browser.
- No online payment is collected by this storefront. The old `/checkout` URL returns shoppers to `/cart`.

The admin write policies check the Supabase Auth `app_metadata.role` claim for the value `admin`. The account itself will be configured in the admin phase. Public sign-up should be disabled for the eventual single-admin shop.

## Environment variables

See `.env.example` for the current variable names. `NEXT_PUBLIC_WHATSAPP_NUMBER` is intentionally blank until the shop owner supplies the international phone number without a leading `+`. The site-settings row also leaves the number unset. `GHS` is the initial currency assumption.

The `AI_VISION_PROVIDER` and `AI_VISION_API_KEY` variables are reserved for the configurable image-tagging integration in a later phase.

## Supabase files

- `supabase/migrations/202610200001_charwin_catalog.sql` creates the catalog tables, RLS policies, and public product image bucket.
- `supabase/seed.sql` adds editable category, brand, and tag examples plus 12 sample products, image URLs, variants, and tags.
- `supabase/config.toml` configures local development and seed loading.
- `public/brand/charwin-stores-logo.jpg`, `pwa-192.png`, and `pwa-512.png` contain the provided logo for the header, share preview, and app manifest.

Seed products are examples, not real stock. Replace or remove them before launch. The sample image URLs are for local development; real product image management uses the public Supabase Storage bucket.
