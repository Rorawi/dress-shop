-- Starter catalog for local development. These example products are not real inventory.

insert into public.categories (name, slug, department, sort_order)
values
  ('Clothing', 'clothing', 'clothing', 0),
  ('Underwear', 'underwear', 'underwear', 1)
on conflict (slug) do update set
  name = excluded.name,
  department = excluded.department,
  sort_order = excluded.sort_order,
  is_active = true;

insert into public.subcategories (category_id, name, slug, sort_order)
select c.id, item.name, item.slug, item.sort_order
from (values
  ('clothing', 'T-shirts', 't-shirts', 0),
  ('clothing', 'Shirts', 'shirts', 1),
  ('clothing', 'Matching sets', 'matching-sets', 2),
  ('clothing', 'Dresses', 'dresses', 3),
  ('clothing', 'Polos', 'polos', 4),
  ('clothing', 'Trousers', 'trousers', 5),
  ('clothing', 'Shorts', 'shorts', 6),
  ('clothing', 'Jackets', 'jackets', 7),
  ('underwear', 'Boxers', 'boxers', 0),
  ('underwear', 'Singlets', 'singlets', 1),
  ('underwear', 'Briefs', 'briefs', 2),
  ('underwear', 'Lingerie', 'lingerie', 3),
  ('underwear', 'Bras', 'bras', 4),
  ('underwear', 'Panties', 'panties', 5),
  ('underwear', 'Sleepwear', 'sleepwear', 6)
) as item(category_slug, name, slug, sort_order)
join public.categories c on c.slug = item.category_slug
on conflict (category_id, slug) do update set
  name = excluded.name,
  sort_order = excluded.sort_order,
  is_active = true;

insert into public.brands (name, slug)
values
  ('Charwin Edit', 'charwin-edit'),
  ('Lacoste', 'lacoste'),
  ('Everyday', 'everyday')
on conflict (slug) do update set name = excluded.name;

insert into public.tags (name, slug, kind, sort_order)
values
  ('New Arrival', 'new-arrival', 'collection', 0),
  ('Popular', 'popular', 'collection', 1),
  ('Christmas', 'christmas', 'seasonal', 2),
  ('Everyday', 'everyday', 'general', 3),
  ('Thrift Finds', 'thrift-finds', 'collection', 4)
on conflict (slug) do update set
  name = excluded.name,
  kind = excluded.kind,
  sort_order = excluded.sort_order;

with sample_products (
  name, slug, description, brand_slug, category_slug, subcategory_slug,
  gender, sleeve_length, style, price, compare_at_price, discreet_image, is_featured
) as (
  values
    ('Aster Floral Midi Dress', 'aster-floral-midi-dress', 'A breezy floral midi for brunch, birthdays and bright days out.', 'charwin-edit', 'clothing', 'dresses', 'women', 'short', 'romantic', 285.00, 340.00, false, true),
    ('Amethyst Wrap Maxi Dress', 'amethyst-wrap-maxi-dress', 'A flowing wrap silhouette in a rich violet print with an adjustable waist.', 'charwin-edit', 'clothing', 'dresses', 'women', 'sleeveless', 'occasion', 420.00, 480.00, false, true),
    ('Soft Linen Shirt', 'soft-linen-shirt', 'A relaxed linen button-up designed for warm weather and easy layering.', 'everyday', 'clothing', 'shirts', 'unisex', 'long', 'casual', 245.00, null, false, false),
    ('Classic Piqué Polo', 'classic-pique-polo', 'A clean cotton piqué polo with a ribbed collar and timeless fit.', 'lacoste', 'clothing', 'polos', 'men', 'short', 'classic', 680.00, null, false, false),
    ('Everyday Cotton T-shirt', 'everyday-cotton-t-shirt', 'A soft midweight cotton tee with a comfortable everyday cut.', 'everyday', 'clothing', 't-shirts', 'unisex', 'short', 'casual', 155.00, null, false, false),
    ('Weekend Tailored Shorts', 'weekend-tailored-shorts', 'Smart, breathable shorts with a relaxed leg and adjustable waist.', 'charwin-edit', 'clothing', 'shorts', 'men', 'none', 'casual', 210.00, 250.00, false, false),
    ('Straight Leg Trousers', 'straight-leg-trousers', 'Versatile straight leg trousers with a clean finish for work or weekends.', 'everyday', 'clothing', 'trousers', 'women', 'none', 'smart casual', 325.00, null, false, false),
    ('Weekend Layer Jacket', 'weekend-layer-jacket', 'A light outer layer with practical pockets and an easy relaxed shape.', 'charwin-edit', 'clothing', 'jackets', 'unisex', 'long', 'casual', 520.00, 590.00, false, true),
    ('Cotton Stretch Boxer Briefs', 'cotton-stretch-boxer-briefs', 'A breathable cotton stretch boxer brief with a soft, supportive waistband.', 'everyday', 'underwear', 'boxers', 'men', 'none', 'everyday', 120.00, null, true, false),
    ('Ribbed Cotton Singlet', 'ribbed-cotton-singlet', 'A soft ribbed cotton singlet for layering, lounging or warm days.', 'everyday', 'underwear', 'singlets', 'unisex', 'sleeveless', 'everyday', 80.00, null, true, false),
    ('Everyday Cotton Briefs', 'everyday-cotton-briefs', 'A comfortable cotton brief with a smooth finish and gentle stretch.', 'everyday', 'underwear', 'briefs', 'women', 'none', 'everyday', 95.00, null, true, false),
    ('Satin Floral Sleep Set', 'satin-floral-sleep-set', 'A matching satin sleep set with a soft floral print and relaxed fit.', 'charwin-edit', 'underwear', 'sleepwear', 'women', 'short', 'loungewear', 240.00, 285.00, true, true)
)
insert into public.products (
  name, slug, description, brand_id, category_id, subcategory_id,
  gender, sleeve_length, style, price, compare_at_price, discreet_image, is_featured, is_published
)
select
  sample.name,
  sample.slug,
  sample.description,
  b.id,
  c.id,
  sc.id,
  sample.gender,
  sample.sleeve_length,
  sample.style,
  sample.price,
  sample.compare_at_price,
  sample.discreet_image,
  sample.is_featured,
  true
