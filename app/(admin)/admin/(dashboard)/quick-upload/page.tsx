import type { Metadata } from "next";
import QuickUpload from "@/components/admin/quick-upload";
import { getAdminShopOptions, getCatalogEditorOptions } from "@/lib/admin/catalog-options";
import { requireShopAdmin } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Quick upload" };

export default async function QuickUploadPage() {
  const { supabase } = await requireShopAdmin();
  const [options, shopOptions] = await Promise.all([getCatalogEditorOptions(supabase), getAdminShopOptions(supabase)]);
  return (
    <>
      {options.error && <div role="alert" className="mb-6 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-950">Could not load the shop categories. Apply the Charwin migration and expose <code>charwin_store</code> in Supabase API settings.</div>}
      <QuickUpload categories={options.categories.filter((category) => category.is_active)} subcategories={options.subcategories.filter((subcategory) => subcategory.is_active)} shops={shopOptions.shops} />
    </>
  );
}
