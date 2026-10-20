import ProductListing from "@/components/storefront/ProductListing";
import { getCatalogProducts, getStoreSettings } from "@/lib/catalog";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function ShopPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const [params, products, settings] = await Promise.all([searchParams, getCatalogProducts(), getStoreSettings()]);
  const initialFilters = Object.fromEntries(Object.entries(params).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]));
  return <ProductListing products={products} initialFilters={initialFilters} currency={settings.currency} />;
}
