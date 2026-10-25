import { createPublicSupabaseClient, hasPublicSupabaseConfig } from "@/lib/supabase/public";
import { DEFAULT_STORE_SETTINGS, type CatalogCategory, type CatalogImage, type CatalogProduct, type CatalogShop, type CatalogTag, type CatalogVariant, type StoreSettings } from "@/lib/catalog-types";
import { DEMO_PRODUCTS, DEMO_SHOPS } from "@/lib/demo-catalog";
import { normalizeWhatsAppNumber } from "@/lib/whatsapp";

type RawRecord = Record<string, unknown>;
type RawImage = { id: string; storage_path: string | null; source_url: string | null; alt_text: string; position: number };
type RawVariant = { id: string; size: string; color: string; stock: number };
type RawTagLink = { tag: { name: string; slug: string; kind: CatalogTag["kind"] } | null };
type RawShop = Record<string, unknown>;
type RawProduct = {
  id: string; name: string; slug: string; description: string; gender: CatalogProduct["gender"];
  sleeve_length: string | null; style: string | null; price: number | string; compare_at_price: number | string | null;
  is_featured: boolean; discreet_image: boolean; created_at: string;
  brand: { name: string; slug: string } | { name: string; slug: string }[] | null;
  category: CatalogCategory | CatalogCategory[] | null;
  subcategory: { name: string; slug: string } | { name: string; slug: string }[] | null;
  images: RawImage[]; variants: RawVariant[]; product_tags: RawTagLink[];
};

function one<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function normalizeShop(row: RawShop): CatalogShop {
  const externalUrl = (value: unknown) => {
    if (!value) return null;
    try {
      const url = new URL(String(value));
      return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
    } catch {
      return null;
    }
  };
  return {
    id: String(row.id),
    name: String(row.name || "Local shop"),
    slug: String(row.slug || ""),
    bio: String(row.bio || ""),
    location: String(row.location || ""),
    whatsappNumber: normalizeWhatsAppNumber(String(row.whatsapp_number || "")),
    logoUrl: externalUrl(row.logo_url),
    bannerUrl: externalUrl(row.banner_url),
    instagramUrl: externalUrl(row.instagram_url),
    snapchatUrl: externalUrl(row.snapchat_url),
    tiktokUrl: externalUrl(row.tiktok_url),
    facebookUrl: externalUrl(row.facebook_url),
    websiteUrl: externalUrl(row.website_url),
    acceptsMobileMoney: Boolean(row.accepts_mobile_money),
    acceptsCashOnDelivery: Boolean(row.accepts_cash_on_delivery),
    isFeatured: Boolean(row.is_featured),
  };
}

export async function getPublicShops(): Promise<CatalogShop[]> {
  if (!hasPublicSupabaseConfig()) return DEMO_SHOPS;
  try {
    const supabase = createPublicSupabaseClient();
    const { data, error } = await supabase.from("public_shop_profiles")
      .select("id,name,slug,bio,location,whatsapp_number,logo_url,banner_url,instagram_url,snapchat_url,tiktok_url,facebook_url,website_url,accepts_mobile_money,accepts_cash_on_delivery,is_featured")
      .order("is_featured", { ascending: false })
      .order("name", { ascending: true });
    if (error || !data || data.length === 0) {
      if (error) console.warn("Could not load public shop profiles; using demo shops fallback.", error);
      return DEMO_SHOPS;
    }
    return data.map((row) => normalizeShop(row as RawShop));
  } catch (error) {
    console.warn("Could not load public shop profiles; using demo shops fallback.", error);
    return DEMO_SHOPS;
  }
}

export async function getPublicShopBySlug(slug: string): Promise<CatalogShop | null> {
  if (!hasPublicSupabaseConfig()) {
    return DEMO_SHOPS.find((shop) => shop.slug === slug) ?? null;
  }
  try {
    const supabase = createPublicSupabaseClient();
    const { data, error } = await supabase.from("public_shop_profiles")
      .select("id,name,slug,bio,location,whatsapp_number,logo_url,banner_url,instagram_url,snapchat_url,tiktok_url,facebook_url,website_url,accepts_mobile_money,accepts_cash_on_delivery,is_featured")
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw error;
    if (data) return normalizeShop(data as RawShop);
    return DEMO_SHOPS.find((shop) => shop.slug === slug) ?? null;
  } catch (error) {
    console.warn("Could not load the requested public shop profile.", error);
    return DEMO_SHOPS.find((shop) => shop.slug === slug) ?? null;
  }
}

export async function getExpiredPublicShopBySlug(slug: string): Promise<{ name: string; slug: string } | null> {
  if (!hasPublicSupabaseConfig()) return null;
  try {
    const supabase = createPublicSupabaseClient();
    const { data, error } = await supabase.from("public_expired_shop_profiles")
      .select("name,slug")
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw error;
    return data ? { name: String(data.name), slug: String(data.slug) } : null;
  } catch (error) {
    console.warn("Could not load expired public shop status.", error);
    return null;
  }
}

