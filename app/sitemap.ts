import type { MetadataRoute } from "next";
import { getCatalogProducts, getPublicShops } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/shop`, changeFrequency: "daily", priority: 0.9 },
  ];

  try {
    const [products, shops] = await Promise.all([getCatalogProducts(), getPublicShops()]);
    return [
      ...staticRoutes,
      ...shops.map((shop) => ({ url: `${base}/s/${shop.slug}`, changeFrequency: "weekly" as const, priority: 0.75 })),
      ...products.map((product) => ({
        url: `${base}/shop/${product.slug}`,
        lastModified: product.createdAt,
        changeFrequency: "weekly" as const,
        priority: 0.65,
        images: product.images.slice(0, 3).map((image) => image.url),
      })),
    ];
  } catch {
    // Supabase unavailable at build time — return static routes only
    return staticRoutes;
  }
}
