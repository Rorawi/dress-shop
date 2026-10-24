import type { Metadata } from "next";
import Image from "next/image";
import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import CatalogImageGallery from "@/components/storefront/CatalogImageGallery";
import CatalogProductGrid from "@/components/storefront/CatalogProductGrid";
import ProductPurchasePanel from "@/components/storefront/ProductPurchasePanel";
import ShareProductButton from "@/components/storefront/ShareProductButton";
import ReportDialog from "@/components/storefront/ReportDialog";
import { getCatalogProducts, getStoreSettings } from "@/lib/catalog";

const money = (amount: number, currency: string) => new Intl.NumberFormat("en-GH", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);

const getProductPageData = cache(async (slug: string) => {
  const [products, settings] = await Promise.all([getCatalogProducts(), getStoreSettings()]);
  return { products, settings, product: products.find((item) => item.slug === slug) ?? null };
});

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { product, settings } = await getProductPageData(slug);
  if (!product) return { title: "Product" };
  const title = `${product.name} · ${money(product.price, settings.currency)}`;
  const description = product.description || `Shop ${product.name} at Charwin Stores. Browse details and order directly on WhatsApp.`;
  const image = product.images[0];
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: image ? [{ url: image.url, alt: image.altText || product.name }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image.url] : undefined,
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { products, settings, product } = await getProductPageData(slug);
  if (!product) notFound();

  const moreFromShop = products.filter((item) => item.id !== product.id && item.shop?.id === product.shop?.id).slice(0, 4);
  const related = products.filter((item) => item.id !== product.id && item.shop?.id !== product.shop?.id && (
    item.subcategory?.slug === product.subcategory?.slug ||
    item.category.department === product.category.department
  )).slice(0, 4);
  const discount = product.compareAtPrice && product.compareAtPrice > product.price
    ? Math.round((1 - product.price / product.compareAtPrice) * 100)
    : null;

  return <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-9 lg:px-8">
    <div className="mb-6 flex flex-wrap items-center gap-2 text-[11px] text-[#8B8490]"><Link href="/" className="hover:text-[#55239A]">Home</Link><span>/</span><Link href="/shop" className="hover:text-[#55239A]">Shop</Link><span>/</span><Link href={`/shop?department=${product.category.department}`} className="capitalize hover:text-[#55239A]">{product.category.name}</Link><span>/</span><span className="max-w-[180px] truncate text-[#625B68]">{product.name}</span></div>
    <div className="grid items-start gap-8 md:grid-cols-2 md:gap-10 lg:gap-16">
      <CatalogImageGallery images={product.images} productName={product.name} discreet={product.discreetImage} />
      <div className="md:sticky md:top-32">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[.2em] text-[#8B5BC7]">{product.brand?.name ?? product.category.name}{product.subcategory ? ` · ${product.subcategory.name}` : ""}</p>
        <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-medium leading-tight text-[#17141C] sm:text-4xl lg:text-[2.7rem]">{product.name}</h1>
        <div className="mt-4 flex flex-wrap items-center gap-3"><span className="text-xl font-semibold text-[#17141C]">{money(product.price, settings.currency)}</span>{product.compareAtPrice && product.compareAtPrice > product.price && <><span className="text-base text-[#8B8490] line-through">{money(product.compareAtPrice, settings.currency)}</span>{discount && <span className="rounded-full bg-[#F4EAFB] px-3 py-1 text-[10px] font-semibold text-[#55239A]">Save {discount}%</span>}</>}</div>
        <ShareProductButton productName={product.name} price={money(product.price, settings.currency)} />
        <p className="mt-5 text-sm leading-7 text-[#625B68]">{product.description}</p>
        {product.shop && <section className="mt-6 rounded-2xl border border-[#E6E0EB] bg-white p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-[#F5F1F8]">{product.shop.logoUrl ? <Image src={product.shop.logoUrl} alt={`${product.shop.name} logo`} fill unoptimized sizes="48px" className="object-cover" /> : <span className="flex h-full items-center justify-center font-[family-name:var(--font-playfair)] text-lg font-semibold text-[#55239A]">{product.shop.name.slice(0, 1)}</span>}</div>
            <div className="min-w-0 flex-1"><p className="text-[10px] font-semibold uppercase tracking-[.15em] text-[#8B5BC7]">Sold by</p><Link href={`/s/${product.shop.slug}`} className="font-semibold text-[#17141C] hover:text-[#55239A]">{product.shop.name}</Link>{product.shop.location && <p className="mt-0.5 text-xs text-[#625B68]">{product.shop.location}</p>}</div>
            <Link href={`/s/${product.shop.slug}`} className="shrink-0 rounded-full border border-[#D9D1E0] px-3 py-2 text-xs font-semibold text-[#55239A] hover:bg-[#F5F1F8]">Visit shop</Link>
          </div>
        </section>}
        <div className="my-6"><ProductPurchasePanel product={product} settings={settings} /></div>
        {product.shop && <div className="mt-4"><ReportDialog shopId={product.shop.id} productId={product.id} subjectName={product.name} subjectType="product" /></div>}
        <div className="divide-y divide-[#E6E0EB] border-y border-[#E6E0EB]">
          <details className="group py-4" open><summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold">Product details<span className="text-[#8B5BC7] transition group-open:rotate-45">+</span></summary><div className="space-y-2 pt-3 text-xs leading-5 text-[#625B68]"><p>{product.description}</p>{product.style && <p><strong className="font-medium text-[#17141C]">Style:</strong> {product.style}</p>}<p><strong className="font-medium text-[#17141C]">Category:</strong> {product.category.name}{product.subcategory ? ` / ${product.subcategory.name}` : ""}</p>{product.gender && <p><strong className="font-medium text-[#17141C]">Fit:</strong> {product.gender === "unisex" ? "Unisex" : product.gender}</p>}</div></details>
          <details className="group py-4"><summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold">Care & fabric<span className="text-[#8B5BC7] transition group-open:rotate-45">+</span></summary><p className="pt-3 text-xs leading-5 text-[#625B68]">For fabric composition and care advice, message us before ordering and we’ll confirm the details for this item.</p></details>
          <details className="group py-4"><summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold">Delivery & returns<span className="text-[#8B5BC7] transition group-open:rotate-45">+</span></summary><p className="pt-3 text-xs leading-5 text-[#625B68]">Delivery options, timing and any return arrangements are confirmed directly with you on WhatsApp before your order is finalized.</p></details>
        </div>
      </div>
    </div>
    {moreFromShop.length > 0 && <section className="mt-16 border-t border-[#E6E0EB] pt-12 sm:mt-24 sm:pt-16"><div className="mb-7"><p className="mb-2 text-[10px] font-semibold uppercase tracking-[.2em] text-[#8B5BC7]">From {product.shop?.name}</p><h2 className="font-[family-name:var(--font-playfair)] text-3xl font-medium">More from this shop</h2></div><CatalogProductGrid products={moreFromShop} currency={settings.currency} /></section>}
    {related.length > 0 && <section className="mt-16 border-t border-[#E6E0EB] pt-12 sm:mt-24 sm:pt-16"><div className="mb-7"><p className="mb-2 text-[10px] font-semibold uppercase tracking-[.2em] text-[#8B5BC7]">Keep looking</p><h2 className="font-[family-name:var(--font-playfair)] text-3xl font-medium">You might also like</h2></div><CatalogProductGrid products={related} currency={settings.currency} /></section>}
  </div>;
}
