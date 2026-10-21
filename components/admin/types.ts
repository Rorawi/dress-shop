export type AdminCategoryOption = { id: string; name: string; department: "clothing" | "underwear"; sort_order: number; is_active: boolean };
export type AdminSubcategoryOption = { id: string; category_id: string; name: string; slug: string; sort_order: number; is_active: boolean; categoryName: string };
export type AdminBrandOption = { id: string; name: string };
export type AdminTagOption = { id: string; name: string; kind: "general" | "seasonal" | "collection" };

export type ProductEditorRecord = {
  id: string;
  name: string;
  slug: string;
  description: string;
  brand_id: string | null;
  category_id: string;
  subcategory_id: string | null;
  gender: "women" | "men" | "unisex" | "kids" | null;
  sleeve_length: string | null;
  style: string | null;
  price: number | string;
  compare_at_price: number | string | null;
  is_published: boolean;
  is_hidden: boolean;
  is_featured: boolean;
  discreet_image: boolean;
  images: { id: string; storage_path: string | null; source_url: string | null; alt_text: string; position: number }[];
  variants: { id?: string; size: string; color: string; stock: number }[];
  tagIds: string[];
};
