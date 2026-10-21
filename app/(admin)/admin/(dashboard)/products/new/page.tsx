import type { Metadata } from "next";
import ProductEditor from "@/components/admin/product-editor";
import { getCatalogEditorOptions } from "@/lib/admin/catalog-options";
import { requireShopAdmin } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Add product" };

export default async function NewProductPage() {
  const { supabase } = await requireShopAdmin();
  const options = await getCatalogEditorOptions(supabase);
  return (
    <>
      {options.error && <div role="alert" className="mb-6 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-950">Could not load categories or tags. Apply the Charwin catalog migration and expose the <code>charwin_store</code> schema.</div>}
      {options.categories.length === 0 && !options.error && <div className="mb-6 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-950">Create at least one active category in <a href="/admin/settings" className="font-semibold underline">Shop settings</a> before adding products.</div>}
      <ProductEditor {...options} />
    </>
  );
}
