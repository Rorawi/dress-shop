import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { CatalogProduct } from "@/lib/catalog-types";
import { getCatalogColorOptions } from "@/lib/catalog-colors";
import DiscreetImage from "@/components/storefront/DiscreetImage";

const money = (amount: number, currency: string) => new Intl.NumberFormat("en-GH", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);

export default function CatalogProductCard({ product, currency = "GHS" }: { product: CatalogProduct; currency?: string }) {
  const image = product.images[0];
  const available = product.variants.some((variant) => variant.stock > 0);
  const sizes = [...new Set(product.variants.filter((variant) => variant.stock > 0 && variant.size.trim().toLowerCase() !== "one size").map((variant) => variant.size))];
  const firstColor = getCatalogColorOptions(product.variants.map((variant) => variant.color))[0];
  const discount = product.compareAtPrice && product.compareAtPrice > product.price
    ? Math.round((1 - product.price / product.compareAtPrice) * 100)
    : null;

  return <article className="group min-w-0">
    <div className="relative aspect-[4/5] overflow-hidden rounded-[1.1rem] bg-[#F3F0F5]">
      {image ? <DiscreetImage src={image.url} alt={image.altText || product.name} sizes="(max-width:640px) 50vw,(max-width:1024px) 33vw,25vw" className="pointer-events-none object-cover transition duration-700 group-hover:scale-[1.035]" discreet={product.discreetImage} /> : <div className="flex h-full items-center justify-center text-sm text-[#8B8490]">Image coming soon</div>}
      <Link href={`/shop/${product.slug}`} aria-label={`View ${product.name}`} className="absolute inset-0 z-[1]" />
      <div className="pointer-events-none absolute left-3 top-3 z-20 flex flex-col items-start gap-1.5">
        {!available && <span className="rounded-full bg-white/95 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#625B68]">Sold out</span>}
        {available && discount && <span className="rounded-full bg-[#55239A] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">-{discount}%</span>}
        {product.tags.some((tag) => tag.slug === "new-arrival") && <span className="rounded-full bg-white/95 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#35115F]">Just in</span>}
      </div>
      <Link href={`/shop/${product.slug}`} className="absolute bottom-3 right-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#35115F] shadow-md transition hover:bg-[#55239A] hover:text-white" aria-label={`Choose options for ${product.name}`}><ArrowUpRight size={18} /></Link>
    </div>
    <div className="px-0.5 pt-3.5">
      <div className="mb-1 flex items-start justify-between gap-2">
        <p className="min-h-5 text-[10px] font-semibold uppercase tracking-[.13em] text-[#8B5BC7]">{product.brand?.name ?? product.category.name}</p>
        {firstColor && <span className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full border border-black/10" title={firstColor.name} style={{ backgroundColor: firstColor.hex }} />}
      </div>
      <Link href={`/shop/${product.slug}`} className="line-clamp-2 text-sm font-medium leading-snug text-[#17141C] transition group-hover:text-[#55239A]">{product.name}</Link>
      <div className="mt-2 flex items-center gap-2">
        <span className="text-sm font-semibold text-[#17141C]">{money(product.price, currency)}</span>
        {product.compareAtPrice && product.compareAtPrice > product.price && <span className="text-xs text-[#8B8490] line-through">{money(product.compareAtPrice, currency)}</span>}
      </div>
      <div className="mt-2 flex min-h-4 flex-wrap items-center gap-1.5">
        {available ? sizes.slice(0, 5).map((size) => <span key={size} className="text-[9px] text-[#625B68]">{size}</span>) : <span className="text-[10px] text-[#8B8490]">Currently unavailable</span>}
      </div>
    </div>
  </article>;
}
