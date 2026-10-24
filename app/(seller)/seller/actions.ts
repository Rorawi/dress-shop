"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireShopMember } from "@/lib/supabase/admin";

export type SellerAuthState = { error?: string };

const clean = (value: FormDataEntryValue | null, max = 180) => String(value ?? "").trim().slice(0, max);
const slugify = (value: string) => value.normalize("NFKD").toLowerCase().trim().replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function registerSeller(_previous: SellerAuthState, formData: FormData): Promise<SellerAuthState> {
  const name = clean(formData.get("shop_name"));
  const ownerName = clean(formData.get("owner_name"));
  const phone = clean(formData.get("phone"), 30);
  const whatsapp = clean(formData.get("whatsapp_number"), 15).replace(/\D/g, "");
  const location = clean(formData.get("location"), 120);
  const social = clean(formData.get("verification_social_url"), 300);
  const momoNumber = clean(formData.get("momo_number"), 15).replace(/\D/g, "");
  const momoNetwork = clean(formData.get("momo_network"), 20);
  const momoAccountName = clean(formData.get("momo_account_name"), 100);
  const email = clean(formData.get("email"), 250).toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!name || !ownerName || !phone || whatsapp.length < 8 || whatsapp.length > 15 || !location || !email || password.length < 10 || formData.get("accept_terms") !== "on" || !social) {
    return { error: "Complete the required shop and verification details, use a password with at least 10 characters, and accept the seller terms." };
  }
  if (social) {
    try {
      const parsed = new URL(social);
      if (!(["http:", "https:"].includes(parsed.protocol))) throw new Error("invalid");
    } catch {
      return { error: "Enter a complete Instagram, TikTok, website or other verification link." };
    }
  }

  let supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  try { supabase = await createSupabaseServerClient(); }
  catch { return { error: "Supabase is not configured yet. Check the project URL and publishable key." }; }

  let service: ReturnType<typeof createServiceRoleSupabaseClient>;
  try { service = createServiceRoleSupabaseClient(); }
  catch { return { error: "Seller registration is not ready yet. The server-side Supabase key must be configured." }; }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: ownerName } },
  });
  if (error || !data.user) return { error: error?.message ?? "The account could not be created." };
  if (!data.session && data.user.identities?.length === 0) return { error: "An account already uses this email. Sign in to the seller studio instead." };

  try {
    const baseSlug = slugify(name).slice(0, 70) || "shop";
    const shopSlug = `${baseSlug}-${crypto.randomUUID().slice(0, 6)}`;
    const { data: shop, error: shopError } = await service.from("shops").insert({
      name,
      slug: shopSlug,
      owner_name: ownerName,
      owner_phone: phone,
      phone,
      whatsapp_number: whatsapp,
      location,
      verification_social_url: social || null,
      momo_number: momoNumber && momoNetwork && momoAccountName ? momoNumber : null,
      momo_network: momoNumber && momoNetwork && momoAccountName ? momoNetwork : null,
      momo_account_name: momoNumber && momoNetwork && momoAccountName ? momoAccountName : null,
      accepts_cash_on_delivery: formData.get("accepts_cash_on_delivery") === "on",
      verification_status: "pending",
      status: "pending",
      subscription_status: "trial",
      trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    }).select("id").single();
    if (shopError || !shop) throw shopError ?? new Error("The shop record could not be created.");
    const { error: memberError } = await service.from("shop_members").insert({ shop_id: shop.id, user_id: data.user.id, role: "owner" });
    if (memberError) {
      await service.from("shops").delete().eq("id", shop.id);
      throw memberError;
    }
  } catch (cause) {
    try { await createServiceRoleSupabaseClient().auth.admin.deleteUser(data.user.id); } catch { /* Keep the error generic if cleanup is unavailable. */ }
    return { error: cause instanceof Error ? `Your account was created, but the shop setup failed: ${cause.message}` : "The shop could not be set up. Contact support." };
  }

  if (data.session) redirect("/seller");
  redirect("/seller/login?notice=check-email");
}

export async function loginSeller(_previous: SellerAuthState, formData: FormData): Promise<SellerAuthState> {
  const email = clean(formData.get("email"), 250).toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your seller email and password." };
  let supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  try { supabase = await createSupabaseServerClient(); }
  catch { return { error: "Supabase is not configured yet. Check the project URL and publishable key." }; }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { error: "Those sign-in details could not be verified." };
  if (data.user.app_metadata?.role === "admin") redirect("/admin");
  const { data: membership, error: memberError } = await supabase.from("shop_members").select("shop_id").eq("user_id", data.user.id).limit(1).maybeSingle();
  if (memberError || !membership) {
    await supabase.auth.signOut();
    return { error: "This account is not connected to a seller shop. Create a seller account or contact support." };
  }
  redirect("/seller");
}

