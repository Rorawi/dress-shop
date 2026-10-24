-- Local development data only. Shops, products, and phone numbers below are
-- fictional examples; WhatsApp and MoMo numbers are intentionally unset.

insert into charwin_store.categories (name, slug, department, sort_order)
values
  ('Clothing', 'clothing', 'clothing', 0),
  ('Underwear', 'underwear', 'underwear', 1),
  ('Bags', 'bags', 'bags', 2),
  ('Shoes', 'shoes', 'shoes', 3)
on conflict (slug) do update set
  name = excluded.name,
  department = excluded.department,
  sort_order = excluded.sort_order,
  is_active = true;

insert into charwin_store.subcategories (category_id, name, slug, sort_order)
select category.id, item.name, item.slug, item.sort_order
from (values
  ('clothing', 'Dresses', 'dresses', 0),
  ('clothing', 'Shirts', 'shirts', 1),
  ('clothing', 'Polos', 'polos', 2),
  ('clothing', 'T-shirts', 't-shirts', 3),
  ('clothing', 'Trousers', 'trousers', 4),
  ('clothing', 'Shorts', 'shorts', 5),
  ('clothing', 'Jackets', 'jackets', 6),
  ('underwear', 'Boxers', 'boxers', 0),
  ('underwear', 'Singlets', 'singlets', 1),
  ('underwear', 'Briefs', 'briefs', 2),
  ('underwear', 'Lingerie', 'lingerie', 3),
  ('underwear', 'Bras', 'bras', 4),
  ('underwear', 'Panties', 'panties', 5),
  ('underwear', 'Sleepwear', 'sleepwear', 6),
  ('bags', 'Handbags', 'handbags', 0),
  ('bags', 'Totes', 'totes', 1),
  ('shoes', 'Sneakers', 'sneakers', 0),
  ('shoes', 'Sandals', 'sandals', 1)
) as item(category_slug, name, slug, sort_order)
join charwin_store.categories category on category.slug = item.category_slug
on conflict (category_id, slug) do update set
  name = excluded.name,
  sort_order = excluded.sort_order,
  is_active = true;

insert into charwin_store.shops (
  name, slug, bio, location, whatsapp_number, logo_url, banner_url,
  instagram_url, verification_status, status, is_featured, is_trusted,
  subscription_status, trial_ends_at, active_until
)
values
  (
    'Queen''s Collection', 'queens-collection',
    'Easy-to-wear dresses and polished everyday pieces, chosen for confidence and comfort.',
    'Accra, Greater Accra', null, null, null, null,
    'approved', 'active', true, true, 'active', null, now() + interval '5 years'
  ),
  (
    'Ahenfie Streetwear', 'ahenfie-streetwear',
    'Relaxed Ghana-inspired streetwear for campus, weekends, and the city.',
    'Kumasi, Ashanti Region', null, null, null, null,
    'approved', 'active', true, false, 'active', null, now() + interval '5 years'
  ),
  (
    'Kasa Intimates', 'kasa-intimates',
    'Comfort-first basics and soft sleepwear for everyday routines.',
    'Tema, Greater Accra', null, null, null, null,
    'approved', 'active', false, false, 'active', null, now() + interval '5 years'
  )
on conflict (slug) do update set
  name = excluded.name,
  bio = excluded.bio,
  location = excluded.location,
  verification_status = excluded.verification_status,
  status = excluded.status,
  is_featured = excluded.is_featured,
  is_trusted = excluded.is_trusted,
  subscription_status = excluded.subscription_status,
  active_until = excluded.active_until;

insert into charwin_store.brands (name, slug)
values
  ('Charwin Edit', 'charwin-edit'),
  ('Everyday', 'everyday'),
  ('Ahenfie Label', 'ahenfie-label'),
  ('Kasa Basics', 'kasa-basics'),
  ('Lacoste', 'lacoste')
on conflict (slug) do update set name = excluded.name;

insert into charwin_store.tags (name, slug, kind, sort_order)
values
  ('New Arrival', 'new-arrival', 'collection', 0),
  ('Popular', 'popular', 'collection', 1),
  ('Christmas', 'christmas', 'seasonal', 2),
  ('Everyday', 'everyday', 'general', 3),
  ('Ghana Made', 'ghana-made', 'collection', 4)
