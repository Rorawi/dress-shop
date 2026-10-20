import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Sparkles } from "lucide-react";
import CatalogProductGrid from "@/components/storefront/CatalogProductGrid";
import StorefrontFrame from "@/components/storefront/StorefrontFrame";
import { getCatalogData } from "@/lib/catalog";

const categories = [
  { slug: "boxers", label: "Boxers", description: "Reliable everyday comfort", image: "photo-1551232864-3f0890e580d9" },
  { slug: "singlets", label: "Singlets", description: "Easy base layers", image: "photo-1598033129183-c4f50c736f10" },
  { slug: "t-shirts", label: "Plain T-shirts", description: "Keep the essentials simple", image: "photo-1521572163474-6864f9cf17ab" },
  { slug: "shirts", label: "Shirts", description: "Easy everyday layers", image: "photo-1598033129183-c4f50c736f10" },
  { slug: "matching-sets", label: "Matching sets", description: "Coordinated from top to bottom", image: "photo-1496747611176-843222e1e57c" },
  { slug: "thrift-finds", label: "Thrift Finds", description: "One-off pieces, picked with care", image: "photo-1490481651871-ab68de25d43d", tag: "Thrift Finds" },
  { slug: "dresses", label: "Dresses", description: "Find your moment", image: "photo-1496747611176-843222e1e57c" },
  { slug: "polos", label: "Polos", description: "Made for the everyday", image: "photo-1625910513413-5fc45e21c8d4" },
  { slug: "underwear", label: "Intimates", description: "Comfort, close to you", image: "photo-1551232864-3f0890e580d9", department: "underwear" },
];

