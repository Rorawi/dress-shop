import type { AdminBrandOption, AdminCategoryOption, AdminSubcategoryOption, AdminTagOption } from "@/components/admin/types";
import type { createSupabaseServerClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

export async function getCatalogEditorOptions(supabase: SupabaseServerClient) {
  const [categoryResult, subcategoryResult, brandResult, tagResult] = await Promise.all([
    supabase.from("categories").select("id,name,department,sort_order,is_active").order("sort_order").order("name"),
    supabase.from("subcategories").select("id,name,slug,category_id,sort_order,is_active").order("sort_order").order("name"),
    supabase.from("brands").select("id,name").order("name"),
    supabase.from("tags").select("id,name,kind").order("sort_order").order("name"),
  ]);
  const categoryNames = new Map((categoryResult.data ?? []).map((category) => [category.id, category.name]));
  return {
    categories: (categoryResult.data ?? []) as AdminCategoryOption[],
    subcategories: (subcategoryResult.data ?? []).map((subcategory) => ({ ...subcategory, categoryName: categoryNames.get(subcategory.category_id) ?? "Category" })) as AdminSubcategoryOption[],
    brands: (brandResult.data ?? []) as AdminBrandOption[],
    tags: (tagResult.data ?? []) as AdminTagOption[],
    error: categoryResult.error ?? subcategoryResult.error ?? brandResult.error ?? tagResult.error,
  };
}

export async function getAdminShopOptions(supabase: SupabaseServerClient) {
  const { data, error } = await supabase.from("shops").select("id,name,slug,status,verification_status").order("name");
  return { shops: data ?? [], error };
}