function normalizeProduct(row: RawProduct, supabase: ReturnType<typeof createPublicSupabaseClient>, shop: CatalogShop | null): CatalogProduct {
  const images: CatalogImage[] = (row.images ?? [])
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((image) => ({
      id: image.id,
      url: image.storage_path ? supabase.storage.from("product-images").getPublicUrl(image.storage_path).data.publicUrl : image.source_url ?? "",
      altText: image.alt_text || row.name,
      position: image.position,
    }))
    .filter((image) => Boolean(image.url));

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? "",
    brand: one(row.brand),
    category: one(row.category) ?? { id: "", name: "Clothing", slug: "clothing", department: "clothing" },
    subcategory: one(row.subcategory),
    gender: row.gender,
    sleeveLength: row.sleeve_length,
    style: row.style,
    price: Number(row.price),
    compareAtPrice: row.compare_at_price === null ? null : Number(row.compare_at_price),
    images,
    variants: (row.variants ?? []).map((variant): CatalogVariant => ({
      id: variant.id,
      size: variant.size,
      color: variant.color,
      stock: variant.stock,
    })),
    tags: (row.product_tags ?? []).flatMap((link) => link.tag ? [link.tag] : []),
    isFeatured: row.is_featured,
    discreetImage: row.discreet_image,
    createdAt: row.created_at,
    shop,
  };
}

export async function getCatalogProducts(): Promise<CatalogProduct[]> {
  if (!hasPublicSupabaseConfig()) {
    console.warn("Supabase catalog settings are missing; catalog products are using demo fallback.");
    return DEMO_PRODUCTS;
  }

  try {
    const supabase = createPublicSupabaseClient();
    const { data, error } = await supabase
      .from("products")
      .select("id,name,slug,description,gender,sleeve_length,style,price,compare_at_price,is_featured,discreet_image,created_at,brand:brands(name,slug),category:categories(id,name,slug,department),subcategory:subcategories(name,slug),images:product_images(id,storage_path,source_url,alt_text,position),variants:product_variants(id,size,color,stock),product_tags(tag:tags(name,slug,kind))")
      .eq("is_published", true)
      .eq("is_hidden", false)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Could not load products from Supabase; using demo catalog fallback.", error);
      return DEMO_PRODUCTS;
    }
    const rows = (data ?? []) as unknown as RawProduct[];
    if (rows.length === 0) {
      return DEMO_PRODUCTS;
    }

    const assignments = rows.length
      ? await supabase.from("products").select("id,shop_id").in("id", rows.map((row) => row.id))
      : { data: [], error: null };
    if (assignments.error) {
      console.warn("Could not load optional shop assignments for catalog products.", assignments.error);
      return rows.map((row) => normalizeProduct(row, supabase, null));
    }

    const shopIds = [...new Set((assignments.data ?? []).map((row) => row.shop_id).filter(Boolean))];
    const shops = shopIds.length
      ? await supabase.from("public_shop_profiles").select("id,name,slug,bio,location,whatsapp_number,logo_url,banner_url,instagram_url,snapchat_url,tiktok_url,facebook_url,website_url,accepts_mobile_money,accepts_cash_on_delivery,is_featured").in("id", shopIds)
      : { data: [], error: null };
    if (shops.error) {
      console.warn("Could not load optional public shop profiles for catalog products.", shops.error);
      return rows.map((row) => normalizeProduct(row, supabase, null));
    }

    const shopsById = new Map((shops.data ?? []).map((row) => {
      const shop = normalizeShop(row as RawShop);
      return [shop.id, shop] as const;
    }));
    const shopsByProductId = new Map((assignments.data ?? []).map((assignment) => [
      assignment.id,
      shopsById.get(assignment.shop_id) ?? null,
    ] as const));
    return rows.map((row) => normalizeProduct(row, supabase, shopsByProductId.get(row.id) ?? null));
  } catch (error) {
    console.warn("Could not load the public Charwin catalog; using demo catalog fallback.", error);
    return DEMO_PRODUCTS;
  }
}

export async function getStoreSettings(): Promise<StoreSettings> {
  const fallback: StoreSettings = {
    ...DEFAULT_STORE_SETTINGS,
    shopName: process.env.NEXT_PUBLIC_SHOP_NAME || DEFAULT_STORE_SETTINGS.shopName,
    whatsappNumber: normalizeWhatsAppNumber(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER),
    currency: process.env.NEXT_PUBLIC_SHOP_CURRENCY || DEFAULT_STORE_SETTINGS.currency,
  };
  if (!hasPublicSupabaseConfig()) return fallback;

  try {
    const supabase = createPublicSupabaseClient();
    const { data, error } = await supabase
      .from("site_settings")
      .select("shop_name,whatsapp_number,currency,announcement_banner,featured_season_tag:tags!site_settings_featured_season_tag_id_fkey(name)")
      .eq("id", true)
      .maybeSingle();
    if (error) throw error;
    if (!data) return fallback;
    const raw = data as unknown as RawRecord;
    const season = one(raw.featured_season_tag as { name: string } | { name: string }[] | null);
    return {
      shopName: String(raw.shop_name || fallback.shopName),
      whatsappNumber: normalizeWhatsAppNumber(String(raw.whatsapp_number || fallback.whatsappNumber)),
      currency: String(raw.currency || fallback.currency),
      announcementBanner: raw.announcement_banner ? String(raw.announcement_banner) : null,
      featuredSeasonTag: season?.name ?? fallback.featuredSeasonTag,
    };
  } catch (error) {
    console.warn("Could not load Charwin site settings; using public defaults.", error);
    return fallback;
  }
}

export async function getCatalogData() {
  const [products, settings, shops] = await Promise.all([getCatalogProducts(), getStoreSettings(), getPublicShops()]);
  return { products, settings, shops };
}