on conflict (slug) do update set
  name = excluded.name,
  kind = excluded.kind,
  sort_order = excluded.sort_order;

with sample_products (
  shop_slug, name, slug, description, brand_slug, category_slug, subcategory_slug,
  gender, sleeve_length, style, price, compare_at_price, discreet_image, is_featured
) as (
  values
    ('queens-collection', 'Aster Floral Midi Dress', 'aster-floral-midi-dress', 'A breezy floral midi for brunch, birthdays, and bright days out.', 'charwin-edit', 'clothing', 'dresses', 'women', 'short', 'romantic', 285.00, 340.00, false, true),
    ('queens-collection', 'Amethyst Wrap Maxi Dress', 'amethyst-wrap-maxi-dress', 'A flowing wrap silhouette in a rich violet print with an adjustable waist.', 'charwin-edit', 'clothing', 'dresses', 'women', 'sleeveless', 'occasion', 420.00, 480.00, false, true),
    ('queens-collection', 'Soft Linen Shirt', 'soft-linen-shirt', 'A relaxed linen button-up designed for warm weather and easy layering.', 'everyday', 'clothing', 'shirts', 'unisex', 'long', 'casual', 245.00, null, false, false),
    ('queens-collection', 'Straight Leg Trousers', 'straight-leg-trousers', 'Versatile straight-leg trousers with a clean finish for work or weekends.', 'everyday', 'clothing', 'trousers', 'women', 'none', 'smart casual', 325.00, null, false, false),
    ('queens-collection', 'Cotton Bralette Set', 'cotton-bralette-set', 'A soft cotton bralette and brief set with gentle stretch and a smooth finish.', 'kasa-basics', 'underwear', 'bras', 'women', 'none', 'everyday', 185.00, null, true, false),
    ('ahenfie-streetwear', 'Classic Piqué Polo', 'classic-pique-polo', 'A clean cotton piqué polo with a ribbed collar and timeless fit.', 'lacoste', 'clothing', 'polos', 'men', 'short', 'classic', 680.00, null, false, false),
    ('ahenfie-streetwear', 'Everyday Cotton T-shirt', 'everyday-cotton-t-shirt', 'A soft midweight cotton tee with a comfortable everyday cut.', 'everyday', 'clothing', 't-shirts', 'unisex', 'short', 'casual', 155.00, null, false, false),
    ('ahenfie-streetwear', 'Weekend Tailored Shorts', 'weekend-tailored-shorts', 'Smart, breathable shorts with a relaxed leg and adjustable waist.', 'ahenfie-label', 'clothing', 'shorts', 'men', 'none', 'casual', 210.00, 250.00, false, false),
    ('ahenfie-streetwear', 'Weekend Layer Jacket', 'weekend-layer-jacket', 'A light outer layer with practical pockets and an easy relaxed shape.', 'ahenfie-label', 'clothing', 'jackets', 'unisex', 'long', 'casual', 520.00, 590.00, false, true),
    ('ahenfie-streetwear', 'Kente Trim Shirt', 'kente-trim-shirt', 'A crisp cotton shirt with a subtle woven accent at the collar and cuffs.', 'ahenfie-label', 'clothing', 'shirts', 'men', 'short', 'smart casual', 310.00, null, false, false),
    ('kasa-intimates', 'Cotton Stretch Boxer Briefs', 'cotton-stretch-boxer-briefs', 'Breathable cotton-stretch boxer briefs with a soft, supportive waistband.', 'kasa-basics', 'underwear', 'boxers', 'men', 'none', 'everyday', 120.00, null, true, false),
    ('kasa-intimates', 'Ribbed Cotton Singlet', 'ribbed-cotton-singlet', 'A soft ribbed cotton singlet for layering, lounging, or warm days.', 'kasa-basics', 'underwear', 'singlets', 'unisex', 'sleeveless', 'everyday', 80.00, null, true, false),
    ('kasa-intimates', 'Everyday Cotton Briefs', 'everyday-cotton-briefs', 'A comfortable cotton brief with a smooth finish and gentle stretch.', 'kasa-basics', 'underwear', 'briefs', 'women', 'none', 'everyday', 95.00, null, true, false),
    ('kasa-intimates', 'Satin Floral Sleep Set', 'satin-floral-sleep-set', 'A matching satin sleep set with a soft floral print and relaxed fit.', 'kasa-basics', 'underwear', 'sleepwear', 'women', 'short', 'loungewear', 240.00, 285.00, true, true),
    ('kasa-intimates', 'Soft Seamless Briefs', 'soft-seamless-briefs', 'A smooth seamless everyday brief designed to sit comfortably under clothing.', 'kasa-basics', 'underwear', 'panties', 'women', 'none', 'everyday', 105.00, null, true, false)
)
insert into charwin_store.products (
  shop_id, name, slug, description, brand_id, category_id, subcategory_id,
  gender, sleeve_length, style, price, compare_at_price, discreet_image,
  is_featured, is_published, moderation_status
)
select
  shop.id,
  sample.name,
  sample.slug,
  sample.description,
  brand.id,
  category.id,
  subcategory.id,
  sample.gender,
  sample.sleeve_length,
  sample.style,
  sample.price,
  sample.compare_at_price,
  sample.discreet_image,
  sample.is_featured,
  true,
  'approved'
