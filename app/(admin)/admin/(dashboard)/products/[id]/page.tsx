import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductEditor from "@/components/admin/product-editor";
import type { ProductEditorRecord } from "@/components/admin/types";
import { getCatalogEditorOptions } from "@/lib/admin/catalog-options";
import { requireShopAdmin } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Edit product" };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireShopAdmin();
  const [productResult, imageResult, variantResult, tagResult, options] = await Promise.all([
    supabase.from("products").select("id,name,slug,description,brand_id,category_id,subcategory_id,gender,sleeve_length,style,price,compare_at_price,is_published,is_hidden,is_featured,discreet_image").eq("id", id).maybeSingle(),
    supabase.from("product_images").select("id,storage_path,source_url,alt_text,position").eq("product_id", id).order("position"),
    supabase.from("product_variants").select("id,size,color,stock").eq("product_id", id).order("size"),
    supabase.from("product_tags").select("tag_id").eq("product_id", id),
    getCatalogEditorOptions(supabase),
  ]);
  if (!productResult.data) notFound();

  const product: ProductEditorRecord = {
    ...productResult.data,
    images: imageResult.data ?? [],
    variants: variantResult.data ?? [],
    tagIds: (tagResult.data ?? []).map((tag) => tag.tag_id),
  };
  return (
    <>
      {(productResult.error || imageResult.error || variantResult.error || tagResult.error || options.error) && <div role="alert" className="mb-6 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-950">Some catalog details could not be loaded. Check the custom schema exposure and database migration settings.</div>}
      <ProductEditor {...options} product={product} />
    </>
  );
}
