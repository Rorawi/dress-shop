export const CATALOG_DEPARTMENTS = [
  { value: "clothing", label: "Clothing" },
  { value: "underwear", label: "Underwear" },
  { value: "bags", label: "Bags" },
  { value: "shoes", label: "Shoes" },
] as const;

export type CatalogDepartment = (typeof CATALOG_DEPARTMENTS)[number]["value"];

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

export interface CatalogShop {
  id: string;
  name: string;
  slug: string;
  bio: string;
  location: string;
  whatsappNumber: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  instagramUrl: string | null;
  snapchatUrl: string | null;
  tiktokUrl: string | null;
  facebookUrl: string | null;
  websiteUrl: string | null;
  acceptsMobileMoney: boolean;
  acceptsCashOnDelivery: boolean;
  isFeatured: boolean;
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
  shop?: CatalogShop | null;
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
