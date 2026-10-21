import type { Metadata } from "next";
import ShopSettingsEditor from "@/components/admin/shop-settings-editor";
import { requireShopAdmin } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Shop settings" };

export default async function AdminSettingsPage() {
  const { supabase } = await requireShopAdmin();
  const [settingsResult, categoriesResult, subcategoriesResult, tagsResult] = await Promise.all([
    supabase.from("site_settings").select("shop_name,whatsapp_number,currency,announcement_banner,featured_season_tag_id").eq("id", true).maybeSingle(),
    supabase.from("categories").select("id,name,department,sort_order,is_active").order("sort_order").order("name"),
    supabase.from("subcategories").select("id,name,slug,category_id,sort_order,is_active").order("sort_order").order("name"),
    supabase.from("tags").select("id,name,kind,sort_order").order("sort_order").order("name"),
  ]);
  const catalogError = settingsResult.error ?? categoriesResult.error ?? subcategoriesResult.error ?? tagsResult.error;
  const settings = settingsResult.data ?? { shop_name: "Charwin Stores", whatsapp_number: "", currency: "GHS", announcement_banner: "", featured_season_tag_id: null };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8"><p className="text-sm font-semibold tracking-[.18em] text-[#8b5bc7]">MAKE IT YOURS</p><h1 className="mt-2 text-4xl">Shop settings</h1><p className="mt-2 text-sm text-[#625b68]">Update your shop details and shape the collections shoppers can explore.</p></div>
      {catalogError && <div role="alert" className="mb-6 rounded-xl bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950"><strong>The catalog API connection failed.</strong> Confirm that <code>charwin_store</code> is exposed in Supabase Data API settings. <span className="mt-1 block text-xs">Supabase response: {catalogError.message}</span></div>}
      <ShopSettingsEditor initialSettings={settings} categories={categoriesResult.data ?? []} subcategories={(subcategoriesResult.data ?? []).map((subcategory) => ({ ...subcategory, categoryName: (categoriesResult.data ?? []).find((category) => category.id === subcategory.category_id)?.name ?? "Category" }))} tags={tagsResult.data ?? []} />
    </div>
  );
}
