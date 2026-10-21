import { createPublicSupabaseClient, hasPublicSupabaseConfig } from "@/lib/supabase/public";
import { DEFAULT_STORE_SETTINGS, type CatalogCategory, type CatalogImage, type CatalogProduct, type CatalogTag, type CatalogVariant, type StoreSettings } from "@/lib/catalog-types";
import { normalizeWhatsAppNumber } from "@/lib/whatsapp";

type RawRecord = Record<string, unknown>;
type RawImage = { id: string; storage_path: string | null; source_url: string | null; alt_text: string; position: number };
type RawVariant = { id: string; size: string; color: string; stock: number };
type RawTagLink = { tag: { name: string; slug: string; kind: CatalogTag["kind"] } | null };
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

function isDemoImage(url: string) {
  try {
    return new URL(url).hostname === "images.unsplash.com";
  } catch {
    return false;
  }
}

function normalizeProduct(row: RawProduct, supabase: ReturnType<typeof createPublicSupabaseClient>): CatalogProduct {
  const images: CatalogImage[] = (row.images ?? [])
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((image) => ({
      id: image.id,
      url: image.storage_path ? supabase.storage.from("product-images").getPublicUrl(image.storage_path).data.publicUrl : image.source_url ?? "",
      altText: image.alt_text || row.name,
      position: image.position,
    }))
    .filter((image) => image.url && !isDemoImage(image.url));

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
  };
}

export async function getCatalogProducts(): Promise<CatalogProduct[]> {
  if (!hasPublicSupabaseConfig()) {
    console.warn("Supabase catalog settings are missing; catalog products are unavailable.");
    return [];
  }

  try {
    const supabase = createPublicSupabaseClient();
    const { data, error } = await supabase
      .from("products")
      .select("id,name,slug,description,gender,sleeve_length,style,price,compare_at_price,is_featured,discreet_image,created_at,brand:brands(name,slug),category:categories(id,name,slug,department),subcategory:subcategories(name,slug),images:product_images(id,storage_path,source_url,alt_text,position),variants:product_variants(id,size,color,stock),product_tags(tag:tags(name,slug,kind))")
      .eq("is_published", true)
      .eq("is_hidden", false)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return ((data ?? []) as unknown as RawProduct[]).map((row) => normalizeProduct(row, supabase));
  } catch (error) {
    console.warn("Could not load the public Charwin catalog; showing the empty catalog fallback.", error);
    return [];
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
  const [products, settings] = await Promise.all([getCatalogProducts(), getStoreSettings()]);
  return { products, settings };
}
