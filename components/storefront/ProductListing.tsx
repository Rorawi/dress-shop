"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, X } from "lucide-react";
import type { CatalogProduct } from "@/lib/catalog-types";
import CatalogProductGrid from "@/components/storefront/CatalogProductGrid";

type Filters = Record<string, string | undefined>;

const titleCase = (value: string) => value.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const preferredCategoryOrder = ["boxers", "singlets", "t-shirts", "shirts", "matching-sets", "jumpsuits"];

function editDistance(a: string, b: string) {
  const row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let diagonal = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const previous = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1));
      diagonal = previous;
    }
  }
  return row[b.length];
}

function fuzzyMatch(query: string, product: CatalogProduct) {
  const fields = [product.name, product.description, product.brand?.name ?? "", product.category.name, product.subcategory?.name ?? "", product.style ?? "", ...product.variants.flatMap((variant) => [variant.color, variant.size]), ...product.tags.map((tag) => tag.name)].map(normalize);
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  return terms.every((term) => fields.some((field) => {
    if (field.includes(term)) return true;
    return field.split(/[^a-z0-9]+/).some((word) => word.length >= 4 && term.length >= 4 && editDistance(term, word) <= Math.max(1, Math.floor(term.length / 4)));
  }));
}

export default function ProductListing({ products, initialFilters = {}, currency = "GHS" }: { products: CatalogProduct[]; initialFilters?: Filters; currency?: string }) {
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [showFilters, setShowFilters] = useState(false);
  useEffect(() => setFilters(initialFilters), [initialFilters]);
  const brands = unique(products.map((product) => product.brand?.name ?? ""));
  const categories = unique(products.map((product) => product.subcategory?.slug ?? "")).sort((a, b) => {
    const aPriority = preferredCategoryOrder.indexOf(a);
    const bPriority = preferredCategoryOrder.indexOf(b);
    if (aPriority === -1 && bPriority === -1) return a.localeCompare(b);
    if (aPriority === -1) return 1;
    if (bPriority === -1) return -1;
    return aPriority - bPriority;
  });
  const colors = unique(products.flatMap((product) => product.variants.map((variant) => variant.color)));
  const sizes = unique(products.flatMap((product) => product.variants.map((variant) => variant.size)));
  const sleeves = unique(products.map((product) => product.sleeveLength ?? ""));
  const tags = unique(products.flatMap((product) => product.tags.map((tag) => tag.name)));
  const maxPrice = Math.max(0, ...products.map((product) => product.price));

  const update = (key: string, value: string) => {
    const next = { ...filters, [key]: value || undefined };
    setFilters(next);
    const params = new URLSearchParams();
    Object.entries(next).forEach(([name, entry]) => { if (entry) params.set(name, entry); });
    window.history.replaceState(null, "", params.size ? `/shop?${params.toString()}` : "/shop");
  };

  const reset = () => {
    setFilters({});
    window.history.replaceState(null, "", "/shop");
  };

  const filtered = useMemo(() => {
    const result = products.filter((product) => {
      if (filters.q && !fuzzyMatch(filters.q, product)) return false;
      if (filters.department && filters.department !== product.category.department) return false;
      if (filters.category && filters.category !== product.subcategory?.slug) return false;
      if (filters.gender && filters.gender !== product.gender) return false;
      if (filters.brand && filters.brand !== product.brand?.name) return false;
      if (filters.color && !product.variants.some((variant) => variant.color === filters.color)) return false;
      if (filters.size && !product.variants.some((variant) => variant.size === filters.size && variant.stock > 0)) return false;
      if (filters.sleeveLength && filters.sleeveLength !== product.sleeveLength) return false;
      if (filters.tag && !product.tags.some((tag) => tag.name === filters.tag)) return false;
      if (filters.minPrice && product.price < Number(filters.minPrice)) return false;
      if (filters.maxPrice && product.price > Number(filters.maxPrice)) return false;
      return true;
    });
    return result.sort((a, b) => {
      if (filters.sort === "price-low") return a.price - b.price;
      if (filters.sort === "price-high") return b.price - a.price;
      if (filters.sort === "popular") return Number(b.tags.some((tag) => tag.slug === "popular")) - Number(a.tags.some((tag) => tag.slug === "popular"));
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [filters, products]);

  const heading = filters.tag === "Thrift Finds" ? "Thrift Finds" : filters.department === "underwear" ? "Underwear & intimates" : filters.department === "clothing" ? "Clothing" : filters.category ? titleCase(filters.category) : "The collection";
  const emptyMessage = filters.tag === "Thrift Finds"
    ? "No thrift pieces are listed just yet. Check back soon."
    : "No products found. Try another search or clear some filters.";

  const filterControls = <div className="space-y-5">
    <label className="block text-xs font-semibold uppercase tracking-wider text-[#625B68]">Department<select value={filters.department ?? ""} onChange={(event) => update("department", event.target.value)} className="mt-2 w-full rounded-xl border border-[#E6E0EB] bg-white px-3 py-3 text-sm font-normal normal-case tracking-normal text-[#17141C] outline-none focus:border-[#8B5BC7]"><option value="">All departments</option><option value="clothing">Clothing</option><option value="underwear">Underwear</option></select></label>
    <label className="block text-xs font-semibold uppercase tracking-wider text-[#625B68]">Category<select value={filters.category ?? ""} onChange={(event) => update("category", event.target.value)} className="mt-2 w-full rounded-xl border border-[#E6E0EB] bg-white px-3 py-3 text-sm font-normal normal-case tracking-normal text-[#17141C] outline-none focus:border-[#8B5BC7]"><option value="">All categories</option>{categories.map((item) => <option key={item} value={item}>{titleCase(item)}</option>)}</select></label>
    <label className="block text-xs font-semibold uppercase tracking-wider text-[#625B68]">Gender<select value={filters.gender ?? ""} onChange={(event) => update("gender", event.target.value)} className="mt-2 w-full rounded-xl border border-[#E6E0EB] bg-white px-3 py-3 text-sm font-normal normal-case tracking-normal text-[#17141C] outline-none focus:border-[#8B5BC7]"><option value="">Any</option><option value="women">Women</option><option value="men">Men</option><option value="unisex">Unisex</option><option value="kids">Kids</option></select></label>
    <label className="block text-xs font-semibold uppercase tracking-wider text-[#625B68]">Brand<select value={filters.brand ?? ""} onChange={(event) => update("brand", event.target.value)} className="mt-2 w-full rounded-xl border border-[#E6E0EB] bg-white px-3 py-3 text-sm font-normal normal-case tracking-normal text-[#17141C] outline-none focus:border-[#8B5BC7]"><option value="">All brands</option>{brands.map((brand) => <option key={brand}>{brand}</option>)}</select></label>
    <label className="block text-xs font-semibold uppercase tracking-wider text-[#625B68]">Colour<select value={filters.color ?? ""} onChange={(event) => update("color", event.target.value)} className="mt-2 w-full rounded-xl border border-[#E6E0EB] bg-white px-3 py-3 text-sm font-normal normal-case tracking-normal text-[#17141C] outline-none focus:border-[#8B5BC7]"><option value="">All colours</option>{colors.map((color) => <option key={color}>{color}</option>)}</select></label>
    <label className="block text-xs font-semibold uppercase tracking-wider text-[#625B68]">Size<select value={filters.size ?? ""} onChange={(event) => update("size", event.target.value)} className="mt-2 w-full rounded-xl border border-[#E6E0EB] bg-white px-3 py-3 text-sm font-normal normal-case tracking-normal text-[#17141C] outline-none focus:border-[#8B5BC7]"><option value="">All sizes</option>{sizes.map((size) => <option key={size}>{size}</option>)}</select></label>
    <label className="block text-xs font-semibold uppercase tracking-wider text-[#625B68]">Sleeve length<select value={filters.sleeveLength ?? ""} onChange={(event) => update("sleeveLength", event.target.value)} className="mt-2 w-full rounded-xl border border-[#E6E0EB] bg-white px-3 py-3 text-sm font-normal normal-case tracking-normal text-[#17141C] outline-none focus:border-[#8B5BC7]"><option value="">Any</option>{sleeves.map((sleeve) => <option key={sleeve} value={sleeve}>{titleCase(sleeve)}</option>)}</select></label>
    <label className="block text-xs font-semibold uppercase tracking-wider text-[#625B68]">Collection<select value={filters.tag ?? ""} onChange={(event) => update("tag", event.target.value)} className="mt-2 w-full rounded-xl border border-[#E6E0EB] bg-white px-3 py-3 text-sm font-normal normal-case tracking-normal text-[#17141C] outline-none focus:border-[#8B5BC7]"><option value="">Any collection</option>{tags.map((tag) => <option key={tag}>{tag}</option>)}</select></label>
    <div><p className="text-xs font-semibold uppercase tracking-wider text-[#625B68]">Price range</p><div className="mt-2 grid grid-cols-2 gap-2"><label className="sr-only" htmlFor="min-price">Minimum price</label><input id="min-price" type="number" min="0" placeholder="Min" value={filters.minPrice ?? ""} onChange={(event) => update("minPrice", event.target.value)} className="min-w-0 rounded-xl border border-[#E6E0EB] px-3 py-3 text-sm outline-none focus:border-[#8B5BC7]" /><label className="sr-only" htmlFor="max-price">Maximum price</label><input id="max-price" type="number" min="0" max={maxPrice} placeholder="Max" value={filters.maxPrice ?? ""} onChange={(event) => update("maxPrice", event.target.value)} className="min-w-0 rounded-xl border border-[#E6E0EB] px-3 py-3 text-sm outline-none focus:border-[#8B5BC7]" /></div></div>
    <button onClick={reset} className="w-full rounded-full border border-[#D9D1E0] py-3 text-xs font-semibold text-[#55239A] hover:bg-[#F5F1F8]">Clear all filters</button>
  </div>;

  return <>
    <section className="border-b border-[#E6E0EB] bg-[#F8F5FA]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-11 lg:px-8">
        <div className="mb-5 flex items-center gap-2 text-[11px] text-[#8B8490]"><Link href="/" className="hover:text-[#55239A]">Home</Link><span>/</span><span className="text-[#625B68]">Shop</span></div>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="mb-2 text-[10px] font-semibold uppercase tracking-[.2em] text-[#8B5BC7]">Curated for you</p><h1 className="font-[family-name:var(--font-playfair)] text-4xl font-medium capitalize leading-tight text-[#17141C] sm:text-5xl">{heading}</h1><p className="mt-2 text-sm text-[#625B68]">{filtered.length} thoughtfully chosen {filtered.length === 1 ? "piece" : "pieces"}</p></div>
          <label className="relative block w-full sm:max-w-sm"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B8490]" size={17} /><input type="search" value={filters.q ?? ""} onChange={(event) => update("q", event.target.value)} placeholder="Search styles, brands, colours…" className="w-full rounded-full border border-[#E6E0EB] bg-white py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-[#8B5BC7]" /></label>
        </div>
      </div>
    </section>
    <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
      <div className="mb-6 flex items-center justify-between gap-3 lg:hidden">
        <button onClick={() => setShowFilters((show) => !show)} className="inline-flex items-center gap-2 rounded-full border border-[#E6E0EB] px-4 py-2.5 text-xs font-semibold"><SlidersHorizontal size={15} /> Filters {showFilters ? <X size={14} /> : null}</button>
        <label className="flex items-center gap-2 text-xs text-[#625B68]">Sort<select value={filters.sort ?? "newest"} onChange={(event) => update("sort", event.target.value)} className="rounded-full border border-[#E6E0EB] bg-white px-3 py-2.5 text-xs text-[#17141C] outline-none"><option value="newest">Newest</option><option value="popular">Popular</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select></label>
      </div>
      <div className="grid gap-8 lg:grid-cols-[220px_1fr] xl:grid-cols-[240px_1fr]">
        <aside className={`${showFilters ? "block" : "hidden"} lg:block`}><div className="sticky top-28 rounded-2xl border border-[#EEEAF0] bg-white p-5"><div className="mb-5 flex items-center justify-between"><h2 className="font-[family-name:var(--font-playfair)] text-xl">Refine</h2><span className="text-[10px] text-[#8B8490]">{currency}</span></div>{filterControls}</div></aside>
        <div><div className="mb-6 hidden items-center justify-between lg:flex"><p className="text-xs text-[#625B68]">Showing <span className="font-semibold text-[#17141C]">{filtered.length}</span> of {products.length} pieces</p><label className="flex items-center gap-2 text-xs text-[#625B68]">Sort by <select value={filters.sort ?? "newest"} onChange={(event) => update("sort", event.target.value)} className="rounded-full border border-[#E6E0EB] bg-white px-4 py-2.5 text-xs text-[#17141C] outline-none"><option value="newest">Newest</option><option value="popular">Popular</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select></label></div>
          {filters.department === "underwear" && <div className="mb-6 flex items-start gap-3 rounded-2xl bg-[#F8F5FA] px-4 py-3 text-xs leading-5 text-[#625B68]"><span className="mt-0.5 font-semibold text-[#55239A]">18+</span><p>Intimate product images are blurred. Choose “I’m 18+ — show image” on a product image to reveal them for this browser.</p></div>}
          <CatalogProductGrid products={filtered} emptyMessage={emptyMessage} currency={currency} />
        </div>
      </div>
    </div>
  </>;
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}
