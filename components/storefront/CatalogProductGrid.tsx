import type { CatalogProduct } from "@/lib/catalog-types";
import CatalogProductCard from "@/components/storefront/CatalogProductCard";

export default function CatalogProductGrid({ products, emptyMessage = "No products found. Try another search or clear some filters.", currency = "GHS" }: { products: CatalogProduct[]; emptyMessage?: string; currency?: string }) {
  if (!products.length) return <div className="rounded-3xl border border-dashed border-[#D9D1E0] px-6 py-20 text-center text-sm text-[#625B68]">{emptyMessage}</div>;
  return <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 md:gap-y-10 xl:grid-cols-4">
    {products.map((product) => <CatalogProductCard key={product.id} product={product} currency={currency} />)}
  </div>;
}