export async function logoutSeller() {
  try { await (await createSupabaseServerClient()).auth.signOut(); }
  finally { redirect("/seller/login"); }
}

export async function saveSellerProfile(formData: FormData) {
  const { supabase, shop } = await requireShopMember();
  const name = clean(formData.get("name"));
  const bio = clean(formData.get("bio"), 700);
  const location = clean(formData.get("location"), 120);
  const whatsapp = clean(formData.get("whatsapp_number"), 15).replace(/\D/g, "");
  const social = clean(formData.get("instagram_url"), 300);
  const momoNumber = clean(formData.get("momo_number"), 15).replace(/\D/g, "");
  const momoNetwork = clean(formData.get("momo_network"), 20);
  const momoName = clean(formData.get("momo_account_name"), 100);
  if (!name || whatsapp.length < 8 || whatsapp.length > 15) throw new Error("Enter a shop name and a WhatsApp number with its country code.");
  if (social) { try { if (!["http:", "https:"].includes(new URL(social).protocol)) throw new Error(); } catch { throw new Error("Enter a valid Instagram link."); } }
  const { error } = await supabase.from("shops").update({
    name, bio, location, whatsapp_number: whatsapp || null, instagram_url: social || null,
    momo_number: momoNumber && momoNetwork && momoName ? momoNumber : null,
    momo_network: momoNumber && momoNetwork && momoName ? momoNetwork : null,
    momo_account_name: momoNumber && momoNetwork && momoName ? momoName : null,
    accepts_cash_on_delivery: formData.get("accepts_cash_on_delivery") === "on",
  }).eq("id", shop.id);
  if (error) throw new Error(error.message);
  revalidatePath("/seller/settings");
  revalidatePath(`/s/${shop.slug}`);
  redirect("/seller/settings?saved=1");
}

export async function updateSellerOrder(formData: FormData) {
  const { supabase, shop } = await requireShopMember();
  const orderId = clean(formData.get("order_id"), 40);
  const status = clean(formData.get("status"), 20);
  const allowed = ["new", "confirmed", "paid", "delivered", "cancelled"];
  if (!orderId || !allowed.includes(status)) throw new Error("Choose a valid order status.");
  const sellerNotes = clean(formData.get("seller_notes"), 1200);
  const { error } = await supabase.from("orders").update({ status, seller_notes: sellerNotes || null }).eq("id", orderId).eq("shop_id", shop.id);
  if (error) throw new Error(error.message);
  revalidatePath("/seller/orders");
}

export async function updateSellerProduct(formData: FormData) {
  const { supabase, shop } = await requireShopMember();
  const productId = clean(formData.get("product_id"), 40);
  const name = clean(formData.get("name"), 110);
  const description = clean(formData.get("description"), 800);
  const price = Number(formData.get("price"));
  if (!uuidPattern.test(productId) || !name || !Number.isFinite(price) || price <= 0) throw new Error("Enter a product name and a price greater than zero.");

  const { data: product, error: productReadError } = await supabase.from("products").select("id").eq("id", productId).eq("shop_id", shop.id).maybeSingle();
  if (productReadError || !product) throw new Error("That product could not be found in your shop.");
  const { error: updateError } = await supabase.from("products").update({
    name,
    slug: `${slugify(name).slice(0, 80) || "shop-find"}-${productId.slice(0, 8)}`,
    description,
    price,
  }).eq("id", productId).eq("shop_id", shop.id);
  if (updateError) throw new Error(updateError.message);

  const { data: variants, error: variantsError } = await supabase.from("product_variants").select("id").eq("product_id", productId);
  if (variantsError) throw new Error(variantsError.message);
  for (const variant of variants ?? []) {
    const rawStock = formData.get(`stock_${variant.id}`);
    if (rawStock === null) continue;
    const stock = Number(rawStock);
    if (!Number.isInteger(stock) || stock < 0) throw new Error("Stock quantities must be whole numbers at zero or above.");
    const { error } = await supabase.from("product_variants").update({ stock }).eq("id", variant.id).eq("product_id", productId);
    if (error) throw new Error(error.message);
  }
  revalidatePath("/seller/products");
  revalidatePath("/seller");
  revalidatePath(`/s/${shop.slug}`);
}

export async function setSellerProductVisibility(formData: FormData) {
  const { supabase, shop } = await requireShopMember();
  const productId = clean(formData.get("product_id"), 40);
  const hidden = formData.get("hidden") === "true";
  if (!uuidPattern.test(productId)) throw new Error("Choose a valid product.");
  const { error } = await supabase.from("products").update({ is_hidden: hidden }).eq("id", productId).eq("shop_id", shop.id);
  if (error) throw new Error(error.message);
  revalidatePath("/seller/products");
  revalidatePath(`/s/${shop.slug}`);
}