from sample_products sample
join public.brands b on b.slug = sample.brand_slug
join public.categories c on c.slug = sample.category_slug
left join public.subcategories sc on sc.category_id = c.id and sc.slug = sample.subcategory_slug
on conflict (slug) do update set
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
  is_published = excluded.is_published;

with image_seed (product_slug, position, source_url, alt_text) as (
  values
    ('aster-floral-midi-dress', 0, 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1000&q=85', 'Aster Floral Midi Dress'),
    ('aster-floral-midi-dress', 1, 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&w=1000&q=85', 'Aster Floral Midi Dress, alternate view'),
    ('amethyst-wrap-maxi-dress', 0, 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=1000&q=85', 'Amethyst Wrap Maxi Dress'),
    ('amethyst-wrap-maxi-dress', 1, 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=1000&q=85', 'Amethyst Wrap Maxi Dress, alternate view'),
    ('soft-linen-shirt', 0, 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=1000&q=85', 'Soft Linen Shirt'),
    ('soft-linen-shirt', 1, 'https://images.unsplash.com/photo-1603252110481-7ba873bf42ab?auto=format&fit=crop&w=1000&q=85', 'Soft Linen Shirt, alternate view'),
    ('classic-pique-polo', 0, 'https://images.unsplash.com/photo-1625910513413-5fc45e21c8d4?auto=format&fit=crop&w=1000&q=85', 'Classic Piqué Polo'),
    ('classic-pique-polo', 1, 'https://images.unsplash.com/photo-1627225924765-552d49cf47ad?auto=format&fit=crop&w=1000&q=85', 'Classic Piqué Polo, alternate view'),
    ('everyday-cotton-t-shirt', 0, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1000&q=85', 'Everyday Cotton T-shirt'),
    ('everyday-cotton-t-shirt', 1, 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1000&q=85', 'Everyday Cotton T-shirt, alternate view'),
    ('weekend-tailored-shorts', 0, 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=1000&q=85', 'Weekend Tailored Shorts'),
    ('weekend-tailored-shorts', 1, 'https://images.unsplash.com/photo-1562183241-b937e95585b6?auto=format&fit=crop&w=1000&q=85', 'Weekend Tailored Shorts, alternate view'),
    ('straight-leg-trousers', 0, 'https://images.unsplash.com/photo-1506629905607-d9a9d4fca6bb?auto=format&fit=crop&w=1000&q=85', 'Straight Leg Trousers'),
    ('straight-leg-trousers', 1, 'https://images.unsplash.com/photo-1551854838-212c50b4c184?auto=format&fit=crop&w=1000&q=85', 'Straight Leg Trousers, alternate view'),
    ('weekend-layer-jacket', 0, 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1000&q=85', 'Weekend Layer Jacket'),
    ('weekend-layer-jacket', 1, 'https://images.unsplash.com/photo-1544923246-77307dd654cb?auto=format&fit=crop&w=1000&q=85', 'Weekend Layer Jacket, alternate view'),
    ('cotton-stretch-boxer-briefs', 0, 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=1000&q=85', 'Cotton Stretch Boxer Briefs'),
    ('cotton-stretch-boxer-briefs', 1, 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=1000&q=85', 'Cotton Stretch Boxer Briefs, alternate view'),
    ('ribbed-cotton-singlet', 0, 'https://images.unsplash.com/photo-1627225924765-552d49cf47ad?auto=format&fit=crop&w=1000&q=85', 'Ribbed Cotton Singlet'),
    ('ribbed-cotton-singlet', 1, 'https://images.unsplash.com/photo-1618354691229-88d47f285158?auto=format&fit=crop&w=1000&q=85', 'Ribbed Cotton Singlet, alternate view'),
    ('everyday-cotton-briefs', 0, 'https://images.unsplash.com/photo-1583743814966-8936f37f4678?auto=format&fit=crop&w=1000&q=85', 'Everyday Cotton Briefs'),
    ('everyday-cotton-briefs', 1, 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=1000&q=85', 'Everyday Cotton Briefs, alternate view'),
    ('satin-floral-sleep-set', 0, 'https://images.unsplash.com/photo-1618354691229-88d47f285158?auto=format&fit=crop&w=1000&q=85', 'Satin Floral Sleep Set'),
    ('satin-floral-sleep-set', 1, 'https://images.unsplash.com/photo-1583743814966-8936f37f4678?auto=format&fit=crop&w=1000&q=85', 'Satin Floral Sleep Set, alternate view')
)
insert into public.product_images (product_id, source_url, alt_text, position, is_primary)
select p.id, image.source_url, image.alt_text, image.position, image.position = 0
from image_seed image
join public.products p on p.slug = image.product_slug
where not exists (
  select 1 from public.product_images existing
  where existing.product_id = p.id and existing.position = image.position
);

with variant_seed (product_slug, color, sizes, stock) as (
  values
    ('aster-floral-midi-dress', 'Lilac Floral', array['S', 'M', 'L', 'XL'], 4),
    ('amethyst-wrap-maxi-dress', 'Violet', array['S', 'M', 'L', 'XL'], 3),
    ('soft-linen-shirt', 'Natural', array['S', 'M', 'L', 'XL'], 5),
    ('classic-pique-polo', 'White', array['S', 'M', 'L', 'XL', 'XXL'], 2),
    ('everyday-cotton-t-shirt', 'Black', array['S', 'M', 'L', 'XL', 'XXL'], 8),
    ('weekend-tailored-shorts', 'Navy', array['S', 'M', 'L', 'XL'], 3),
    ('straight-leg-trousers', 'Black', array['S', 'M', 'L', 'XL'], 2),
    ('weekend-layer-jacket', 'Olive', array['S', 'M', 'L', 'XL'], 2),
    ('cotton-stretch-boxer-briefs', 'Black', array['M', 'L', 'XL', 'XXL'], 6),
    ('ribbed-cotton-singlet', 'White', array['S', 'M', 'L', 'XL'], 5),
    ('everyday-cotton-briefs', 'Black', array['S', 'M', 'L', 'XL'], 7),
    ('satin-floral-sleep-set', 'Blush Floral', array['S', 'M', 'L', 'XL'], 2)
)
insert into public.product_variants (product_id, size, color, stock)
select p.id, sizes.size, variant_seed.color, variant_seed.stock
from variant_seed
join public.products p on p.slug = variant_seed.product_slug
cross join lateral unnest(variant_seed.sizes) as sizes(size)
on conflict (product_id, size, color) do update set stock = excluded.stock;

with assignments (product_slug, tag_slug) as (
  values
    ('aster-floral-midi-dress', 'new-arrival'),
    ('aster-floral-midi-dress', 'popular'),
    ('amethyst-wrap-maxi-dress', 'new-arrival'),
    ('amethyst-wrap-maxi-dress', 'christmas'),
    ('classic-pique-polo', 'popular'),
    ('everyday-cotton-t-shirt', 'popular'),
    ('weekend-layer-jacket', 'christmas'),
    ('cotton-stretch-boxer-briefs', 'popular'),
    ('satin-floral-sleep-set', 'new-arrival'),
    ('satin-floral-sleep-set', 'christmas')
)
insert into public.product_tags (product_id, tag_id)
select p.id, t.id
from assignments a
join public.products p on p.slug = a.product_slug
join public.tags t on t.slug = a.tag_slug
on conflict do nothing;

insert into public.site_settings (
  id, shop_name, whatsapp_number, currency, featured_season_tag_id, announcement_banner
)
values (
  true,
  'Charwin Stores',
  null,
  'GHS',
  (select id from public.tags where slug = 'christmas'),
  null
)
on conflict (id) do update set
  shop_name = excluded.shop_name,
  currency = excluded.currency,
  featured_season_tag_id = excluded.featured_season_tag_id;