export default async function HomePage() {
  const { products, settings } = await getCatalogData();
  const newest = [...products].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 4);
  const featured = products.filter((product) => product.isFeatured).slice(0, 4);
  const popular = products.filter((product) => product.tags.some((tag) => tag.slug === "popular")).slice(0, 4);
  const seasonal = products.filter((product) => settings.featuredSeasonTag && product.tags.some((tag) => tag.name === settings.featuredSeasonTag)).slice(0, 4);
  const shownFeatured = featured.length ? featured : newest;

  return <StorefrontFrame settings={settings}>
    <section className="relative isolate min-h-[610px] overflow-hidden bg-[#E8E2EB] sm:min-h-[690px]">
      <Image src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=2200&q=90" alt="Friends enjoying a day out in their favorite styles" fill priority sizes="100vw" className="-z-20 object-cover object-center" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-white/95 via-white/78 to-white/10 sm:from-white/90 sm:via-white/55 sm:to-transparent" />
      <div className="mx-auto flex min-h-[610px] max-w-7xl items-center px-5 py-20 sm:min-h-[690px] sm:px-8 lg:px-10">
        <div className="max-w-xl animate-fade-in">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#55239A]/15 bg-white/75 px-4 py-2 text-[10px] font-semibold uppercase tracking-[.2em] text-[#55239A]"><Sparkles size={13} /> The Charwin edit</div>
          <h1 className="font-[family-name:var(--font-playfair)] text-[3.4rem] font-medium leading-[1.02] tracking-tight text-[#17141C] sm:text-7xl">Style that feels<br /><span className="italic text-[#55239A]">like you.</span></h1>
          <p className="mt-6 max-w-md text-sm leading-7 text-[#514954] sm:text-base">Thoughtful clothing and intimates for your days, your plans and everything in between. Find your next favorite.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/shop" className="inline-flex items-center gap-3 rounded-full bg-[#55239A] px-7 py-4 text-sm font-semibold text-white shadow-lg shadow-[#55239A]/15 transition hover:-translate-y-0.5 hover:bg-[#35115F]">Shop the collection <ArrowRight size={17} /></Link>
            <Link href="/shop?department=underwear" className="rounded-full border border-[#17141C]/20 bg-white/70 px-7 py-4 text-sm font-medium text-[#17141C] transition hover:border-[#55239A] hover:text-[#55239A]">Explore intimates</Link>
          </div>
          <div className="mt-10 flex items-center gap-3 text-xs text-[#625B68]"><span className="h-px w-9 bg-[#8B5BC7]" />Chosen with care. Worn with confidence.</div>
        </div>
      </div>
      <div className="absolute bottom-7 right-6 hidden text-[10px] uppercase tracking-[.25em] text-white [writing-mode:vertical-rl] sm:block">Charwin Stores · Ghana</div>
    </section>

    <section className="border-b border-[#E6E0EB] bg-white py-14 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-7 flex items-end justify-between"><div><p className="mb-2 text-[10px] font-semibold uppercase tracking-[.2em] text-[#8B5BC7]">Explore by edit</p><h2 className="font-[family-name:var(--font-playfair)] text-3xl font-medium sm:text-4xl">Find your kind of style</h2></div><Link href="/shop" className="hidden items-center gap-2 pb-1 text-xs font-semibold text-[#55239A] sm:inline-flex">See everything <ArrowRight size={14} /></Link></div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">{categories.map((category) => <Link key={category.slug} href={category.tag ? `/shop?tag=${encodeURIComponent(category.tag)}` : category.department ? `/shop?department=${category.department}` : `/shop?category=${category.slug}`} className="group relative aspect-[4/4.8] overflow-hidden rounded-2xl bg-[#E9E3EC] sm:rounded-3xl">
          <Image src={`https://images.unsplash.com/${category.image}?auto=format&fit=crop&w=900&q=85`} alt={category.label} fill sizes="(max-width:768px) 50vw,25vw" className="object-cover transition duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4 text-white sm:p-5"><p className="mb-1 text-[9px] font-semibold uppercase tracking-[.15em] text-white/70 sm:text-[10px]">{category.description}</p><div className="flex items-end justify-between gap-2"><h3 className="font-[family-name:var(--font-playfair)] text-lg sm:text-2xl">{category.label}</h3><span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur transition group-hover:bg-white group-hover:text-[#55239A]"><ArrowUpRight size={16} /></span></div></div>
        </Link>)}</div>
      </div>
    </section>

    <section className="bg-[#FCFBFD] py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between sm:mb-10"><div><p className="mb-2 text-[10px] font-semibold uppercase tracking-[.2em] text-[#8B5BC7]">Picked for the moment</p><h2 className="font-[family-name:var(--font-playfair)] text-3xl font-medium sm:text-4xl">The Charwin edit</h2><p className="mt-2 text-sm text-[#625B68]">A few pieces we can’t stop thinking about.</p></div><Link href="/shop" className="hidden items-center gap-2 pb-1 text-xs font-semibold text-[#55239A] sm:inline-flex">Shop all <ArrowRight size={14} /></Link></div>
        <CatalogProductGrid products={shownFeatured} currency={settings.currency} />
      </div>
    </section>

    <section className="bg-white py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between sm:mb-10"><div><p className="mb-2 text-[10px] font-semibold uppercase tracking-[.2em] text-[#8B5BC7]">Fresh on the rack</p><h2 className="font-[family-name:var(--font-playfair)] text-3xl font-medium sm:text-4xl">Just arrived</h2></div><Link href="/shop?sort=newest" className="hidden items-center gap-2 pb-1 text-xs font-semibold text-[#55239A] sm:inline-flex">View new arrivals <ArrowRight size={14} /></Link></div>
        <CatalogProductGrid products={newest} currency={settings.currency} />
      </div>
    </section>

    {popular.length > 0 && <section className="bg-[#FCFBFD] py-14 sm:py-20"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="mb-8 flex items-end justify-between sm:mb-10"><div><p className="mb-2 text-[10px] font-semibold uppercase tracking-[.2em] text-[#8B5BC7]">Loved around here</p><h2 className="font-[family-name:var(--font-playfair)] text-3xl font-medium sm:text-4xl">Popular picks</h2><p className="mt-2 text-sm text-[#625B68]">Pieces people keep coming back to.</p></div><Link href="/shop?tag=Popular" className="hidden items-center gap-2 pb-1 text-xs font-semibold text-[#55239A] sm:inline-flex">See what’s loved <ArrowRight size={14} /></Link></div><CatalogProductGrid products={popular} currency={settings.currency} /></div></section>}

    <section className="relative overflow-hidden bg-[#35115F] px-4 py-16 text-center text-white sm:py-24">
      <div className="pointer-events-none absolute left-[8%] top-0 h-64 w-64 rounded-full bg-[#8B5BC7]/20 blur-3xl" /><div className="pointer-events-none absolute bottom-[-7rem] right-[8%] h-72 w-72 rounded-full bg-[#55239A] blur-3xl" />
      <div className="relative mx-auto max-w-2xl"><p className="mb-4 text-[10px] font-semibold uppercase tracking-[.22em] text-[#D6C0F0]">The Charwin promise</p><h2 className="font-[family-name:var(--font-playfair)] text-4xl font-medium leading-tight sm:text-5xl">Good pieces. Good feeling.</h2><p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-white/70">We’re here to make finding something you love feel easy. Browse at your pace, then message us when you’re ready.</p><Link href="/shop" className="mt-8 inline-flex items-center gap-3 rounded-full bg-white px-7 py-4 text-sm font-semibold text-[#35115F] transition hover:bg-[#F1E8FA]">Explore the collection <ArrowRight size={16} /></Link></div>
    </section>

    {seasonal.length > 0 && <section className="bg-[#FCFBFD] py-14 sm:py-20"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="mb-8 flex items-end justify-between sm:mb-10"><div><p className="mb-2 text-[10px] font-semibold uppercase tracking-[.2em] text-[#8B5BC7]">A little something for the season</p><h2 className="font-[family-name:var(--font-playfair)] text-3xl font-medium sm:text-4xl">{settings.featuredSeasonTag} favorites</h2></div><Link href={`/shop?tag=${encodeURIComponent(settings.featuredSeasonTag ?? "")}`} className="hidden items-center gap-2 pb-1 text-xs font-semibold text-[#55239A] sm:inline-flex">Shop the edit <ArrowRight size={14} /></Link></div><CatalogProductGrid products={seasonal} currency={settings.currency} /></div></section>}
  </StorefrontFrame>;
}