export async function markSellerProductSoldOut(formData: FormData) {
  const { supabase, shop } = await requireShopMember();
  const productId = clean(formData.get("product_id"), 40);
  if (!uuidPattern.test(productId)) throw new Error("Choose a valid product.");
  const { data: product, error: productError } = await supabase.from("products").select("id").eq("id", productId).eq("shop_id", shop.id).maybeSingle();
  if (productError || !product) throw new Error("That product could not be found in your shop.");
  const { error } = await supabase.from("product_variants").update({ stock: 0 }).eq("product_id", productId);
  if (error) throw new Error(error.message);
  revalidatePath("/seller/products");
  revalidatePath(`/s/${shop.slug}`);
}

export async function duplicateSellerProduct(formData: FormData) {
  const { supabase, shop } = await requireShopMember();
  const productId = clean(formData.get("product_id"), 40);
  if (!uuidPattern.test(productId)) throw new Error("Choose a valid product.");
  const [{ data: source, error: sourceError }, { data: images, error: imageReadError }, { data: variants, error: variantReadError }, { data: productTags, error: tagReadError }] = await Promise.all([
    supabase.from("products").select("name,description,brand_id,category_id,subcategory_id,gender,sleeve_length,style,price,compare_at_price,discreet_image").eq("id", productId).eq("shop_id", shop.id).maybeSingle(),
    supabase.from("product_images").select("storage_path,source_url,alt_text,position,is_primary,width,height").eq("product_id", productId).order("position"),
    supabase.from("product_variants").select("size,color,stock").eq("product_id", productId),
    supabase.from("product_tags").select("tag_id").eq("product_id", productId),
  ]);
  if (sourceError || imageReadError || variantReadError || tagReadError || !source) throw new Error("Could not load that product to make a copy.");
  const copyId = crypto.randomUUID();
  const copyName = `${source.name} (copy)`.slice(0, 110);
  const { error: insertError } = await supabase.from("products").insert({
    id: copyId, shop_id: shop.id, name: copyName,
    slug: `${slugify(source.name).slice(0, 70) || "shop-find"}-${copyId.slice(0, 8)}`,
    description: source.description, brand_id: source.brand_id, category_id: source.category_id,
    subcategory_id: source.subcategory_id, gender: source.gender, sleeve_length: source.sleeve_length,
    style: source.style, price: source.price, compare_at_price: source.compare_at_price,
    discreet_image: source.discreet_image, moderation_status: "pending", is_published: false,
  });
  if (insertError) throw new Error(insertError.message);

  const copiedPaths: string[] = [];
  try {
    const imageRows = [];
    for (const image of images ?? []) {
      let storagePath = image.storage_path;
      if (storagePath) {
        const filename = storagePath.split("/").pop() || `${crypto.randomUUID()}.webp`;
        storagePath = `${shop.id}/${copyId}/${filename}`;
        const { error } = await supabase.storage.from("product-images").copy(image.storage_path, storagePath);
        if (error) throw error;
        copiedPaths.push(storagePath);
      }
      imageRows.push({ product_id: copyId, storage_path: storagePath, source_url: image.source_url, alt_text: image.alt_text, position: image.position, is_primary: image.is_primary, width: image.width, height: image.height });
    }
    if (imageRows.length) {
      const { error } = await supabase.from("product_images").insert(imageRows);
      if (error) throw error;
    }
    if (variants?.length) {
      const { error } = await supabase.from("product_variants").insert(variants.map((variant) => ({ ...variant, product_id: copyId })));
      if (error) throw error;
    }
    if (productTags?.length) {
      const { error } = await supabase.from("product_tags").insert(productTags.map((tag) => ({ product_id: copyId, tag_id: tag.tag_id })));
      if (error) throw error;
    }
  } catch (cause) {
    if (copiedPaths.length) await supabase.storage.from("product-images").remove(copiedPaths);
    await supabase.from("products").delete().eq("id", copyId).eq("shop_id", shop.id);
    throw new Error(cause instanceof Error ? cause.message : "Could not finish copying this product.");
  }
  revalidatePath("/seller/products");
}

export async function deleteSellerProduct(formData: FormData) {
  const { supabase, shop } = await requireShopMember();
  const productId = clean(formData.get("product_id"), 40);
  if (!uuidPattern.test(productId)) throw new Error("Choose a valid product.");
  const { data: images, error: imageError } = await supabase.from("product_images").select("storage_path").eq("product_id", productId);
  if (imageError) throw new Error(imageError.message);
  const paths = (images ?? []).flatMap((image) => image.storage_path ? [image.storage_path] : []);
  if (paths.length) {
    const { error } = await supabase.storage.from("product-images").remove(paths);
    if (error) throw new Error(`Could not remove product photos: ${error.message}`);
  }
  const { error } = await supabase.from("products").delete().eq("id", productId).eq("shop_id", shop.id);
  if (error) throw new Error(error.message);
  revalidatePath("/seller/products");
  revalidatePath(`/s/${shop.slug}`);
}
