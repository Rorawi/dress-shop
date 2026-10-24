import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin) {
    try { if (new URL(origin).origin !== new URL(request.url).origin) return new Response("Invalid origin", { status: 403 }); }
    catch { return new Response("Invalid origin", { status: 403 }); }
  }
  let supabase;
  try { supabase = await createSupabaseServerClient(); }
  catch { return NextResponse.redirect(new URL("/seller/login", request.url), 303); }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/seller/login", request.url), 303);
  const form = await request.formData();
  const files = form.getAll("files").filter((entry): entry is File => entry instanceof File && entry.size > 0);
  const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!files.length || files.length > 8 || files.some((file) => !allowedImageTypes.includes(file.type) || file.size > 8 * 1024 * 1024) || files.reduce((sum, file) => sum + file.size, 0) > 24 * 1024 * 1024) {
    return NextResponse.redirect(new URL("/seller/quick-upload?error=files", request.url), 303);
  }
  const [{ data: membership }, { data: category }] = await Promise.all([
    supabase.from("shop_members").select("shop_id").eq("user_id", user.id).limit(1).maybeSingle(),
    supabase.from("categories").select("id").eq("is_active", true).order("sort_order").limit(1).maybeSingle(),
  ]);
  if (!membership) return NextResponse.redirect(new URL("/seller/signup?error=shop", request.url), 303);
  if (!category) return NextResponse.redirect(new URL("/seller/quick-upload", request.url), 303);
  const title = String(form.get("title") ?? "").trim().slice(0, 110);
  const text = String(form.get("text") ?? "").trim().slice(0, 2_000);
  const url = String(form.get("url") ?? "").trim().slice(0, 2_000);
  const caption = [title, text, url].filter(Boolean).join("\n").slice(0, 5_000);
  const slugSuffix = crypto.randomUUID().slice(0, 10);
  const { data: product, error: productError } = await supabase.from("products").insert({
    shop_id: membership.shop_id,
    name: "Shared photo draft",
    slug: `shared-photo-${slugSuffix}`,
    description: caption,
    category_id: category.id,
    gender: "unisex",
    price: 0,
    is_published: false,
  }).select("id").single();
  if (productError || !product) return NextResponse.redirect(new URL("/seller/quick-upload?error=files", request.url), 303);
  const paths: string[] = [];
  try {
    for (const [position, file] of files.entries()) {
      const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const path = `${membership.shop_id}/${product.id}/${crypto.randomUUID()}.${extension}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file, { contentType: file.type, upsert: false, cacheControl: "31536000" });
      if (error) throw error;
      paths.push(path);
      const { error: imageError } = await supabase.from("product_images").insert({ product_id: product.id, storage_path: path, alt_text: file.name.slice(0, 160), position, is_primary: position === 0 });
      if (imageError) throw imageError;
    }
    const { error: queueError } = await supabase.from("seller_upload_drafts").insert({ product_id: product.id, shop_id: membership.shop_id, user_id: user.id, caption });
    if (queueError) throw queueError;
  } catch {
    if (paths.length) await supabase.storage.from("product-images").remove(paths);
    await supabase.from("products").delete().eq("id", product.id);
    return NextResponse.redirect(new URL("/seller/quick-upload?error=files", request.url), 303);
  }
  return NextResponse.redirect(new URL(`/seller/quick-upload?sharedDraft=${product.id}`, request.url), 303);
}