from sample_products sample
join charwin_store.shops shop on shop.slug = sample.shop_slug
join charwin_store.brands brand on brand.slug = sample.brand_slug
join charwin_store.categories category on category.slug = sample.category_slug
left join charwin_store.subcategories subcategory
  on subcategory.category_id = category.id and subcategory.slug = sample.subcategory_slug
on conflict (slug) do update set
  shop_id = excluded.shop_id,
  name = excluded.name,
  description = excluded.description,
  brand_id = excluded.brand_id,
  category_id = excluded.category_id,
  subcategory_id = excluded.subcategory_id,
  gender = excluded.gender,
  sleeve_length = excluded.sleeve_length,
  style = excluded.style,
  price = excluded.price,
  compare_at_price = excluded.compare_at_price,
  discreet_image = excluded.discreet_image,
  is_featured = excluded.is_featured,
  is_published = excluded.is_published,
  moderation_status = excluded.moderation_status;

with image_seed (product_slug, position, source_url, alt_text) as (
  values
    ('aster-floral-midi-dress', 0, 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1000&q=85', 'Aster floral midi dress'),
    ('amethyst-wrap-maxi-dress', 0, 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=1000&q=85', 'Amethyst wrap maxi dress'),
    ('soft-linen-shirt', 0, 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=1000&q=85', 'Soft linen shirt'),
    ('straight-leg-trousers', 0, 'https://images.unsplash.com/photo-1506629905607-d9a9d4fca6bb?auto=format&fit=crop&w=1000&q=85', 'Straight leg trousers'),
    ('cotton-bralette-set', 0, 'https://images.unsplash.com/photo-1566206091558-7f218b696731?auto=format&fit=crop&w=1000&q=85', 'Cotton bralette set'),
    ('classic-pique-polo', 0, 'https://images.unsplash.com/photo-1625910513413-5fc45e21c8d4?auto=format&fit=crop&w=1000&q=85', 'Classic piqué polo'),
    ('everyday-cotton-t-shirt', 0, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1000&q=85', 'Everyday cotton T-shirt'),
    ('weekend-tailored-shorts', 0, 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=1000&q=85', 'Weekend tailored shorts'),
    ('weekend-layer-jacket', 0, 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1000&q=85', 'Weekend layer jacket'),
    ('kente-trim-shirt', 0, 'https://images.unsplash.com/photo-1603252110481-7ba873bf42ab?auto=format&fit=crop&w=1000&q=85', 'Kente trim shirt'),
    ('cotton-stretch-boxer-briefs', 0, 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=1000&q=85', 'Cotton stretch boxer briefs'),
    ('ribbed-cotton-singlet', 0, 'https://images.unsplash.com/photo-1627225924765-552d49cf47ad?auto=format&fit=crop&w=1000&q=85', 'Ribbed cotton singlet'),
    ('everyday-cotton-briefs', 0, 'https://images.unsplash.com/photo-1583743814966-8936f37f4678?auto=format&fit=crop&w=1000&q=85', 'Everyday cotton briefs'),
    ('satin-floral-sleep-set', 0, 'https://images.unsplash.com/photo-1618354691229-88d47f285158?auto=format&fit=crop&w=1000&q=85', 'Satin floral sleep set'),
    ('soft-seamless-briefs', 0, 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=1000&q=85', 'Soft seamless briefs')
)
insert into charwin_store.product_images (product_id, source_url, alt_text, position, is_primary)
select product.id, image.source_url, image.alt_text, image.position, true
from image_seed image
join charwin_store.products product on product.slug = image.product_slug
where not exists (
  select 1 from charwin_store.product_images existing
  where existing.product_id = product.id and existing.position = image.position
);

with variant_seed (product_slug, color, sizes, stock) as (
  values
    ('aster-floral-midi-dress', 'Lilac Floral', array['S', 'M', 'L', 'XL'], 4),
    ('amethyst-wrap-maxi-dress', 'Violet', array['S', 'M', 'L', 'XL'], 3),
    ('soft-linen-shirt', 'Natural', array['S', 'M', 'L', 'XL'], 5),
    ('straight-leg-trousers', 'Black', array['S', 'M', 'L', 'XL'], 2),
    ('cotton-bralette-set', 'Nude', array['S', 'M', 'L', 'XL'], 3),
    ('classic-pique-polo', 'White', array['S', 'M', 'L', 'XL', 'XXL'], 2),
    ('everyday-cotton-t-shirt', 'Black', array['S', 'M', 'L', 'XL', 'XXL'], 8),
    ('weekend-tailored-shorts', 'Navy', array['S', 'M', 'L', 'XL'], 3),
    ('weekend-layer-jacket', 'Olive', array['S', 'M', 'L', 'XL'], 2),
    ('kente-trim-shirt', 'Cream', array['S', 'M', 'L', 'XL'], 4),
    ('cotton-stretch-boxer-briefs', 'Black', array['M', 'L', 'XL', 'XXL'], 6),
    ('ribbed-cotton-singlet', 'White', array['S', 'M', 'L', 'XL'], 5),
    ('everyday-cotton-briefs', 'Black', array['S', 'M', 'L', 'XL'], 7),
    ('satin-floral-sleep-set', 'Blush Floral', array['S', 'M', 'L', 'XL'], 2),
    ('soft-seamless-briefs', 'Mocha', array['S', 'M', 'L', 'XL'], 5)
)
insert into charwin_store.product_variants (product_id, size, color, stock)
select product.id, sizes.size, variant_seed.color, variant_seed.stock
from variant_seed
join charwin_store.products product on product.slug = variant_seed.product_slug
cross join lateral unnest(variant_seed.sizes) as sizes(size)
on conflict (product_id, size, color) do update set stock = excluded.stock;

with assignments (product_slug, tag_slug) as (
  values
    ('aster-floral-midi-dress', 'new-arrival'),
    ('aster-floral-midi-dress', 'popular'),
    ('amethyst-wrap-maxi-dress', 'new-arrival'),
    ('amethyst-wrap-maxi-dress', 'christmas'),
    ('everyday-cotton-t-shirt', 'popular'),
    ('weekend-layer-jacket', 'ghana-made'),
    ('weekend-layer-jacket', 'christmas'),
    ('cotton-stretch-boxer-briefs', 'popular'),
    ('satin-floral-sleep-set', 'new-arrival'),
    ('satin-floral-sleep-set', 'christmas'),
    ('kente-trim-shirt', 'ghana-made'),
    ('soft-seamless-briefs', 'everyday')
)
insert into charwin_store.product_tags (product_id, tag_id)
select product.id, tag.id
from assignments assignment
join charwin_store.products product on product.slug = assignment.product_slug
join charwin_store.tags tag on tag.slug = assignment.tag_slug
on conflict do nothing;

insert into charwin_store.site_settings (
  id, shop_name, currency, featured_season_tag_id, announcement_banner,
  auto_approval_mode, subscription_grace_days, expiry_notice_days
)
values (
  true,
  'Charwin Stores',
  'GHS',
  (select id from charwin_store.tags where slug = 'christmas'),
  null,
  'suggestions_only',
  7,
  array[14, 7, 1]
)
on conflict (id) do update set
  shop_name = excluded.shop_name,
  currency = excluded.currency,
  featured_season_tag_id = excluded.featured_season_tag_id,
  auto_approval_mode = excluded.auto_approval_mode,
  subscription_grace_days = excluded.subscription_grace_days,
  expiry_notice_days = excluded.expiry_notice_days;
