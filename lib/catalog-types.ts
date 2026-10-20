export type CatalogDepartment = "clothing" | "underwear";

export interface CatalogCategory {
  id: string;
  name: string;
  slug: string;
  department: CatalogDepartment;
}

export interface CatalogImage {
  id: string;
  url: string;
  altText: string;
  position: number;
}

export interface CatalogVariant {
  id: string;
  size: string;
  color: string;
  stock: number;
}

export interface CatalogTag {
  name: string;
  slug: string;
  kind: "general" | "seasonal" | "collection";
}

export interface CatalogProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  brand: { name: string; slug: string } | null;
  category: CatalogCategory;
  subcategory: { name: string; slug: string } | null;
  gender: "women" | "men" | "unisex" | "kids" | null;
  sleeveLength: string | null;
  style: string | null;
  price: number;
  compareAtPrice: number | null;
  images: CatalogImage[];
  variants: CatalogVariant[];
  tags: CatalogTag[];
  isFeatured: boolean;
  discreetImage: boolean;
  createdAt: string;
}

export interface StoreSettings {
  shopName: string;
  whatsappNumber: string;
  currency: string;
  announcementBanner: string | null;
  featuredSeasonTag: string | null;
}

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  shopName: "Charwin Stores",
  whatsappNumber: "",
  currency: "GHS",
  announcementBanner: "Thoughtful finds for every day. Style, made yours.",
  featuredSeasonTag: "Christmas",
};
