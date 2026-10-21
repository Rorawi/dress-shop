import type { Metadata } from "next";
import { requireShopAdmin } from "@/lib/supabase/admin";
import ProductList, { type AdminProduct } from "@/components/admin/product-list";

export const metadata: Metadata = { title: "Products" };

export default async function AdminProductsPage() {
  const { supabase } = await requireShopAdmin();
  const { data, error } = await supabase.from("products")
    .select("id,name,slug,price,is_published,is_hidden,created_at,images:product_images(storage_path,source_url,alt_text),variants:product_variants(stock)")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8"><p className="text-sm font-semibold tracking-[.18em] text-[#8b5bc7]">THE COLLECTION</p><h1 className="mt-2 text-4xl">Products</h1><p className="mt-2 text-sm text-[#625b68]">Add new pieces, update details, and keep your stock in step.</p></div>
      {error ? <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950">Could not read the catalog from Supabase. Apply the catalog migration and expose the <code>charwin_store</code> schema in API settings. <span className="block pt-2 text-xs">{error.message}</span></div> : <ProductList products={(data ?? []) as unknown as AdminProduct[]} />}
    </div>
  );
}
