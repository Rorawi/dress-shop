"use client";
/* eslint-disable @next/next/no-img-element -- These are optimized Supabase WebP uploads shown in the admin intake list. */

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Check, ImagePlus, LoaderCircle, Pencil, Upload } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { optimizePhoto } from "@/lib/admin/image-utils";
import type { AdminCategoryOption, AdminShopOption, AdminSubcategoryOption } from "@/components/admin/types";
import WhatsAppImport from "@/components/admin/whatsapp-import";

type DraftCard = {
  id: string;
  name: string;
  categoryId: string;
  subcategoryId: string;
  price: string;
  imageUrl: string;
};

const slugify = (text: string) => text.normalize("NFKD").toLowerCase().trim().replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export default function QuickUpload({ categories, subcategories, shops }: { categories: AdminCategoryOption[]; subcategories: AdminSubcategoryOption[]; shops: AdminShopOption[] }) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();
  const galleryInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const [drafts, setDrafts] = useState<DraftCard[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [shopId, setShopId] = useState(shops.find((shop) => shop.status === "active")?.id ?? shops[0]?.id ?? "");

  function updateDraft(id: string, key: "name" | "categoryId" | "subcategoryId" | "price", value: string) {
    setDrafts((current) => current.map((draft) => draft.id === id ? { ...draft, [key]: value } : draft));
  }

  async function createDrafts(fileList: FileList | null) {
    if (!fileList?.length) return;
    if (!categories.length) { setError("Add a category in Shop settings before uploading products."); return; }
    if (!shopId) { setError("Choose a seller shop before uploading products."); return; }
    const files = Array.from(fileList);
    setUploading(true); setError(""); setMessage("");
    if (galleryInput.current) galleryInput.current.value = "";
    if (cameraInput.current) cameraInput.current.value = "";
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setUploading(false); setError("Your admin session has expired. Sign in again to upload photos."); return; }

    const defaultCategory = categories[0];
    const defaultSubcategory = subcategories.find((subcategory) => subcategory.category_id === defaultCategory.id);
    let completed = 0;
    for (const [index, file] of files.entries()) {
      setProgress(`Creating draft ${index + 1} of ${files.length}: ${file.name}`);
      let productId: string | null = null;
      let path: string | null = null;
      try {
        const baseName = file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 110);
        const name = baseName || "New shop find";
        const idSuffix = crypto.randomUUID().slice(0, 8);
        const { data: product, error: productError } = await supabase.from("products").insert({
          shop_id: shopId,
          name,
          slug: `${slugify(name) || "new-shop-find"}-${idSuffix}`,
          category_id: defaultCategory.id,
          subcategory_id: defaultSubcategory?.id ?? null,
          gender: "unisex",
          price: 0,
          description: "",
          is_published: false,
          moderation_status: "pending",
        }).select("id").single();
        if (productError || !product) throw productError ?? new Error("Could not make a draft product.");
        productId = product.id;
        const optimized = await optimizePhoto(file);
        path = `${shopId}/${productId}/${crypto.randomUUID()}.webp`;
        const { error: uploadError } = await supabase.storage.from("product-images").upload(path, optimized, { contentType: "image/webp", upsert: false, cacheControl: "31536000" });
        if (uploadError) throw uploadError;
        const { error: imageError } = await supabase.from("product_images").insert({ product_id: productId, storage_path: path, alt_text: name, position: 0, is_primary: true });
        if (imageError) throw imageError;
        const imageUrl = supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
        setDrafts((current) => [{ id: productId!, name, categoryId: defaultCategory.id, subcategoryId: defaultSubcategory?.id ?? "", price: "0", imageUrl }, ...current]);
        completed += 1;
      } catch (uploadError) {
        if (path) await supabase.storage.from("product-images").remove([path]);
        if (productId) await supabase.from("products").delete().eq("id", productId);
        setError((current) => current ? `${current}\n${file.name}: ${uploadError instanceof Error ? uploadError.message : "upload failed"}` : `${file.name}: ${uploadError instanceof Error ? uploadError.message : "upload failed"}`);
      }
    }
    setUploading(false); setProgress("");
    if (completed) setMessage(`${completed} ${completed === 1 ? "draft is" : "drafts are"} ready. Add the product details before publishing.`);
    router.refresh();
  }

  async function persistDraft(draft: DraftCard) {
    const name = draft.name.trim();
    const price = Number(draft.price);
    if (!name || !draft.categoryId || !Number.isFinite(price) || price < 0) throw new Error(`Check the name, category and price for “${draft.name || "Untitled"}”.`);
    const { error: productError } = await supabase.from("products").update({
      name,
      slug: `${slugify(name) || "new-shop-find"}-${draft.id.slice(0, 8)}`,
      category_id: draft.categoryId,
      subcategory_id: draft.subcategoryId || null,
      price,
    }).eq("id", draft.id);
    if (productError) throw productError;
  }

  async function saveDraft(draft: DraftCard, openSizeEditor = false) {
    setBusyId(draft.id); setError(""); setMessage("");
    try {
      await persistDraft(draft);
      if (openSizeEditor) {
        router.push(`/admin/products/${draft.id}`);
        return;
      }
      setMessage(`“${draft.name}” saved as a draft.`);
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save this product.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div><p className="text-sm font-semibold tracking-[.18em] text-[#8b5bc7]">QUICK INTAKE</p><h1 className="mt-2 text-4xl">Add new finds</h1><p className="mt-2 max-w-xl text-sm leading-6 text-[#625b68]">Choose a batch of product photos. Each photo gets its own draft listing; set its sizes and stock before publishing from the product editor.</p></div>
        <Link href="/admin/products" className="text-sm font-semibold text-[#55239a] hover:underline">All products →</Link>
      </div>

      <div className="mt-7 max-w-md"><label className="block text-sm font-semibold">Add drafts to shop<select className="mt-2 w-full rounded-xl border border-[#e6e0eb] bg-white px-4 py-3 text-sm" value={shopId} onChange={(event) => setShopId(event.target.value)}><option value="">Choose a seller shop</option>{shops.map((shop) => <option key={shop.id} value={shop.id}>{shop.name} · {shop.status}</option>)}</select></label></div>
      <WhatsAppImport categories={categories} subcategories={subcategories} shopId={shopId} />

      <section className="mt-8 rounded-2xl border border-[#e9e1f0] bg-white p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div><h2 className="text-2xl">Upload product photos</h2><p className="mt-1 text-sm text-[#817888]">JPG, PNG, WebP and phone photos. Images are optimized before upload.</p></div>
          <div className="flex flex-wrap gap-3">
            <button type="button" disabled={uploading || categories.length === 0 || !shopId} onClick={() => galleryInput.current?.click()} className="inline-flex items-center gap-2 rounded-full border border-[#d9cce7] px-5 py-3 text-sm font-semibold text-[#55239a] hover:bg-[#f8f4fc] disabled:opacity-50"><ImagePlus size={17} /> Choose photos</button>
            <button type="button" disabled={uploading || categories.length === 0} onClick={() => cameraInput.current?.click()} className="inline-flex items-center gap-2 rounded-full bg-[#55239a] px-5 py-3 text-sm font-semibold text-white hover:bg-[#35115f] disabled:opacity-50"><Camera size={17} /> Take photo</button>
          </div>
          <input ref={galleryInput} type="file" accept="image/*" multiple className="sr-only" onChange={(event) => createDrafts(event.target.files)} />
          <input ref={cameraInput} type="file" accept="image/*" capture="environment" className="sr-only" onChange={(event) => createDrafts(event.target.files)} />
        </div>
        {categories.length === 0 && <p className="mt-5 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-950">Add a category in <Link href="/admin/settings" className="font-semibold underline">Shop settings</Link> first.</p>}
        {uploading && <p role="status" className="mt-5 flex items-center gap-2 rounded-xl bg-[#f8f4fc] px-4 py-3 text-sm text-[#55239a]"><LoaderCircle size={17} className="animate-spin" />{progress || "Working…"}</p>}
        {error && <p role="alert" className="mt-5 whitespace-pre-line rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
        {message && <p role="status" className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800"><Check size={16} />{message}</p>}
      </section>

      <section className="mt-8">
        <div className="mb-4"><h2 className="text-2xl">Drafts from this session</h2><p className="mt-1 text-sm text-[#817888]">Update the quick details, then set sizes and stock before publishing.</p></div>
        {drafts.length === 0 ? <div className="rounded-2xl border border-dashed border-[#d9cce7] bg-white/60 px-6 py-16 text-center"><Upload className="mx-auto mb-3 text-[#8b5bc7]" /><p className="font-semibold">Your new drafts will appear here.</p><p className="mt-1 text-sm text-[#817888]">Add a few photos above to get started.</p></div> : <div className="grid gap-4 xl:grid-cols-2">{drafts.map((draft) => <article key={draft.id} className="overflow-hidden rounded-2xl border border-[#ece6f0] bg-white">
          <div className="grid sm:grid-cols-[170px_1fr]">
            <div className="relative aspect-square bg-[#f3eff5] sm:aspect-auto sm:min-h-[225px]"><img src={draft.imageUrl} alt={draft.name} className="h-full w-full object-cover" /><span className="absolute bottom-3 left-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-[#625b68]">Draft</span></div>
            <div className="p-4 sm:p-5">
              <label className="block text-xs font-semibold text-[#625b68]">Product name<input className="mt-1.5 w-full rounded-lg border border-[#e6e0eb] px-3 py-2.5 text-sm font-normal text-[#17141c] outline-none focus:border-[#8b5bc7]" value={draft.name} onChange={(event) => updateDraft(draft.id, "name", event.target.value)} /></label>
              <div className="mt-3"><label className="block text-xs font-semibold text-[#625b68]">Price (GHS)<input className="mt-1.5 w-full rounded-lg border border-[#e6e0eb] px-3 py-2.5 text-sm font-normal text-[#17141c] outline-none focus:border-[#8b5bc7]" type="number" min="0" step="0.01" value={draft.price} onChange={(event) => updateDraft(draft.id, "price", event.target.value)} /></label></div>
              <label className="mt-3 block text-xs font-semibold text-[#625b68]">Category<select className="mt-1.5 w-full rounded-lg border border-[#e6e0eb] bg-white px-3 py-2.5 text-sm font-normal text-[#17141c]" value={draft.categoryId} onChange={(event) => { const nextCategory = event.target.value; setDrafts((current) => current.map((item) => item.id === draft.id ? { ...item, categoryId: nextCategory, subcategoryId: subcategories.find((subcategory) => subcategory.category_id === nextCategory)?.id ?? "" } : item)); }}>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
              <label className="mt-3 block text-xs font-semibold text-[#625b68]">Shop section<select className="mt-1.5 w-full rounded-lg border border-[#e6e0eb] bg-white px-3 py-2.5 text-sm font-normal text-[#17141c]" value={draft.subcategoryId} onChange={(event) => updateDraft(draft.id, "subcategoryId", event.target.value)}><option value="">Choose section</option>{subcategories.filter((subcategory) => subcategory.category_id === draft.categoryId).map((subcategory) => <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>)}</select></label>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><button type="button" disabled={uploading || busyId === draft.id} onClick={() => saveDraft(draft, true)} className="inline-flex items-center gap-1 text-xs font-semibold text-[#55239a] hover:underline disabled:opacity-50"><Pencil size={14} /> {busyId === draft.id ? "Saving…" : "Save & set sizes and stock"}</button><button type="button" disabled={uploading || busyId === draft.id} onClick={() => saveDraft(draft)} className="rounded-full border border-[#d9cce7] px-3.5 py-2 text-xs font-semibold text-[#55239a] hover:bg-[#f8f4fc] disabled:opacity-50">{busyId === draft.id ? "Saving…" : "Save draft"}</button></div>
            </div>
          </div>
        </article>)}</div>}
      </section>
    </div>
  );
}
