import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Globe2, Instagram, MapPin, MessageCircle } from "lucide-react";
import CatalogProductGrid from "@/components/storefront/CatalogProductGrid";
import ReportDialog from "@/components/storefront/ReportDialog";
import StorefrontFrame from "@/components/storefront/StorefrontFrame";
import { getCatalogProducts, getExpiredPublicShopBySlug, getPublicShopBySlug, getStoreSettings } from "@/lib/catalog";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { cache } from "react";

const getShopPageData = cache(async (slug: string) => {
  const [shop, settings] = await Promise.all([getPublicShopBySlug(slug), getStoreSettings()]);
  if (!shop) return { shop: null, expiredShop: await getExpiredPublicShopBySlug(slug), products: [], settings };
  const products = await getCatalogProducts();
  return { shop, expiredShop: null, products: products.filter((product) => product.shop?.slug === slug), settings };
});

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { shop, expiredShop, products } = await getShopPageData(slug);
  if (!shop && expiredShop) return { title: `${expiredShop.name} is temporarily unavailable`, description: "This shop is temporarily unavailable while its subscription is renewed.", robots: { index: false, follow: true } };
  if (!shop) return { title: "Shop unavailable" };
  const description = shop.bio || `Shop ${shop.name} on Charwin Stores. Browse their latest pieces and order directly on WhatsApp.`;
  return {
    title: shop.name,
    description,
    openGraph: { title: `${shop.name} · Charwin Stores`, description, type: "website", images: shop.bannerUrl ? [{ url: shop.bannerUrl, alt: `${shop.name} shop banner` }] : undefined },
    twitter: { card: shop.bannerUrl ? "summary_large_image" : "summary", title: shop.name, description, images: shop.bannerUrl ? [shop.bannerUrl] : undefined },
    alternates: { canonical: `/s/${shop.slug}` },
    other: { "product:count": String(products.length) },
  };
}

export default async function ShopStorefrontPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { shop, expiredShop, products, settings } = await getShopPageData(slug);
  if (!shop && expiredShop) return <StorefrontFrame settings={settings} showWhatsAppFab={false}><main className="mx-auto flex min-h-[65vh] max-w-3xl flex-col items-center justify-center px-5 text-center"><p className="text-xs font-semibold uppercase tracking-[.2em] text-[#8B5BC7]">{expiredShop.name}</p><h1 className="mt-4 font-[family-name:var(--font-playfair)] text-4xl font-medium">This shop is temporarily unavailable</h1><p className="mt-4 max-w-xl text-sm leading-7 text-[#625B68]">The shop is taking a short break while its marketplace subscription is renewed. Browse other local shops while you wait.</p><Link href="/shop" className="mt-7 rounded-full bg-[#55239A] px-6 py-3 text-sm font-semibold text-white">Browse all shops</Link></main></StorefrontFrame>;
  if (!shop) notFound();

  const chatUrl = buildWhatsAppUrl(shop.whatsappNumber, `Hello ${shop.name}, I have a question about your shop.`);
  const socials = [
    ["Instagram", shop.instagramUrl],
    ["Snapchat", shop.snapchatUrl],
    ["TikTok", shop.tiktokUrl],
    ["Facebook", shop.facebookUrl],
    ["Website", shop.websiteUrl],
  ].filter((social): social is [string, string] => Boolean(social[1]));

  return <StorefrontFrame settings={settings} showWhatsAppFab={false}>
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8"><Link href="/shop" className="inline-flex items-center gap-2 text-xs font-medium text-[#625B68] hover:text-[#55239A]"><ArrowLeft size={14} /> Back to all shops</Link></div>
    <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
      <div className="relative h-48 overflow-hidden rounded-[1.5rem] bg-[linear-gradient(135deg,#35115F,#8B5BC7)] sm:h-64 sm:rounded-[2rem]">{shop.bannerUrl && <Image src={shop.bannerUrl} alt={`${shop.name} banner`} fill preload unoptimized sizes="100vw" className="object-cover" />}<div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/5" /></div>
      <div className="relative -mt-12 flex flex-col gap-5 px-4 sm:-mt-16 sm:flex-row sm:items-end sm:justify-between sm:px-8">
        <div className="flex items-end gap-4"><div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-3xl border-4 border-white bg-[#F5F1F8] font-[family-name:var(--font-playfair)] text-3xl font-semibold text-[#55239A] shadow-md sm:h-32 sm:w-32">{shop.logoUrl ? <Image src={shop.logoUrl} alt={`${shop.name} logo`} fill unoptimized sizes="128px" className="object-cover" /> : shop.name.slice(0, 1)}</div><div className="pb-1"><p className="mb-1 text-[10px] font-semibold uppercase tracking-[.18em] text-[#8B5BC7]">Local shop</p><h1 className="font-[family-name:var(--font-playfair)] text-3xl font-medium leading-tight text-[#17141C] sm:text-4xl">{shop.name}</h1>{shop.location && <p className="mt-2 flex items-center gap-1.5 text-xs text-[#625B68]"><MapPin size={14} />{shop.location}</p>}</div></div>
        {chatUrl && <a href={chatUrl} target="_blank" rel="noreferrer" className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#55239A] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#35115F] sm:w-auto"><MessageCircle size={18} /> Chat with shop</a>}
      </div>
      <div className="mt-7 grid gap-6 border-b border-[#E6E0EB] px-4 pb-7 sm:grid-cols-[1fr_auto] sm:px-8">
        <div>{shop.bio && <p className="max-w-3xl whitespace-pre-line text-sm leading-7 text-[#625B68]">{shop.bio}</p>}<div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">{socials.map(([label, url]) => <a key={label} href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-medium text-[#55239A] hover:underline">{label === "Instagram" ? <Instagram size={14} /> : label === "Website" ? <Globe2 size={14} /> : null}{label}</a>)}</div></div>
        <div className="self-end"><ReportDialog shopId={shop.id} subjectName={shop.name} subjectType="shop" /></div>
      </div>
    </section>
    <section className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <div className="mb-7 flex items-end justify-between"><div><p className="mb-2 text-[10px] font-semibold uppercase tracking-[.2em] text-[#8B5BC7]">Shop the collection</p><h2 className="font-[family-name:var(--font-playfair)] text-3xl font-medium">Pieces from {shop.name}</h2></div><span className="text-xs text-[#625B68]">{products.length} {products.length === 1 ? "piece" : "pieces"}</span></div>
      <CatalogProductGrid products={products} currency={settings.currency} emptyMessage="This shop is getting its collection ready. Check back soon." />
    </section>
    {chatUrl && <a href={chatUrl} target="_blank" rel="noreferrer" aria-label={`Chat with ${shop.name} on WhatsApp`} className="fixed bottom-5 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-[#18794E] px-5 py-3.5 text-sm font-semibold text-white shadow-xl shadow-black/15 transition hover:-translate-y-0.5 hover:bg-[#12603D] sm:bottom-7 sm:right-7"><MessageCircle size={18} /> Chat with shop</a>}
  </StorefrontFrame>;
}
