"use client";
/* eslint-disable @next/next/no-img-element -- The list displays public WebP files from Supabase Storage. */

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Copy, ExternalLink, Eye, EyeOff, LoaderCircle, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const PAGE_SIZE = 12;

export type AdminProduct = {
  id: string;
  name: string;
  slug: string;
  price: number | string;
  is_published: boolean;
  is_hidden: boolean;
  created_at: string;
  images: { storage_path: string | null; source_url: string | null; alt_text: string }[];
  variants: { stock: number }[];
};

export default function ProductList({ products }: { products: AdminProduct[] }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const filteredProducts = products.filter((product) => product.name.toLowerCase().includes(search.toLowerCase()));
  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visibleProducts = filteredProducts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const firstItem = filteredProducts.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0;
  const lastItem = Math.min(currentPage * PAGE_SIZE, filteredProducts.length);
  const pageWindowStart = Math.max(1, Math.min(currentPage - 2, pageCount - 4));
  const pageNumbers = Array.from({ length: Math.min(5, pageCount) }, (_, index) => pageWindowStart + index);
  const formatCurrency = (price: number | string) => new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS", maximumFractionDigits: 2 }).format(Number(price));

  async function toggleVisibility(product: AdminProduct) {
    setBusyId(product.id);
    setMessage("");
    const { error } = await supabase.from("products").update(product.is_published ? { is_published: false } : { is_published: true, is_hidden: false }).eq("id", product.id);
    setBusyId(null);
    if (error) return setMessage(error.message);
    router.refresh();
  }

  async function duplicateProduct(product: AdminProduct) {
    setBusyId(product.id);
    setMessage("");
    const newSlug = `${product.slug}-copy-${Date.now().toString(36)}`;
    const { data: copy, error } = await supabase.from("products").select("*").eq("id", product.id).single();
    if (error || !copy) { setBusyId(null); return setMessage(error?.message ?? "Could not read that product."); }
    const fields = Object.fromEntries(Object.entries(copy).filter(([key]) => !["id", "created_at", "updated_at"].includes(key)));
    const { data: created, error: insertError } = await supabase.from("products").insert({ ...fields, name: `${product.name} copy`, slug: newSlug, is_published: false, is_hidden: false, is_featured: false }).select("id").single();
    if (insertError || !created) { setBusyId(null); return setMessage(insertError?.message ?? "Could not duplicate that product."); }
    const [variantsResult, imagesResult, tagLinksResult, userResult] = await Promise.all([
      supabase.from("product_variants").select("size,color,stock").eq("product_id", product.id),
      supabase.from("product_images").select("storage_path,source_url,alt_text,position,is_primary,width,height").eq("product_id", product.id),
      supabase.from("product_tags").select("tag_id").eq("product_id", product.id),
      supabase.auth.getUser(),
    ]);
    const newStoragePaths: string[] = [];
    try {
      if (variantsResult.error || imagesResult.error || tagLinksResult.error) throw variantsResult.error ?? imagesResult.error ?? tagLinksResult.error;
      if (variantsResult.data?.length) {
        const { error: variantError } = await supabase.from("product_variants").insert(variantsResult.data.map((variant) => ({ ...variant, product_id: created.id })));
        if (variantError) throw variantError;
      }
      const duplicatedImages = [];
      for (const image of imagesResult.data ?? []) {
        let storagePath = image.storage_path;
        if (storagePath) {
          if (!userResult.data.user) throw new Error("Your admin session has expired. Sign in again.");
          const { data: imageBlob, error: downloadError } = await supabase.storage.from("product-images").download(storagePath);
          if (downloadError || !imageBlob) throw downloadError ?? new Error("Could not copy the product photo.");
          storagePath = `${userResult.data.user.id}/${created.id}/${crypto.randomUUID()}.webp`;
          const { error: uploadError } = await supabase.storage.from("product-images").upload(storagePath, imageBlob, { contentType: imageBlob.type || "image/webp", cacheControl: "31536000" });
          if (uploadError) throw uploadError;
          newStoragePaths.push(storagePath);
        }
        duplicatedImages.push({ ...image, product_id: created.id, storage_path: storagePath });
      }
      if (duplicatedImages.length) {
        const { error: imageError } = await supabase.from("product_images").insert(duplicatedImages);
        if (imageError) throw imageError;
      }
      if (tagLinksResult.data?.length) {
        const { error: tagError } = await supabase.from("product_tags").insert(tagLinksResult.data.map((tag) => ({ ...tag, product_id: created.id })));
        if (tagError) throw tagError;
      }
    } catch (duplicateError) {
      if (newStoragePaths.length) await supabase.storage.from("product-images").remove(newStoragePaths);
      await supabase.from("products").delete().eq("id", created.id);
      setBusyId(null);
      return setMessage(duplicateError instanceof Error ? duplicateError.message : "Could not finish duplicating the product.");
    }
    setBusyId(null);
    router.push(`/admin/products/${created.id}`);
    router.refresh();
  }

  async function deleteProduct(product: AdminProduct) {
    if (!window.confirm(`Delete “${product.name}” and its catalog details?`)) return;
    setBusyId(product.id);
    setMessage("");
    const { data: images } = await supabase.from("product_images").select("storage_path").eq("product_id", product.id);
    const paths = (images ?? []).flatMap((image) => image.storage_path ? [image.storage_path] : []);
    const { error } = await supabase.from("products").delete().eq("id", product.id);
    setBusyId(null);
    if (error) return setMessage(error.message);
    if (paths.length) {
      const { error: storageError } = await supabase.storage.from("product-images").remove(paths);
      if (storageError) setMessage(`Product deleted, but image cleanup needs attention: ${storageError.message}`);
    }
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <label className="flex min-w-[220px] items-center gap-2 rounded-full border border-[#e6e0eb] bg-white px-4 py-2.5 sm:w-80"><Search size={17} className="text-[#817888]" /><span className="sr-only">Search products</span><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search products" className="w-full bg-transparent text-sm outline-none placeholder:text-[#a49baa]" /></label>
        <Link href="/admin/products/new" className="inline-flex items-center gap-2 rounded-full bg-[#55239a] px-5 py-3 text-sm font-semibold text-white hover:bg-[#35115f]"><Plus size={17} /> Add product</Link>
      </div>
      {message && <p role="alert" className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{message}</p>}
      <div className="mt-6 overflow-hidden rounded-2xl border border-[#ece6f0] bg-white">
        <div className="hidden grid-cols-[minmax(240px,1fr)_130px_110px_220px] gap-4 border-b border-[#eee9f1] bg-[#fcfbfd] px-5 py-3 text-xs font-semibold uppercase tracking-[.12em] text-[#817888] md:grid"><span>Product</span><span>Status</span><span>Stock</span><span className="text-right">Actions</span></div>
        {visibleProducts.length === 0 ? <div className="px-6 py-16 text-center text-sm text-[#817888]">{search ? "No matching products." : "No products yet. Add your first shop find."}</div> : visibleProducts.map((product) => {
          const firstImage = product.images?.[0];
          const imageUrl = firstImage?.source_url || (firstImage?.storage_path ? supabase.storage.from("product-images").getPublicUrl(firstImage.storage_path).data.publicUrl : null);
          const stock = (product.variants ?? []).reduce((sum, variant) => sum + Number(variant.stock), 0);
          const soldOut = product.variants?.length > 0 && stock === 0;
          const busy = busyId === product.id;
          return (
            <article key={product.id} className="grid gap-4 border-b border-[#f0ecf2] px-4 py-4 last:border-0 sm:px-5 md:grid-cols-[minmax(240px,1fr)_130px_110px_220px] md:items-center">
              <div className="flex min-w-0 items-center gap-3">
                <div className="h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-[#f3eff5]">{imageUrl && <img src={imageUrl} alt={firstImage?.alt_text || product.name} className="h-full w-full object-cover" />}</div>
                <div className="min-w-0"><Link href={`/admin/products/${product.id}`} className="truncate text-sm font-semibold hover:text-[#55239a]">{product.name}</Link><p className="mt-1 truncate text-xs text-[#817888]">{formatCurrency(product.price)} · {product.slug}</p></div>
              </div>
              <div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${product.is_hidden ? "bg-slate-100 text-slate-700" : product.is_published ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>{product.is_hidden ? "Hidden" : product.is_published ? "Live" : "Draft"}</span></div>
              <p className={`text-sm ${soldOut ? "font-semibold text-[#b42318]" : "text-[#625b68]"}`}>{soldOut ? "Sold out" : `${stock} in stock`}</p>
              <div className="flex flex-wrap justify-start gap-1 md:justify-end">
                <button title={product.is_published ? "Unpublish" : "Publish"} disabled={busy} onClick={() => toggleVisibility(product)} className="rounded-lg p-2 text-[#625b68] hover:bg-[#f4eff9] hover:text-[#55239a] disabled:opacity-40">{busy ? <LoaderCircle size={17} className="animate-spin" /> : product.is_published ? <EyeOff size={17} /> : <Eye size={17} />}</button>
                <button title="Duplicate as draft" disabled={busy} onClick={() => duplicateProduct(product)} className="rounded-lg p-2 text-[#625b68] hover:bg-[#f4eff9] hover:text-[#55239a] disabled:opacity-40"><Copy size={17} /></button>
                <Link title="Edit product" href={`/admin/products/${product.id}`} className="rounded-lg p-2 text-[#625b68] hover:bg-[#f4eff9] hover:text-[#55239a]"><Pencil size={17} /></Link>
                <Link title="View on storefront" href={`/shop/${product.slug}`} target="_blank" className="rounded-lg p-2 text-[#625b68] hover:bg-[#f4eff9] hover:text-[#55239a]"><ExternalLink size={17} /></Link>
                <button title="Delete product" disabled={busy} onClick={() => deleteProduct(product)} className="rounded-lg p-2 text-[#817888] hover:bg-red-50 hover:text-[#b42318] disabled:opacity-40"><Trash2 size={17} /></button>
              </div>
            </article>
          );
        })}
      </div>
      {pageCount > 1 && <nav aria-label="Product pages" className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-[#817888]">Showing {firstItem}–{lastItem} of {filteredProducts.length} products</p>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setPage(currentPage - 1)} disabled={currentPage === 1} className="inline-flex items-center gap-1 rounded-full border border-[#e6e0eb] bg-white px-4 py-2.5 text-xs font-semibold text-[#55239a] transition hover:border-[#8b5bc7] disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft size={15} /> Previous</button>
          {pageNumbers.map((number) => <button key={number} type="button" onClick={() => setPage(number)} aria-current={number === currentPage ? "page" : undefined} aria-label={`Page ${number}`} className={`h-10 min-w-10 rounded-full border px-3 text-xs font-semibold transition ${number === currentPage ? "border-[#55239a] bg-[#55239a] text-white" : "border-[#e6e0eb] bg-white text-[#625b68] hover:border-[#8b5bc7]"}`}>{number}</button>)}
          <button type="button" onClick={() => setPage(currentPage + 1)} disabled={currentPage === pageCount} className="inline-flex items-center gap-1 rounded-full border border-[#e6e0eb] bg-white px-4 py-2.5 text-xs font-semibold text-[#55239a] transition hover:border-[#8b5bc7] disabled:cursor-not-allowed disabled:opacity-40">Next <ChevronRight size={15} /></button>
        </div>
      </nav>}
    </>
  );
}
