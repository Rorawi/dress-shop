import type { Metadata } from "next";
import QuickUpload from "@/components/seller/quick-upload";
import { requireShopMember } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Quick product upload" };

export default async function SellerQuickUploadPage({ searchParams }: { searchParams: Promise<{ sharedDraft?: string; error?: string }> }) {
  const [{ supabase, shop, user }, query] = await Promise.all([requireShopMember(), searchParams]);
  const [categoryResult, subcategoryResult, brandResult, tagResult, sharedResult] = await Promise.all([
    supabase.from("categories").select("id,name,department").eq("is_active", true).order("sort_order").order("name"),
    supabase.from("subcategories").select("id,name,category_id").eq("is_active", true).order("sort_order").order("name"),
    supabase.from("brands").select("id,name").order("name"),
    supabase.from("tags").select("id,name").order("name"),
    query.sharedDraft ? supabase.from("seller_upload_drafts").select("product_id,caption").eq("product_id", query.sharedDraft).eq("shop_id", shop.id).eq("user_id", user.id).maybeSingle() : Promise.resolve({ data: null, error: null }),
  ]);
  let shared = null;
  if (sharedResult.data) {
    const { data: product } = await supabase.from("products").select("id,name,description,category_id,subcategory_id,gender,price,moderation_verdict,moderation_reason,product_images(storage_path,source_url,alt_text,position)").eq("id", sharedResult.data.product_id).eq("shop_id", shop.id).maybeSingle();
    if (product) {
      const { product_images, ...rest } = product;
      const images = (product_images ?? []).sort((a, b) => a.position - b.position).map((image) => image.source_url ?? (image.storage_path ? supabase.storage.from("product-images").getPublicUrl(image.storage_path).data.publicUrl : "")).filter(Boolean);
      shared = { ...rest, images, caption: sharedResult.data.caption };
    }
  }
  return <QuickUpload categories={categoryResult.data ?? []} subcategories={subcategoryResult.data ?? []} brands={brandResult.data ?? []} tags={tagResult.data ?? []} shopId={shop.id} initialShared={shared} shareError={query.error === "files" ? "Share one to eight image files from another app." : undefined}/>;
}
